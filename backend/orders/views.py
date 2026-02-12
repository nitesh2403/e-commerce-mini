from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from .models import Order, OrderItem
from .serializers import OrderSerializer
from cart.models import Cart
from products.models import Product

class OrderViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin' or user.is_staff:
            # Show orders that contain items created by this admin
            # distinct() is needed because a single order might have multiple items from same vendor
            return Order.objects.filter(items__product__created_by=user).distinct().order_by('-created_at')
        
        # Regular users see their own orders
        return Order.objects.filter(user=user).order_by('-created_at')

    def update(self, request, *args, **kwargs):
        if not (request.user.is_staff or request.user.role == 'admin'):
            return Response({'error': 'Not authorized to update orders'}, status=status.HTTP_403_FORBIDDEN)
        
        # Vendor Specific Logic
        if request.user.role == 'admin' and not request.user.is_superuser:
            order = self.get_object()
            new_status = request.data.get('status')
            
            if new_status:
                with transaction.atomic():
                    # 1. Update Vendor's Items (excluding cancelled ones)
                    vendor_items = order.items.filter(product__created_by=request.user).exclude(status='cancelled')
                    vendor_items.update(status=new_status)
                    
                    # 2. Update Global Order Status based on ALL items
                    # Re-fetch all active items to check global state
                    all_active_items = order.items.exclude(status='cancelled')
                    
                    if not all_active_items.exists():
                         order.status = 'cancelled'
                    else:
                        item_statuses = set(item.status for item in all_active_items)
                        
                        if 'placed' not in item_statuses and 'shipped' not in item_statuses and 'delivered' in item_statuses:
                             # All are delivered (and maybe some cancelled, but no placed/shipped)
                             order.status = 'delivered'
                        elif 'shipped' in item_statuses or 'delivered' in item_statuses:
                             # At least one item is moved, so order is shipped
                             # (Unless all are delivered, which is caught above)
                             order.status = 'shipped'
                        else:
                             # All are placed
                             order.status = 'placed'
                    
                    order.save()
                    
            # Return the updated order (serializer will filter items for vendor view)
            serializer = self.get_serializer(order)
            return Response(serializer.data)

        return super().update(request, *args, **kwargs)


    @action(detail=False, methods=['post'])
    def place_order(self, request):
        user = request.user
        
        try:
            with transaction.atomic():
                # 1. Get User's Cart
                cart = Cart.objects.filter(user=user).first()
                if not cart or not cart.items.exists():
                    return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

                # 2. Validate Stock and Calculate Total
                total_amount = 0
                order_items_data = []

                for item in cart.items.select_related('product'):
                    product = item.product
                    if product.stock_quantity < item.quantity:
                        raise ValueError(f"Not enough stock for {product.name}. Available: {product.stock_quantity}")
                    
                    # Reduce Stock
                    product.stock_quantity -= item.quantity
                    product.save()

                    # Calculate price with discount
                    final_price = product.get_discounted_price()

                    total_amount += item.quantity * final_price
                    order_items_data.append({
                        'product': product,
                        'quantity': item.quantity,
                        'price': final_price
                    })

                # 3. Create Order
                order = Order.objects.create(
                    user=user,
                    total_amount=total_amount,
                    full_name=request.data.get('full_name', ''),
                    address=request.data.get('address', ''),
                    city=request.data.get('city', ''),
                    postal_code=request.data.get('postal_code', ''),
                    phone_number=request.data.get('phone_number', '')
                )

                # 4. Create Order Items
                for data in order_items_data:
                    OrderItem.objects.create(
                        order=order,
                        product=data['product'],
                        quantity=data['quantity'],
                        price_at_purchase=data['price']
                    )

                # 5. Clear Cart
                cart.items.all().delete()

                return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Something went wrong processing your order.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        order = self.get_object()
        
        # 1. Validation
        if order.user != request.user and not request.user.is_staff:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        if order.status not in ['placed', 'shipped']:
            return Response({'error': 'Only placed or shipped orders can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 2. Restore Stock and DELETE Active Items
                # We iterate a list() because we are modifying the queryset (deleting)
                for item in list(order.items.all()):
                    if item.status != 'cancelled':
                        product = item.product
                        product.stock_quantity += item.quantity
                        product.save()
                        # DELETE the item instead of marking cancelled (User Request)
                        item.delete()
                    # If item was already 'cancelled' (by vendor), we leave it as is
                    # so the customer knows the vendor cancelled it.

                # 3. Update Status or Delete Order
                # If all items are gone (meaning no vendor-cancelled items existed), delete order
                if not order.items.exists():
                     order.delete()
                     return Response({'status': 'Order deleted successfully'})
                else:
                    # If vendor-cancelled items remain, keep order but mark cancelled
                    order.status = 'cancelled'
                    order.total_amount = 0 
                    order.save()
                    return Response({'status': 'Order cancelled (active items removed)'})
                    
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def cancel_item(self, request, pk=None):
        order = self.get_object()
        item_id = request.data.get('item_id')
        cancel_quantity = int(request.data.get('quantity', 0))

        # 1. Validation
        if order.user != request.user and not request.user.is_staff:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        if order.status not in ['placed', 'shipped']:
            return Response({'error': 'Only placed or shipped orders can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                item = order.items.select_related('product').get(id=item_id)
                
                if item.status == 'cancelled':
                    return Response({'error': 'Item is already cancelled'}, status=status.HTTP_400_BAD_REQUEST)

                if cancel_quantity > 0 and cancel_quantity < item.quantity:
                    # PARTIAL CANCELLATION
                    # 1. Reduce quantity of active item
                    item.quantity -= cancel_quantity
                    item.save()
                    
                    # 2. Restore Stock
                    product = item.product
                    product.stock_quantity += cancel_quantity
                    product.save()

                    # 3. Update Order Total
                    refund_amount = item.price_at_purchase * cancel_quantity
                    order.total_amount = max(0, order.total_amount - refund_amount)
                    order.save()
                    
                    # NOTE: We do NOT create a "cancelled" item record for partials (User Request "just remove it")
                    
                    return Response({'status': f'Removed {cancel_quantity} items successfully', 'new_total': order.total_amount})
                
                else:
                    # FULL ITEM CANCELLATION (Default)
                    # 2. Restore Stock
                    product = item.product
                    product.stock_quantity += item.quantity
                    product.save()

                    # 3. Update Order Total
                    refund_amount = item.price_at_purchase * item.quantity
                    order.total_amount = max(0, order.total_amount - refund_amount)
                    order.save()

                    # 4. DELETE Item (User Request)
                    item.delete()

                    # 5. Check Order State
                    if not order.items.exists():
                        # If order is completely empty now, delete it
                        order.delete()
                        return Response({'status': 'Item removed. Order deleted as empty.', 'order_cancelled': True})
                    
                    elif not order.items.exclude(status='cancelled').exists():
                        # If only vendor-cancelled items remain
                        order.status = 'cancelled'
                        order.save()
                        return Response({'status': 'Item removed. Order status updated to cancelled.', 'order_cancelled': True})

                    return Response({'status': 'Item removed successfully', 'new_total': order.total_amount})

        except OrderItem.DoesNotExist:
             return Response({'error': 'Item not found in this order'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .models import Complaint
from .serializers import ComplaintSerializer, ComplaintUpdateSerializer

class ComplaintViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return ComplaintUpdateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        
        # STRICT ISOLATION: Everyone (including superusers) only sees complaints 
        # related to themselves (either as the customer or the vendor).
        
        # Vendor/Admin sees complaints against their products
        if user.role == 'admin' or user.is_staff or getattr(user, 'role', '') == 'vendor': 
             return Complaint.objects.filter(vendor=user).order_by('-created_at')

        # Customer sees their own complaints
        return Complaint.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        order_item = serializer.validated_data['order_item']
        
        if order_item.order.user != self.request.user:
            raise permissions.exceptions.PermissionDenied("You can only report items you purchased.")
            
        if order_item.order.status != 'delivered':
            raise serializers.ValidationError("You can only report issues for delivered orders.")
            
        if order_item.status == 'cancelled':
             raise serializers.ValidationError("Cannot report a cancelled item.")

        vendor = order_item.product.created_by
        if not vendor:
             raise serializers.ValidationError("Cannot file complaint: Product has no associated vendor.")

        serializer.save(user=self.request.user, vendor=vendor)
        
        # Notify the vendor
        from users.models import Notification
        Notification.objects.create(
            user=vendor,
            message=f"{self.request.user.username} has filed a report on {order_item.product.name}",
            action_link='/admin-dashboard?tab=complaints'
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        # Check if status has been updated to 'resolved' and notify the user
        if instance.status == 'resolved': 
            from users.models import Notification
            # Only create notification if one doesn't exist for this specific event to avoid duplicates
            Notification.objects.create(
                user=instance.user,
                message=f"Your complaint regarding '{instance.order_item.product.name}' has been resolved.",
                action_link='/my-orders'
            )
