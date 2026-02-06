from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import WishlistItem
from .serializers import WishlistItemSerializer
from products.models import Product

class WishlistViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WishlistItemSerializer

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        product = get_object_or_404(Product, id=product_id)
        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)

        if not created:
            item.delete()
            return Response({'status': 'removed', 'message': 'Removed from wishlist'})
        
        return Response({'status': 'added', 'message': 'Added to wishlist'})

    @action(detail=False, methods=['get'])
    def check(self, request):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        exists = WishlistItem.objects.filter(user=request.user, product_id=product_id).exists()
        return Response({'is_in_wishlist': exists})
