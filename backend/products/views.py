from rest_framework import viewsets, filters, permissions, decorators
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category
from .serializers import ProductSerializer, CategorySerializer
from users.permissions import IsAdminRole

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        # For write permissions, check if user is admin AND (create or is owner)
        if not (request.user and request.user.is_authenticated and request.user.role == 'admin'):
            return False
        
        # If modifying existing object, check ownership
        if view.action in ['update', 'partial_update', 'destroy']:
            obj = view.get_object()
            if hasattr(obj, 'created_by') and obj.created_by != request.user:
                 return False
        return True

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly] # We will override this in get_permissions

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAdminOrReadOnly()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_queryset(self):
        # Specific filter for 'my_products' action if we added one, but since we are re-using standard list:
        # We will default to ALL products for public list.
        # But filter only for Admin Dashboard if a param is present?
        # Actually, simpler: Frontend calls ?owner=me ? No that exposes it.
        # Let's add a custom action 'my_inventory'
        return Product.objects.all()

    @decorators.action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_inventory(self, request):
        if request.user.role != 'admin':
             return Response({'error': 'Admins only'}, status=403)
        queryset = Product.objects.filter(created_by=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'category__name', 'created_by']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']
