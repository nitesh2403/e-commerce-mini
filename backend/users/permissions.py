from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow if user is admin role OR valid staff/superuser
        return request.user and request.user.is_authenticated and (request.user.role == 'admin' or request.user.is_staff)
