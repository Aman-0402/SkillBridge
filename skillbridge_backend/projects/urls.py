from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, ProposalViewSet, ProposalTemplateViewSet

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')
router.register(r'proposals', ProposalViewSet, basename='proposal')
router.register(r'proposal-templates', ProposalTemplateViewSet, basename='proposal-template')

urlpatterns = [
    path('', include(router.urls)),
]
