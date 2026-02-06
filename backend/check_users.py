import os
import django
import sys

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_api.settings')
django.setup()

from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()

print(f"{'Username':<20} {'Role':<15} {'Product Count':<15}")
print("-" * 60)
for user in User.objects.all():
    count = Product.objects.filter(created_by=user).count()
    print(f"{user.username:<20} {user.role:<15} {count:<15}")
