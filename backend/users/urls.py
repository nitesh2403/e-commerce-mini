from django.urls import path
from .views import RegisterView, MyTokenObtainPairView, UserProfileView, VendorListView, NotificationListView, MarkNotificationReadView, MarkAllNotificationsReadView, ClearReadNotificationsView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('vendors/', VendorListView.as_view(), name='vendor_list'),
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
    path('notifications/clear-read/', ClearReadNotificationsView.as_view(), name='clear_read_notifications'),
]
