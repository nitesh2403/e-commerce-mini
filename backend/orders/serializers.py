from rest_framework import serializers
from .models import Order, OrderItem, Complaint
from products.serializers import ProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    vendor_name = serializers.ReadOnlyField(source='product.created_by.username')
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'price_at_purchase', 'product_image', 'status', 'vendor_name']

    def get_product_image(self, obj):
        if obj.product.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.product.image.url)
            # If no request (e.g. shell), return relative, but frontend might fail if domains differ
            return obj.product.image.url
        return obj.product.image_url

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Order
        fields = ['id', 'user', 'username', 'status', 'total_price', 'created_at', 'items', 'full_name', 'address', 'city', 'postal_code', 'phone_number']
        extra_kwargs = {
            'total_price': {'source': 'total_amount', 'read_only': True},
            'user': {'read_only': True}
        }

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')

        if request and request.user and (request.user.role == 'admin' or request.user.is_staff) and not request.user.is_superuser:
            # Filter items to only show those created by this admin
            # Note: is_superuser check prevents filtering for global admins if you have them
            
            # Better approach: Iterate the RelatedManager on the instance to be accurate
            vendor_items = instance.items.filter(product__created_by=request.user)
            
            # Re-serialize these specific items (excluding cancelled ones as per user request)
            active_vendor_items = vendor_items.exclude(status='cancelled')
            representation['items'] = OrderItemSerializer(active_vendor_items, many=True, context=self.context).data
            
            # Recalculate total for this vendor's view
            vendor_total = sum(item.price_at_purchase * item.quantity for item in vendor_items if item.status != 'cancelled')
            representation['total_price'] = vendor_total

            # Calculate Vendor-Specific Status
            active_items = [i for i in vendor_items if i.status != 'cancelled']
            
            if not active_items:
                # If all items are cancelled (or no items), status is cancelled
                representation['status'] = 'cancelled'
            else:
                item_statuses = set(i.status for i in active_items)
                
                if 'delivered' in item_statuses and len(item_statuses) == 1:
                    # All active items are delivered
                    representation['status'] = 'delivered'
                elif 'shipped' in item_statuses or 'delivered' in item_statuses:
                    # Partial delivery or shipping means shipped (unless all delivered)
                     representation['status'] = 'shipped'
                else:
                    # Default to placed
                    representation['status'] = 'placed'

        # Defensive Check: Ensure total is never negative and 0 if cancelled
        if instance.status == 'cancelled':
            representation['total_price'] = 0.00
        elif float(representation.get('total_price', 0)) < 0:
            representation['total_price'] = 0.00

        return representation

class ComplaintSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='order_item.product.name')
    product_image = serializers.SerializerMethodField()
    user = serializers.ReadOnlyField(source='user.username')
    customer_email = serializers.ReadOnlyField(source='user.email')
    customer_phone = serializers.ReadOnlyField(source='order_item.order.phone_number')

    class Meta:
        model = Complaint
        fields = ['id', 'order_item', 'product_name', 'product_image', 'user', 'customer_email', 'customer_phone', 'vendor', 'reason', 'description', 'image', 'status', 'created_at']
        read_only_fields = ['user', 'vendor', 'status', 'created_at']

    def get_product_image(self, obj):
        try:
            return obj.order_item.product.image.url if obj.order_item.product.image else None
        except:
            return None

class ComplaintUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = ['status']

