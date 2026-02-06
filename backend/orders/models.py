from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()

class Order(models.Model):
    STATUS_CHOICES = (
        ('placed', 'Placed'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )

    user = models.ForeignKey(User, related_name='orders', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='placed')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    # Shipping Details
    full_name = models.CharField(max_length=100, default="")
    address = models.TextField(default="")
    city = models.CharField(max_length=100, default="")
    postal_code = models.CharField(max_length=20, default="")
    phone_number = models.CharField(max_length=20, default="")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT) # Protect product deletion if part of an order
    quantity = models.PositiveIntegerField()
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[('placed', 'Placed'), ('cancelled', 'Cancelled')], default='placed')

    def __str__(self):
        return f"{self.quantity} x {self.product.name}"

class Complaint(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('resolved', 'Resolved'),
    )

    order_item = models.ForeignKey(OrderItem, related_name='complaints', on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name='complaints_filed', on_delete=models.CASCADE) # Customer
    vendor = models.ForeignKey(User, related_name='complaints_received', on_delete=models.CASCADE) # Vendor
    
    reason = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to='complaints/', blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Complaint #{self.id} - {self.product_name} ({self.status})"
    
    @property
    def product_name(self):
        return self.order_item.product.name
