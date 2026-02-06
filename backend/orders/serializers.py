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

        if request and request.user and request.user.role == 'admin':
            # Filter items to only show those created by this admin
            items_data = representation.get('items', [])
            filtered_items = []
            vendor_total = 0

            # Access the original data to check product ownership efficiently or rely on serialized data
            # Since items are already serialized, we iterate them.
            # Ideally we check the DB objects but serializer output is easier here if product owner info was included.
            # Let's rely on fetching the OrderItems again or use a simpler check if we trust ID.
            
            # Better approach: Iterate the RelatedManager on the instance to be accurate
            vendor_items = instance.items.filter(product__created_by=request.user)
            
            # Re-serialize these specific items
            representation['items'] = OrderItemSerializer(vendor_items, many=True, context=self.context).data
            
            # Recalculate total for this vendor's view
            vendor_total = sum(item.price_at_purchase * item.quantity for item in vendor_items if item.status != 'cancelled')
            representation['total_price'] = vendor_total

        # Defensive Check: Ensure total is never negative and 0 if cancelled
        # This handles legacy data where logic might have subtracted excessively
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

