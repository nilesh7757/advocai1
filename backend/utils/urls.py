from django.urls import path
from . import views

urlpatterns = [
    path('download-pdf/', views.download_pdf, name='download-pdf'),
    path('download-docx/', views.download_docx, name='download-docx'),
    path('upload-signature/', views.upload_signature, name='upload-signature'),
    path('conversations/<str:pk>/download-latest-pdf/', views.download_latest_conversation_pdf, name='download-latest-conversation-pdf'),
    path('conversations/<str:pk>/download-latest-docx/', views.download_latest_conversation_docx, name='download-latest-conversation-docx'),
    path('conversations/<str:pk>/versions/<int:version_number>/download-pdf/', views.download_version_pdf, name='download-version-pdf'),
    path('conversations/<str:pk>/versions/<int:version_number>/download-docx/', views.download_version_docx, name='download-version-docx'),
    path('contact/', views.contact, name='contact'),
]
