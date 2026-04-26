from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Project, Proposal
from .serializers import ProjectSerializer, ProjectCreateSerializer, ProposalSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category']
    ordering_fields = ['created_at', 'budget']

    def get_queryset(self):
        return Project.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return ProjectCreateSerializer
        return ProjectSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_projects(self, request):
        projects = Project.objects.filter(client=request.user)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept_proposal(self, request, pk=None):
        project = self.get_object()
        if project.client != request.user:
            return Response({'detail': 'Only project owner can accept proposals'}, status=status.HTTP_403_FORBIDDEN)

        try:
            proposal = Proposal.objects.get(id=request.data.get('proposal_id'))
            project.selected_freelancer = proposal.freelancer
            project.status = 'in_progress'
            project.save()

            proposal.status = 'accepted'
            proposal.save()

            return Response({'detail': 'Proposal accepted'})
        except Proposal.DoesNotExist:
            return Response({'detail': 'Proposal not found'}, status=status.HTTP_404_NOT_FOUND)

class ProposalViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'client':
            return Proposal.objects.filter(project__client=self.request.user)
        return Proposal.objects.filter(freelancer=self.request.user)

    def get_serializer_class(self):
        return ProposalSerializer

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)

    @action(detail=False, methods=['get'])
    def my_proposals(self, request):
        proposals = Proposal.objects.filter(freelancer=request.user)
        serializer = self.get_serializer(proposals, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        proposal = self.get_object()
        if proposal.freelancer != request.user:
            return Response({'detail': 'Only proposal owner can withdraw'}, status=status.HTTP_403_FORBIDDEN)

        proposal.status = 'withdrawn'
        proposal.save()
        return Response({'detail': 'Proposal withdrawn'})
