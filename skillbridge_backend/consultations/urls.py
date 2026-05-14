from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConsultantAvailabilityViewSet, ConsultationSessionViewSet, ReviewViewSet,
    ConsultantPackageViewSet, ConsultantSessionRateViewSet, RescheduleRequestViewSet,
)

router = DefaultRouter()
router.register(r'availability',        ConsultantAvailabilityViewSet,  basename='availability')
router.register(r'sessions',            ConsultationSessionViewSet,      basename='session')
router.register(r'reviews',             ReviewViewSet,                   basename='review')
router.register(r'packages',            ConsultantPackageViewSet,        basename='package')
router.register(r'session-rates',       ConsultantSessionRateViewSet,    basename='session-rate')
router.register(r'reschedule-requests', RescheduleRequestViewSet,        basename='reschedule')

urlpatterns = [
    path('', include(router.urls)),
]
