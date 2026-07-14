from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='chat'),
    path('clause-library/', views.clause_library, name='clause_library'),
    path('refine-text/', views.refine_text, name='refine_text'),
]
