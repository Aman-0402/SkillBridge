from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action, api_view, permission_classes
from .models import User, Skill, Experience, ExpertiseTag
from .serializers import RegisterSerializer, ProfileSerializer, SkillSerializer, ExperienceSerializer, UserSerializer, KYCSubmitSerializer, ExpertiseTagSerializer, FreelancerListSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'detail': 'Both old and new passwords are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'detail': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'detail': 'New password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'detail': 'Password changed successfully'}, status=status.HTTP_200_OK)

class SkillViewSet(viewsets.ModelViewSet):
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Skill.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ExpertiseTagViewSet(viewsets.ModelViewSet):
    serializer_class = ExpertiseTagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ExpertiseTag.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PublicProfileView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]
    lookup_field = 'username'


@api_view(['GET'])
@permission_classes([AllowAny])
def featured_consultants(request):
    """Return all consultants/freelancers marked as featured by admin."""
    consultants = User.objects.filter(
        is_featured=True,
        role__in=['consultant', 'freelancer', 'both']
    )
    serializer = UserSerializer(consultants, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_featured(request, user_id):
    """Admin-only: toggle the is_featured flag on a consultant/freelancer."""
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        target = User.objects.get(id=user_id, role__in=['consultant', 'freelancer', 'both'])
        target.is_featured = not target.is_featured
        target.save()
        return Response({'id': target.id, 'is_featured': target.is_featured})
    except User.DoesNotExist:
        return Response({'detail': 'Consultant/freelancer not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kyc_submit(request):
    """User submits KYC — sets status to pending."""
    user = request.user
    if user.kyc_status == 'verified':
        return Response({'detail': 'Already verified.'}, status=status.HTTP_400_BAD_REQUEST)
    serializer = KYCSubmitSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user.kyc_document_type = serializer.validated_data['kyc_document_type']
    user.kyc_document_number = serializer.validated_data['kyc_document_number']
    user.kyc_status = 'pending'
    user.kyc_submitted_at = timezone.now()
    user.kyc_rejection_reason = None
    user.save()
    return Response({'detail': 'KYC submitted successfully. Awaiting admin review.', 'kyc_status': 'pending'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kyc_pending_list(request):
    """Admin-only: list all pending KYC requests."""
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    users = User.objects.filter(kyc_status='pending').order_by('kyc_submitted_at')
    serializer = UserSerializer(users, many=True)
    data = []
    for u in users:
        data.append({
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'role': u.role,
            'kyc_status': u.kyc_status,
            'kyc_document_type': u.kyc_document_type,
            'kyc_document_number': u.kyc_document_number,
            'kyc_submitted_at': u.kyc_submitted_at,
        })
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kyc_approve(request, user_id):
    """Admin-only: approve KYC and set is_verified=True."""
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    try:
        target = User.objects.get(id=user_id)
        target.kyc_status = 'verified'
        target.is_verified = True
        target.kyc_rejection_reason = None
        target.save()
        from core.models import create_notification
        create_notification(target, 'kyc_approved', 'KYC Verified ✅', 'Your identity has been verified. Blue tick is now active on your profile.')
        return Response({'detail': 'KYC approved.', 'kyc_status': 'verified'})
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def kyc_reject(request, user_id):
    """Admin-only: reject KYC with a reason."""
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'detail': 'Rejection reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        target = User.objects.get(id=user_id)
        target.kyc_status = 'rejected'
        target.is_verified = False
        target.kyc_rejection_reason = reason
        target.save()
        from core.models import create_notification
        create_notification(target, 'kyc_rejected', 'KYC Rejected ❌', f'Your KYC was rejected. Reason: {reason}')
        return Response({'detail': 'KYC rejected.', 'kyc_status': 'rejected'})
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clients_list(request):
    """List all client users with their open projects (for freelancer/consultant directory)."""
    from django.db.models import Q, Count
    search = request.query_params.get('search', '').strip()
    clients = User.objects.filter(role='client').annotate(
        open_project_count=Count('projects', filter=Q(projects__status='open'))
    )
    if search:
        clients = clients.filter(
            Q(username__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(location__icontains=search)
        )
    clients = clients.order_by('-open_project_count', 'username')

    data = []
    for client in clients:
        open_projects = list(
            client.projects.filter(status='open')
            .values('id', 'title', 'budget', 'budget_type', 'category')[:4]
        )
        pic = None
        if client.profile_picture:
            try:
                pic = request.build_absolute_uri(client.profile_picture.url)
            except Exception:
                pass
        data.append({
            'id': client.id,
            'username': client.username,
            'first_name': client.first_name,
            'last_name': client.last_name,
            'bio': client.bio,
            'location': client.location,
            'is_online': client.is_online,
            'profile_picture': pic,
            'open_projects': open_projects,
            'total_projects': client.projects.count(),
            'open_project_count': client.open_project_count,
        })
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def freelancers_list(request):
    """List freelancers — role in ('freelancer', 'both')."""
    from django.db.models import Q
    search = request.query_params.get('search', '').strip()
    online = request.query_params.get('online', '')

    qs = User.objects.filter(role__in=['freelancer', 'both']).prefetch_related(
        'skills', 'expertise_tags',
    )

    if search:
        qs = qs.filter(
            Q(username__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(skills__name__icontains=search) |
            Q(expertise_tags__tag__icontains=search) |
            Q(working_industry__icontains=search) |
            Q(bio__icontains=search)
        ).distinct()

    if online == 'true':
        qs = qs.filter(is_online=True)

    serializer = FreelancerListSerializer(qs, many=True)
    return Response(serializer.data)
