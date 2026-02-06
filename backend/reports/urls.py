from django.urls import path
from .views import SalesReportView, LowStockReportView

urlpatterns = [
    path('sales/', SalesReportView.as_view(), name='sales-report'),
    path('low-stock/', LowStockReportView.as_view(), name='low-stock-report'),
]
