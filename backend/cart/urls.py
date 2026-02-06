from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartViewSet

router = DefaultRouter()
# We don't use the default router registration fully because CartViewSet is a ViewSet but we are using custom actions mostly 
# simpler to just map list to get
router.register(r'cart', CartViewSet, basename='cart')

urlpatterns = [
    path('', include(router.urls)),
]
