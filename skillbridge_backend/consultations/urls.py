from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConsultantAvailabilityViewSet, ConsultationSessionViewSet, ReviewViewSet, ConsultantPackageViewSet

router = DefaultRouter()
router.register(r'availability', ConsultantAvailabilityViewSet, basename='availability')
router.register(r'sessions', ConsultationSessionViewSet, basename='session')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'packages', ConsultantPackageViewSet, basename='package')

urlpatterns = [
    path('', include(router.urls)),
]
