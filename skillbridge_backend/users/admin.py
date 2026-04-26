from django.contrib import admin
from .models import User, Skill, Experience

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email', 'role', 'is_verified', 'created_at']
    list_filter = ['role', 'is_verified', 'created_at']
    search_fields = ['username', 'email']

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'proficiency', 'endorsed']
    list_filter = ['proficiency', 'created_at']
    search_fields = ['name', 'user__username']

@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'user', 'start_date', 'is_current']
    list_filter = ['is_current', 'start_date']
    search_fields = ['title', 'company', 'user__username']
