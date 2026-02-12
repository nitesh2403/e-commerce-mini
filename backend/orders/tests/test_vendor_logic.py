
from django.test import TestCase
from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from products.models import Product, Category
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class VendorOrderUpdateTests(TestCase):
    def setUp(self):
        # 1. Setup Data
        self.vendor = User.objects.create_user(username='vendor', email='v@test.com', password='password123', role='admin')
        self.customer = User.objects.create_user(username='customer', email='c@test.com', password='password123')
        self.category = Category.objects.create(name='TestCat')
        
        self.product = Product.objects.create(
            name='Test Product', 
            created_by=self.vendor, 
            price=100.00, 
            stock_quantity=10, 
            category=self.category
        )

        # 2. Create Order with Mixed Statuses
        self.order = Order.objects.create(user=self.customer, total_amount=200, status='placed')
        
        # Active Item (Qty 2)
        self.item_active = OrderItem.objects.create(
            order=self.order, 
            product=self.product, 
            quantity=2, 
            price_at_purchase=100.00, 
            status='placed'
        )
        
        # Cancelled Item (Qty 1) -> The "Ghost" Item Case
        self.item_cancelled = OrderItem.objects.create(
            order=self.order, 
            product=self.product, 
            quantity=1, 
            price_at_purchase=100.00, 
            status='cancelled'
        )

        # 3. Setup Client
        self.client = APIClient()
        self.client.force_authenticate(user=self.vendor)

    def test_vendor_update_ignores_cancelled_items(self):
        """
        Verify that when a vendor updates order status to 'shipped',
        cancelled items REMAIN cancelled and only active items are updated.
        """
        url = f'/api/orders/{self.order.id}/'
        data = {'status': 'shipped'}
        
        # Action: Vendor updates status
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Refresh Data
        self.item_active.refresh_from_db()
        self.item_cancelled.refresh_from_db()
        self.order.refresh_from_db()
        
        # Assertions
        # 1. Active item should be SHIPPED
        self.assertEqual(self.item_active.status, 'shipped', "Active item should be updated to shipped")
        
        # 2. Cancelled item MUST remain CANCELLED
        self.assertEqual(self.item_cancelled.status, 'cancelled', "Cancelled item should NOT change status")
        
        # 3. Order status should be SHIPPED (since it has mixed shipped/cancelled items)
        self.assertEqual(self.order.status, 'shipped', "Order status should be shipped")

    def test_vendor_billing_excludes_cancelled_items(self):
        """
        Verify that the serializer return for the vendor excludes cancellation amounts.
        """
        url = f'/api/orders/{self.order.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        
        # Check Total Price visible to Vendor
        # It should be 2 * 100 = 200 (Active only), NOT 300 (Active + Cancelled)
        expected_total = 200.00
        self.assertEqual(float(data['total_price']), expected_total, "Vendor total should exclude cancelled items")
        
        # Check Items List
        # Should only show 1 item (the active one) if we are filtering completely,
        # OR show both but with correct status. 
        # Based on previous code edits, we are EXCLUDING cancelled items from the list entirely for vendors.
        
        item_ids = [i['id'] for i in data['items']]
        self.assertIn(self.item_active.id, item_ids)
        self.assertNotIn(self.item_cancelled.id, item_ids, "Cancelled item should be hidden from vendor view")
