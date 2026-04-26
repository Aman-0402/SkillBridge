from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/projects/', include('projects.urls')),
    path('api/jobs/', include('jobs.urls')),
    path('api/proposals/', include('proposals.urls')),
    path('api/consultations/', include('consultations.urls')),
    path('api/chat/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
