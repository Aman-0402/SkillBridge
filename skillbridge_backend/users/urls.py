from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, ProfileView, ChangePasswordView,
    SkillViewSet, ExperienceViewSet, ExpertiseTagViewSet, PublicProfileView,
    featured_consultants, toggle_featured,
    kyc_submit, kyc_pending_list, kyc_approve, kyc_reject,
)

router = DefaultRouter()
router.register(r'skills', SkillViewSet, basename='skill')
router.register(r'experiences', ExperienceViewSet, basename='experience')
router.register(r'expertise-tags', ExpertiseTagViewSet, basename='expertise-tag')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('profile/<str:username>/', PublicProfileView.as_view(), name='public_profile'),
    path('featured-consultants/', featured_consultants, name='featured_consultants'),
    path('toggle-featured/<int:user_id>/', toggle_featured, name='toggle_featured'),
    path('kyc/submit/', kyc_submit, name='kyc_submit'),
    path('kyc/pending/', kyc_pending_list, name='kyc_pending_list'),
    path('kyc/approve/<int:user_id>/', kyc_approve, name='kyc_approve'),
    path('kyc/reject/<int:user_id>/', kyc_reject, name='kyc_reject'),
    path('', include(router.urls)),
]
