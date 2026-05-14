from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConversationViewSet, MessageViewSet, AnalyticsViewSet, AdminViewSet, NotificationViewSet, ReportViewSet

router = DefaultRouter()
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'admin', AdminViewSet, basename='admin')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
