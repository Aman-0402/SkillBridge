from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Job, JobApplication
from .serializers import JobSerializer, JobCreateSerializer, JobApplicationSerializer

class JobViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'company', 'category']
    ordering_fields = ['created_at', 'salary_max']

    def get_queryset(self):
        return Job.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return JobCreateSerializer
        return JobSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(posted_by=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_jobs(self, request):
        jobs = Job.objects.filter(posted_by=request.user)
        serializer = self.get_serializer(jobs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept_application(self, request, pk=None):
        job = self.get_object()
        if job.posted_by != request.user:
            return Response({'detail': 'Only job poster can accept applications'}, status=status.HTTP_403_FORBIDDEN)

        try:
            application = JobApplication.objects.get(id=request.data.get('application_id'))
            job.selected_candidate = application.applicant
            job.status = 'filled'
            job.save()

            application.status = 'accepted'
            application.save()

            return Response({'detail': 'Application accepted'})
        except JobApplication.DoesNotExist:
            return Response({'detail': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_application_status(self, request, pk=None):
        job = self.get_object()
        if job.posted_by != request.user:
            return Response({'detail': 'Only job poster can update application status'}, status=status.HTTP_403_FORBIDDEN)

        try:
            application = JobApplication.objects.get(id=request.data.get('application_id'))
            status_val = request.data.get('status')

            if status_val not in ['reviewed', 'shortlisted', 'rejected']:
                return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

            application.status = status_val
            application.save()

            return Response({'detail': f'Application {status_val}'})
        except JobApplication.DoesNotExist:
            return Response({'detail': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

class JobApplicationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'client':
            return JobApplication.objects.filter(job__posted_by=self.request.user)
        return JobApplication.objects.filter(applicant=self.request.user)

    def get_serializer_class(self):
        return JobApplicationSerializer

    def perform_create(self, serializer):
        serializer.save(applicant=self.request.user)

    @action(detail=False, methods=['get'])
    def my_applications(self, request):
        applications = JobApplication.objects.filter(applicant=request.user)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)
