import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd() + '/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_api.settings')
django.setup()

from users.models import User

print(f"{'Username':<20} | {'Role':<10} | {'Is Superuser':<10}")
print("-" * 46)
for user in User.objects.all():
    print(f"{user.username:<20} | {user.role:<10} | {str(user.is_superuser):<10}")
