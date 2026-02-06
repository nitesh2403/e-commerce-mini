from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from users.permissions import IsAdminRole
from django.db import models
from django.db.models import Sum, Count
from orders.models import Order, OrderItem
from products.models import Product

class SalesReportView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        user = request.user
        
        # Filter Order Items for this vendor - EXCLUDE CANCELLED
        # Filter Order Items for this vendor - EXCLUDE CANCELLED ORDERS AND ITEMS
        vendor_items = OrderItem.objects.filter(
            product__created_by=user,
            order__status__in=['placed', 'shipped', 'delivered']
        ).exclude(status='cancelled')
        
        # Total Revenue: Sum of (price * quantity) for these items
        total_revenue = vendor_items.aggregate(
            total=Sum(models.F('price_at_purchase') * models.F('quantity'), output_field=models.DecimalField())
        )['total'] or 0
        
        # Total Orders: Count of unique orders containing these items
        total_orders = vendor_items.values('order').distinct().count()

        # Status counts: Count orders by status, but only those containing vendor items
        # We can get the order IDs first
        order_ids = vendor_items.values_list('order', flat=True).distinct()
        status_counts = Order.objects.filter(id__in=order_ids).values('status').annotate(count=Count('id'))

        # Detailed breakdown: Status -> Product Name -> Quantity
        # We group by status and product name
        product_breakdown = vendor_items.values('order__status', 'product__name').annotate(
            total_quantity=Sum('quantity'),
            total_sales=Sum(models.F('price_at_purchase') * models.F('quantity'), output_field=models.DecimalField())
        ).order_by('order__status', '-total_quantity')

        return Response({
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'status_breakdown': status_counts,
            'product_breakdown': product_breakdown
        })

class LowStockReportView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        threshold = int(request.query_params.get('threshold', 10))
        # Filter by created_by=request.user
        low_stock_products = Product.objects.filter(
            stock_quantity__lte=threshold, 
            created_by=request.user
        ).values(
            'id', 'name', 'stock_quantity', 'category__name'
        )
        return Response(low_stock_products)
