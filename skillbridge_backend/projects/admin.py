from django.contrib import admin
from .models import Project, Proposal

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'client', 'budget', 'status', 'created_at']
    list_filter = ['status', 'budget_type', 'created_at']
    search_fields = ['title', 'description', 'client__username']

@admin.register(Proposal)
class ProposalAdmin(admin.ModelAdmin):
    list_display = ['project', 'freelancer', 'bid_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['project__title', 'freelancer__username']
