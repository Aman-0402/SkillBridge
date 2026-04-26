import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillbridge.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

try:
    user = User.objects.get(username='Admin1')
    print(f"Before: {user.username} - Role: {user.role}, is_staff: {user.is_staff}")

    user.role = 'admin'
    user.save()

    print(f"After: {user.username} - Role: {user.role}, is_staff: {user.is_staff}")
    print("✓ Admin1 role updated successfully!")
except User.DoesNotExist:
    print("Admin1 user not found")
