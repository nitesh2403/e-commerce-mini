from rest_framework import serializers
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    vendor_name = serializers.ReadOnlyField(source='created_by.username')
    discounted_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'discount_percentage', 'discounted_price', 'stock_quantity', 'image', 'image_url', 'category', 'category_name', 'vendor_name', 'created_at']

    def get_discounted_price(self, obj):
        return obj.get_discounted_price()
