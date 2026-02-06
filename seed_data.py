import os
import django
import sys
import random

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce_api.settings')
django.setup()

from products.models import Category, Product

def create_initial_data():
    print("Seeding data...")
    
    # Categories
    categories = {
        'Electronics': 'Gadgets, devices, and accessories',
        'Clothing': 'Men and Women fashion',
        'Home & Kitchen': 'Furniture, decor, and appliances',
        'Books': 'Bestsellers, fiction, and non-fiction',
        'Sports': 'Equipment and sportswear'
    }
    
    cat_objs = {}
    for name, desc in categories.items():
        cat, created = Category.objects.get_or_create(name=name, defaults={'description': desc})
        cat_objs[name] = cat
        if created:
            print(f"Created Category: {name}")

    # Products list
    products = [
        # Electronics
        ('Smartphone X', 'Electronics', 999.99, 50, 'https://placehold.co/600x400?text=Phone+X'),
        ('Laptop Pro', 'Electronics', 1499.99, 30, 'https://placehold.co/600x400?text=Laptop'),
        ('Wireless Earbuds', 'Electronics', 129.99, 100, 'https://placehold.co/600x400?text=Earbuds'),
        ('Smart Watch', 'Electronics', 249.99, 75, 'https://placehold.co/600x400?text=Watch'),
        ('4K Monitor', 'Electronics', 399.99, 40, 'https://placehold.co/600x400?text=Monitor'),
        
        # Clothing
        ('Cotton T-Shirt', 'Clothing', 24.99, 200, 'https://placehold.co/600x400?text=T-Shirt'),
        ('Denim Jeans', 'Clothing', 59.99, 150, 'https://placehold.co/600x400?text=Jeans'),
        ('Sneakers', 'Clothing', 89.99, 80, 'https://placehold.co/600x400?text=Sneakers'),
        ('Winter Jacket', 'Clothing', 129.99, 60, 'https://placehold.co/600x400?text=Jacket'),
        ('Cap', 'Clothing', 19.99, 100, 'https://placehold.co/600x400?text=Cap'),
        
        # Home
        ('Coffee Maker', 'Home & Kitchen', 79.99, 45, 'https://placehold.co/600x400?text=Coffee'),
        ('Blender', 'Home & Kitchen', 49.99, 60, 'https://placehold.co/600x400?text=Blender'),
        ('Desk Lamp', 'Home & Kitchen', 34.99, 85, 'https://placehold.co/600x400?text=Lamp'),
        ('Ergonomic Chair', 'Home & Kitchen', 199.99, 20, 'https://placehold.co/600x400?text=Chair'),
        
        # Books
        ('Python Mastery', 'Books', 49.99, 100, 'https://placehold.co/600x400?text=Python+Book'),
        ('Sci-Fi Novel', 'Books', 19.99, 120, 'https://placehold.co/600x400?text=Novel'),
        
        # Sports
        ('Yoga Mat', 'Sports', 29.99, 100, 'https://placehold.co/600x400?text=Yoga+Mat'),
        ('Dumbbell Set', 'Sports', 89.99, 40, 'https://placehold.co/600x400?text=Dumbbells'),
    ]

    for name, cat_name, price, stock, img in products:
        if not Product.objects.filter(name=name).exists():
            Product.objects.create(
                category=cat_objs[cat_name],
                name=name,
                description=f"High quality {name} for your needs.",
                price=price,
                stock_quantity=stock,
                image_url=img
            )
            print(f"Added Product: {name}")
        else:
            print(f"Product {name} already exists.")

    print("Data seeding complete!")

if __name__ == '__main__':
    create_initial_data()
