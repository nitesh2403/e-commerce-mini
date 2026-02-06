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
                # 2. Restore Stock and Mark Items Cancelled
                for item in order.items.all():
                    if item.status != 'cancelled':
                        product = item.product
                        product.stock_quantity += item.quantity
                        product.save()
                        item.status = 'cancelled'
                        item.save()

                # 3. Update Status
                order.status = 'cancelled'
                order.total_amount = 0 # Ensure total is zero for cancelled orders
                order.save()
                
                return Response({'status': 'Order cancelled successfully'})
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
                    
                    # 2. Update existing Cancelled Item or Create new one
                    existing_cancelled_item = OrderItem.objects.filter(
                        order=order,
                        product=item.product,
                        status='cancelled',
                        price_at_purchase=item.price_at_purchase
                    ).first()

                    if existing_cancelled_item:
                        existing_cancelled_item.quantity += cancel_quantity
                        existing_cancelled_item.save()
                    else:
                        OrderItem.objects.create(
                            order=order,
                            product=item.product,
                            quantity=cancel_quantity,
                            price_at_purchase=item.price_at_purchase,
                            status='cancelled'
                        )
                    
                    # 3. Restore Stock
                    product = item.product
                    product.stock_quantity += cancel_quantity
                    product.save()

                    # 4. Update Order Total
                    refund_amount = item.price_at_purchase * cancel_quantity
                    order.total_amount = max(0, order.total_amount - refund_amount)
                    order.save()
                    
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

                    # 4. Mark Item as Cancelled
                    item.status = 'cancelled'
                    item.save()

                    # 5. Check if Order is fully cancelled
                    if not order.items.exclude(status='cancelled').exists():
                        order.status = 'cancelled'
                        order.save()
                        return Response({'status': 'Item cancelled. Order cancelled as all items are cancelled.', 'order_cancelled': True})

                    return Response({'status': 'Item cancelled successfully', 'new_total': order.total_amount})

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
