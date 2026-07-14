from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from rest_framework.pagination import PageNumberPagination
from mongoengine import DoesNotExist
from authentication.models import User
from .models import LawyerProfile, LawyerConnectionRequest, LawyerReview
from chat.models import ChatConversation, ChatMessage
import cloudinary
import cloudinary.uploader
import csv
from uuid import uuid4
from datetime import datetime

from .serializers import (
    LawyerProfileSerializer,
    LawyerProfileEditSerializer,
    LawyerConnectionRequestSerializer,
    LawyerConnectionStatusSerializer,
    LawyerReviewSerializer,
)
from authentication.serializers import UserSerializer
from utils.permissions import IsAdminUser


def _annotate_rating(data, lawyer_user):
    """Inject average_rating and review_count into a serialized lawyer profile dict."""
    reviews = LawyerReview.objects(lawyer=lawyer_user)
    count = reviews.count()
    if count > 0:
        avg = sum(r.rating for r in reviews) / count
        data['average_rating'] = round(avg, 1)
    else:
        data['average_rating'] = None
    data['review_count'] = count
    return data


@api_view(['GET'])
@permission_classes([AllowAny])
def lawyer_list_view(request):
    """List approved lawyers with optional specialization filter"""
    specialization = request.query_params.get('specialization', '').strip()
    profiles = LawyerProfile.objects(verification_status='approved')

    if specialization:
        profiles = profiles.filter(specializations__icontains=specialization)

    result = []
    for profile in profiles:
        d = LawyerProfileSerializer(profile).data
        _annotate_rating(d, profile.user)
        result.append(d)
    return Response(result, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def lawyer_detail_view(request, lawyer_id):
    """Retrieve lawyer detail"""
    try:
        user = User.objects(id=lawyer_id, role='lawyer').first()
    except DoesNotExist:
        user = None
    if not user:
        return Response({'error': 'Lawyer not found.'}, status=status.HTTP_404_NOT_FOUND)

    profile = LawyerProfile.objects(user=user).first()
    if not profile:
        return Response({'error': 'Lawyer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = LawyerProfileSerializer(profile)
    data = serializer.data

    # Calculate stats
    requests = LawyerConnectionRequest.objects(lawyer=user)
    accepted_count = requests.filter(status='accepted').count()
    declined_count = requests.filter(status='declined').count()
    decided_count = accepted_count + declined_count

    acceptance_rate = None
    if decided_count > 0:
        acceptance_rate = int(round((accepted_count / decided_count) * 100))

    decided_requests = requests.filter(status__in=['accepted', 'declined'])
    avg_response_time_hours = None
    total_seconds = 0
    count = 0
    for req in decided_requests:
        if req.created_at and req.updated_at:
            dt = req.updated_at - req.created_at
            total_seconds += dt.total_seconds()
            count += 1

    if count > 0:
        avg_response_time_hours = round(total_seconds / (count * 3600), 1)

    data['acceptance_rate'] = acceptance_rate
    data['avg_response_time_hours'] = avg_response_time_hours
    _annotate_rating(data, user)

    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_with_lawyer_view(request, lawyer_id):
    """Create a connection request with a lawyer"""
    if str(request.user.id) == lawyer_id:
        return Response({'error': 'You cannot connect with yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        lawyer = User.objects(id=lawyer_id, role='lawyer').first()
    except DoesNotExist:
        lawyer = None

    if not lawyer:
        return Response({'error': 'Lawyer not found.'}, status=status.HTTP_404_NOT_FOUND)

    profile = LawyerProfile.objects(user=lawyer).first()
    if not profile:
        return Response({'error': 'Lawyer is not available for connections yet.'}, status=status.HTTP_400_BAD_REQUEST)

    request_type = request.data.get('request_type', 'consultation')
    if request_type not in ('consultation', 'quote'):
        request_type = 'consultation'

    existing_request = LawyerConnectionRequest.objects(
        client=request.user, lawyer=lawyer, status='pending', request_type=request_type
    ).first()
    if existing_request:
        serializer = LawyerConnectionRequestSerializer(existing_request)
        return Response({
            'message': f'You already have a pending {request_type} request with this lawyer.',
            'request': serializer.data
        }, status=status.HTTP_200_OK)

    message = request.data.get('message', '').strip()
    preferred_method = request.data.get('preferred_contact_method', 'email')
    preferred_value = request.data.get('preferred_contact_value', request.user.email)
    preferred_time_str = request.data.get('preferred_time')
    meeting_link = request.data.get('meeting_link')

    preferred_time = None
    if preferred_time_str:
        try:
            preferred_time = datetime.fromisoformat(preferred_time_str.replace('Z', '+00:00'))
        except ValueError:
            return Response({'error': 'Invalid preferred time format. Use ISO 8601 format.'}, status=status.HTTP_400_BAD_REQUEST)

    if not meeting_link:
        meeting_link = f"https://meet.google.com/new?hs=224&authuser=0&advocai={uuid4().hex[:8]}"

    connection_request = LawyerConnectionRequest.objects.create(
        client=request.user,
        lawyer=lawyer,
        message=message,
        status='pending',
        request_type=request_type,
        preferred_contact_method=preferred_method,
        preferred_contact_value=preferred_value,
        preferred_time=preferred_time,
        meeting_link=meeting_link,
    )

    serializer = LawyerConnectionRequestSerializer(connection_request)
    return Response({
        'message': 'Connection request submitted successfully.',
        'request': serializer.data,
        'meeting_link': meeting_link,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lawyer_dashboard_view(request):
    """Return dashboard information for a lawyer"""
    if not request.user.is_lawyer:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    profile = LawyerProfile.objects(user=request.user).first()
    profile_data = LawyerProfileSerializer(profile).data if profile else None

    connection_requests = LawyerConnectionRequest.objects(lawyer=request.user).order_by('-created_at')
    connection_serializer = LawyerConnectionRequestSerializer(connection_requests, many=True)

    accepted_reqs = connection_requests.filter(status='accepted')
    summary = {
        'total_requests': connection_requests.count(),
        'pending_requests': connection_requests.filter(status='pending').count(),
        'accepted_requests': accepted_reqs.count(),
        'declined_requests': connection_requests.filter(status='declined').count(),
        # Case status breakdown (only accepted connections have meaningful case status)
        'open_cases': accepted_reqs.filter(case_status='open').count(),
        'in_progress_cases': accepted_reqs.filter(case_status='in_progress').count(),
        'resolved_cases': accepted_reqs.filter(case_status='resolved').count(),
    }

    # Calculate requests by month for the last 6 months
    now = datetime.utcnow()
    current_year = now.year
    current_month = now.month
    
    months_list = []
    for i in range(5, -1, -1):
        m = current_month - i
        y = current_year
        if m <= 0:
            m += 12
            y -= 1
        months_list.append(f"{y:04d}-{m:02d}")

    requests_by_month = {m: 0 for m in months_list}
    for req in connection_requests:
        if req.created_at:
            m_str = req.created_at.strftime('%Y-%m')
            if m_str in requests_by_month:
                requests_by_month[m_str] += 1

    requests_by_month_list = [{'month': m, 'count': requests_by_month[m]} for m in months_list]

    return Response({
        'profile': profile_data,
        'user': UserSerializer(request.user).data,
        'connections': connection_serializer.data,
        'summary': summary,
        'requests_by_month': requests_by_month_list,
    }, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def lawyer_connection_update_view(request, connection_id):
    """Allow lawyer to update connection request status"""
    if not request.user.is_lawyer:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    connection_request = LawyerConnectionRequest.objects(id=connection_id, lawyer=request.user).first()
    if not connection_request:
        return Response({'error': 'Connection request not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = LawyerConnectionStatusSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    new_status = serializer.validated_data['status']
    connection_request.status = new_status
    connection_request.message = serializer.validated_data.get('message', connection_request.message)

    response_message = serializer.validated_data.get('response_message', '').strip()
    if response_message:
        suffix = f"\n\n[Response from lawyer]: {response_message}" if connection_request.message else f"[Response from lawyer]: {response_message}"
        connection_request.message = (connection_request.message + suffix).strip()

    connection_request.save()

    # Create chat conversation when lawyer accepts
    if new_status == 'accepted':
        existing_chat = ChatConversation.objects(
            connection_request=connection_request
        ).first()
        if not existing_chat:
            try:
                chat_conversation = ChatConversation.objects.create(
                    connection_request=connection_request,
                    client=connection_request.client,
                    lawyer=connection_request.lawyer,
                    is_active=True,
                )
                print(f"Created chat conversation {chat_conversation.id} for connection {connection_request.id}")
                
                # Send welcome message
                welcome_msg = f"Connection accepted! You can now chat with {connection_request.client.name or connection_request.client.username}."
                ChatMessage.objects.create(
                    conversation=chat_conversation,
                    sender=request.user,
                    message=welcome_msg,
                    message_type='system',
                )
                print(f"Created welcome message for conversation {chat_conversation.id}")
            except Exception as e:
                print(f"Error creating chat conversation: {e}")
                import traceback
                traceback.print_exc()

    response_serializer = LawyerConnectionRequestSerializer(connection_request)
    return Response({
        'message': f'Connection request {new_status}.',
        'request': response_serializer.data,
    }, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def withdraw_connection_view(request, connection_id):
    """Allow a client to withdraw a pending connection request."""
    connection_request = LawyerConnectionRequest.objects(id=connection_id, client=request.user).first()
    if not connection_request:
        return Response({'error': 'Connection request not found.'}, status=status.HTTP_404_NOT_FOUND)

    if connection_request.status != 'pending':
        return Response({'error': 'Only pending requests can be withdrawn.'}, status=status.HTTP_400_BAD_REQUEST)

    connection_request.status = 'withdrawn'
    connection_request.save()

    serializer = LawyerConnectionRequestSerializer(connection_request)
    return Response({
        'message': 'Connection request withdrawn successfully.',
        'request': serializer.data,
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connection_requests_list_view(request):
    """List all connection requests for the authenticated user."""
    user = request.user
    connection_requests = LawyerConnectionRequest.objects(client=user).order_by('-created_at')
    serializer = LawyerConnectionRequestSerializer(connection_requests, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_lawyer_availability_view(request):
    """Let a lawyer update their own weekly availability"""
    if not request.user.is_lawyer:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    profile = LawyerProfile.objects(user=request.user).first()
    if not profile:
        return Response({'error': 'Lawyer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    availability = request.data.get('availability')
    if availability is None:
        return Response({'error': 'Availability list is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(availability, list):
        return Response({'error': 'Availability must be a list of slot dictionaries.'}, status=status.HTTP_400_BAD_REQUEST)

    profile.availability = availability
    profile.save()

    return Response({
        'message': 'Availability updated successfully.',
        'profile': LawyerProfileSerializer(profile).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_review_view(request, connection_id):
    """Client submits a rating+review for an accepted connection."""
    connection_request = LawyerConnectionRequest.objects(id=connection_id).first()
    if not connection_request:
        return Response({'error': 'Connection request not found.'}, status=status.HTTP_404_NOT_FOUND)

    if str(connection_request.client.id) != str(request.user.id):
        return Response({'error': 'Only the client on this connection can leave a review.'}, status=status.HTTP_403_FORBIDDEN)

    if connection_request.status != 'accepted':
        return Response({'error': 'You can only review an accepted (completed) engagement.'}, status=status.HTTP_400_BAD_REQUEST)

    # Check for duplicate review
    existing = LawyerReview.objects(client=request.user, connection_request=connection_request).first()
    if existing:
        return Response({'error': 'You have already reviewed this engagement.'}, status=status.HTTP_409_CONFLICT)

    rating = request.data.get('rating')
    if not rating or not isinstance(rating, int) or not (1 <= rating <= 5):
        try:
            rating = int(rating)
            if not (1 <= rating <= 5):
                raise ValueError
        except (TypeError, ValueError):
            return Response({'error': 'rating must be an integer between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

    review_text = request.data.get('review_text', '').strip()

    review = LawyerReview.objects.create(
        lawyer=connection_request.lawyer,
        client=request.user,
        connection_request=connection_request,
        rating=rating,
        review_text=review_text,
    )

    serializer = LawyerReviewSerializer(review)
    return Response({
        'message': 'Review submitted successfully.',
        'review': serializer.data,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def lawyer_reviews_view(request, lawyer_id):
    """Public paginated list of reviews for a lawyer."""
    try:
        lawyer_user = User.objects(id=lawyer_id).first()
    except Exception:
        lawyer_user = None
    if not lawyer_user:
        return Response({'error': 'Lawyer not found.'}, status=status.HTTP_404_NOT_FOUND)

    reviews = LawyerReview.objects(lawyer=lawyer_user).order_by('-created_at')
    paginator = PageNumberPagination()
    paginator.page_size = 10
    paginated = paginator.paginate_queryset(list(reviews), request)
    serializer = LawyerReviewSerializer(paginated, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_review_status_view(request, connection_id):
    """Check if the current user has already reviewed a connection."""
    connection_request = LawyerConnectionRequest.objects(id=connection_id).first()
    if not connection_request:
        return Response({'error': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    existing = LawyerReview.objects(
        client=request.user,
        connection_request=connection_request
    ).first()
    return Response({'has_reviewed': existing is not None}, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_case_status_view(request, connection_id):
    """Allow either the lawyer or client to update case_status (and optionally case_notes)."""
    connection_request = LawyerConnectionRequest.objects(id=connection_id).first()
    if not connection_request:
        return Response({'error': 'Connection request not found.'}, status=status.HTTP_404_NOT_FOUND)

    uid = str(request.user.id)
    is_participant = (
        str(connection_request.client.id) == uid or
        str(connection_request.lawyer.id) == uid
    )
    if not is_participant:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    if connection_request.status != 'accepted':
        return Response({'error': 'Case status can only be changed on accepted connections.'}, status=status.HTTP_400_BAD_REQUEST)

    new_case_status = request.data.get('case_status')
    if new_case_status not in ('open', 'in_progress', 'resolved'):
        return Response({'error': "case_status must be 'open', 'in_progress', or 'resolved'."}, status=status.HTTP_400_BAD_REQUEST)

    connection_request.case_status = new_case_status
    if 'case_notes' in request.data:
        connection_request.case_notes = request.data.get('case_notes', '')
    connection_request.save()

    serializer = LawyerConnectionRequestSerializer(connection_request)
    return Response({
        'message': f'Case status updated to {new_case_status}.',
        'request': serializer.data,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def lawyer_match_view(request):
    """
    Suggest relevant lawyers based on analyzed document type and risk categories.
    """
    doc_type = request.query_params.get('document_type', '').strip()
    risk_categories_str = request.query_params.get('risk_categories', '').strip()
    
    # Keyword-mapping dictionary matching categories in document_classifier.py
    mapping = {
        'nda': ["Corporate Law", "IP Law", "Contract Law", "Intellectual Property"],
        'non-disclosure agreement (nda)': ["Corporate Law", "IP Law", "Contract Law", "Intellectual Property"],
        'non-disclosure': ["Corporate Law", "IP Law", "Contract Law", "Intellectual Property"],
        
        'employment': ["Employment Law", "Labor Law", "HR Compliance", "Contract Law"],
        'employment agreement': ["Employment Law", "Labor Law", "HR Compliance", "Contract Law"],
        
        'service_agreement': ["Contract Law", "Corporate Law", "Commercial Law"],
        'service agreement / msa': ["Contract Law", "Corporate Law", "Commercial Law"],
        'service agreement': ["Contract Law", "Corporate Law", "Commercial Law"],
        
        'lease': ["Real Estate", "Property Law", "Tenant Law", "Landlord Tenant Law"],
        'rental / lease agreement': ["Real Estate", "Property Law", "Tenant Law", "Landlord Tenant Law"],
        'rental agreement': ["Real Estate", "Property Law", "Tenant Law", "Landlord Tenant Law"],
        'lease agreement': ["Real Estate", "Property Law", "Tenant Law", "Landlord Tenant Law"],
        
        'purchase': ["Commercial Law", "Contract Law", "Corporate Law", "Consumer Protection"],
        'sale / purchase agreement': ["Commercial Law", "Contract Law", "Corporate Law", "Consumer Protection"],
        'purchase agreement': ["Commercial Law", "Contract Law", "Corporate Law", "Consumer Protection"],
        'sale agreement': ["Commercial Law", "Contract Law", "Corporate Law", "Consumer Protection"],
        
        'power_of_attorney': ["Estate Planning", "Family Law", "General Practice", "Property Law"],
        'power of attorney (poa)': ["Estate Planning", "Family Law", "General Practice", "Property Law"],
        'power of attorney': ["Estate Planning", "Family Law", "General Practice", "Property Law"],
        
        'partnership': ["Corporate Law", "Business Law", "Partnership Law", "Contract Law"],
        'partnership agreement': ["Corporate Law", "Business Law", "Partnership Law", "Contract Law"],
        
        'loan': ["Banking & Finance", "Finance Law", "Debt Collection", "Contract Law"],
        'loan agreement': ["Banking & Finance", "Finance Law", "Debt Collection", "Contract Law"],
        
        'privacy_policy': ["IP Law", "Cybersecurity & Privacy", "Technology Law", "Corporate Law", "Data Privacy"],
        'privacy policy': ["IP Law", "Cybersecurity & Privacy", "Technology Law", "Corporate Law", "Data Privacy"],
        
        'terms_of_service': ["Technology Law", "Contract Law", "Consumer Protection", "Corporate Law"],
        'terms & conditions / terms of service': ["Technology Law", "Contract Law", "Consumer Protection", "Corporate Law"],
        'terms of service': ["Technology Law", "Contract Law", "Consumer Protection", "Corporate Law"],
        'terms and conditions': ["Technology Law", "Contract Law", "Consumer Protection", "Corporate Law"],
        
        'software_license': ["IP Law", "Intellectual Property", "Technology Law", "Contract Law"],
        'software license agreement': ["IP Law", "Intellectual Property", "Technology Law", "Contract Law"],
        
        'saas': ["Technology Law", "IP Law", "Corporate Law", "Contract Law", "SaaS Law"],
        'saas agreement': ["Technology Law", "IP Law", "Corporate Law", "Contract Law", "SaaS Law"],
        
        'generic': ["Contract Law", "Corporate Law", "General Practice", "Commercial Law"],
        'general agreement': ["Contract Law", "Corporate Law", "General Practice", "Commercial Law"],
        'general commercial agreement': ["Contract Law", "Corporate Law", "General Practice", "Commercial Law"],
    }
    
    doc_type_lower = doc_type.lower()
    specs = mapping.get(doc_type_lower)
    if not specs:
        # Try substring matching
        for key, val in mapping.items():
            if key in doc_type_lower or doc_type_lower in key:
                specs = val
                break
    if not specs:
        # Fallback to generic
        specs = mapping['generic']
        
    profiles = LawyerProfile.objects(verification_status='approved')
    matched_results = []
    
    for profile in profiles:
        # Check if the lawyer has any specialization matching target specs
        overlap = [
            s for s in profile.specializations 
            if any(target.lower() in s.lower() or s.lower() in target.lower() for target in specs)
        ]
        if overlap:
            data = LawyerProfileSerializer(profile).data
            _annotate_rating(data, profile.user)
            matched_results.append((profile, data))
            
    # Sort matched_results:
    # Primary: average_rating (descending), secondary: experience_years (descending)
    # Treat average_rating of None as 0.0 for sorting.
    def get_sort_key(item):
        _, data = item
        rating = data.get('average_rating')
        rating_val = float(rating) if rating is not None else 0.0
        exp = int(data.get('experience_years') or 0)
        return (rating_val, exp)
        
    matched_results.sort(key=get_sort_key, reverse=True)
    
    # Return top 3 to 5 matching lawyers (we will take up to 5)
    sorted_data = [data for _, data in matched_results[:5]]
    
    return Response(sorted_data, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def my_lawyer_profile_view(request):
    """GET/PATCH the authenticated lawyer's own profile."""
    if not request.user.is_lawyer:
        return Response(
            {'error': 'Only lawyer accounts can access this endpoint.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        profile = LawyerProfile.objects.get(user=request.user)
    except LawyerProfile.DoesNotExist:
        return Response(
            {'error': 'Lawyer profile not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == 'GET':
        serializer = LawyerProfileSerializer(profile)
        return Response(serializer.data)

    # PATCH
    serializer = LawyerProfileEditSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if 'bio' in data:
        profile.bio = data['bio']
    if 'specializations' in data:
        profile.specializations = data['specializations']
    if 'experience_years' in data:
        profile.experience_years = data['experience_years']
    if 'consultation_fee' in data:
        profile.consultation_fee = data['consultation_fee']
    if 'education' in data:
        profile.education = data['education']
    if 'law_firm' in data:
        profile.law_firm = data['law_firm']
    if 'license_number' in data:
        profile.license_number = data['license_number']
    if 'bar_council_id' in data:
        profile.bar_council_id = data['bar_council_id']
    if 'verification_documents' in data:
        profile.verification_documents = data['verification_documents']

    # Update verification status from 'not_submitted' or 'rejected' to 'pending' upon onboarding/resubmission
    if profile.verification_status in ['not_submitted', 'rejected']:
        has_license = bool(data.get('license_number') or profile.license_number)
        has_bar_id = bool(data.get('bar_council_id') or profile.bar_council_id)
        if has_license and has_bar_id:
            profile.verification_status = 'pending'
            request.user.lawyer_verification_status = 'pending'
            request.user.save()

    profile.save()
    return Response(LawyerProfileSerializer(profile).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_quick_reply_templates_view(request):
    """Let a lawyer update their quick reply templates."""
    if not request.user.is_lawyer:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    profile = LawyerProfile.objects(user=request.user).first()
    if not profile:
        return Response({'error': 'Lawyer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    templates = request.data.get('quick_reply_templates')
    if templates is None:
        return Response({'error': 'quick_reply_templates is required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not isinstance(templates, list):
        return Response({'error': 'quick_reply_templates must be a list.'}, status=status.HTTP_400_BAD_REQUEST)

    for t in templates:
        if not isinstance(t, dict) or 'label' not in t or 'message' not in t:
            return Response({'error': 'Each template must have "label" and "message" fields.'}, status=status.HTTP_400_BAD_REQUEST)

    profile.quick_reply_templates = templates
    profile.save()

    return Response({
        'message': 'Quick reply templates updated.',
        'quick_reply_templates': profile.quick_reply_templates,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_consultations_view(request):
    """Export accepted consultations as CSV for the authenticated lawyer."""
    if not request.user.is_lawyer:
        return Response({'error': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

    qs = LawyerConnectionRequest.objects(lawyer=request.user, status='accepted').order_by('-created_at')

    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            qs = qs.filter(created_at__gte=start_dt)
        except ValueError:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            qs = qs.filter(created_at__lte=end_dt)
        except ValueError:
            pass

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="consultations_export_{datetime.utcnow().strftime("%Y%m%d")}.csv"'

    writer = csv.writer(response)
    writer.writerow(['Client Name', 'Client Email', 'Date Requested', 'Preferred Time', 'Case Status', 'Message'])

    for req in qs:
        client_name = (req.client.name if hasattr(req.client, 'name') else '') or req.client.username or ''
        client_email = (req.client.email if hasattr(req.client, 'email') else '') or ''
        created = req.created_at.strftime('%Y-%m-%d %H:%M') if req.created_at else ''
        pref_time = req.preferred_time.strftime('%Y-%m-%d %H:%M') if req.preferred_time else ''
        case_status = req.case_status or ''
        message = req.message or ''
        writer.writerow([client_name, client_email, created, pref_time, case_status, message])

    return response


# ==========================================
# Admin Endpoints (Lawyer verifications & Platform Stats)
# ==========================================

def _serialize_lawyer_profile(profile):
    user = profile.user
    return {
        'lawyer_user_id': str(user.id) if user else None,
        'name': getattr(user, 'name', '') or (user.username if user else ''),
        'email': user.email if user else '',
        'username': user.username if user else '',
        'phone': profile.phone,
        'license_number': profile.license_number,
        'bar_council_id': profile.bar_council_id,
        'education': profile.education,
        'experience_years': profile.experience_years,
        'verification_documents': profile.verification_documents,
        'verification_status': profile.verification_status,
        'verification_notes': getattr(profile, 'verification_notes', ''),
        'verified_at': profile.verified_at.isoformat() if profile.verified_at else None,
        'created_at': profile.created_at.isoformat() if getattr(profile, 'created_at', None) else None,
    }


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pending_lawyers(request):
    """List all LawyerProfiles with verification_status='pending'"""
    pending_profiles = LawyerProfile.objects(verification_status='pending')
    data = [_serialize_lawyer_profile(p) for p in pending_profiles]
    return Response(data, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_verify_lawyer(request, lawyer_user_id):
    """Approve or reject a lawyer verification request"""
    status_param = request.data.get('status')
    notes = request.data.get('notes', '').strip()

    if status_param not in ['approved', 'rejected']:
        return Response({'error': 'Invalid status. Must be approved or rejected.'}, status=status.HTTP_400_BAD_REQUEST)

    if status_param == 'rejected' and not notes:
        return Response({'error': 'Rejection notes are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects(id=lawyer_user_id).first()
    except Exception:
        user = None

    if not user or user.role != 'lawyer':
        return Response({'error': 'Lawyer not found.'}, status=status.HTTP_404_NOT_FOUND)

    profile = LawyerProfile.objects(user=user).first()
    if not profile:
        return Response({'error': 'Lawyer profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Update status
    from django.utils import timezone
    from authentication.models import Notification

    if status_param == 'approved':
        profile.verification_status = 'approved'
        profile.verified_at = timezone.now()
        profile.verification_notes = notes
        user.lawyer_verification_status = 'approved'
        user.is_lawyer_verified = True
    else:
        profile.verification_status = 'rejected'
        profile.verified_at = None
        profile.verification_notes = notes
        user.lawyer_verification_status = 'rejected'
        user.is_lawyer_verified = False

    profile.save()
    user.save()

    # Send a notification using the existing Notification model
    try:
        Notification(
            recipient=user,
            sender=request.user,
            notification_type='lawyer_verification',
            document_id='system',
            message=f"Your lawyer verification status has been updated to {status_param}." + (f" Reason: {notes}" if notes else "")
        ).save()
    except Exception as e:
        print(f"Error creating notification: {e}")

    return Response({'message': f'Lawyer status updated to {status_param}.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_all_lawyers(request):
    """List all lawyers regardless of status (approved/pending/rejected)"""
    profiles = LawyerProfile.objects.all()
    data = [_serialize_lawyer_profile(p) for p in profiles]
    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """Get platform-wide admin statistics"""
    from document_summarizer.models import DocumentSession
    from documents.mongo_client import conversations_collection

    total_users = User.objects.count()
    
    # Lawyer counts by verification status
    approved_lawyers = LawyerProfile.objects(verification_status='approved').count()
    pending_lawyers = LawyerProfile.objects(verification_status='pending').count()
    rejected_lawyers = LawyerProfile.objects(verification_status='rejected').count()

    # Document counts
    try:
        total_created = conversations_collection.count_documents({})
    except Exception:
        total_created = 0

    try:
        total_analyzed = DocumentSession.objects.count()
    except Exception:
        total_analyzed = 0

    total_connections = LawyerConnectionRequest.objects.count()
    total_reviews = LawyerReview.objects.count()

    stats = {
        'total_users': total_users,
        'lawyers': {
            'approved': approved_lawyers,
            'pending': pending_lawyers,
            'rejected': rejected_lawyers,
            'total': approved_lawyers + pending_lawyers + rejected_lawyers
        },
        'documents': {
            'created': total_created,
            'analyzed': total_analyzed,
            'total': total_created + total_analyzed
        },
        'total_connection_requests': total_connections,
        'total_reviews': total_reviews
    }

    return Response(stats, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAdminUser])
def admin_manage_role(request):
    """Allows the super admin to view admins and promote/demote users to admin or superadmin status"""
    # Check if request.user is the super admin
    if request.user.email.lower() != 'nileshmori7757@gmail.com' and not getattr(request.user, 'is_superuser', False):
        return Response({'error': 'Only the super admin can perform this action.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        admins = User.objects(role='admin')
        data = [{
            'id': str(u.id),
            'username': u.username,
            'email': u.email,
            'name': getattr(u, 'name', ''),
            'is_superuser': getattr(u, 'is_superuser', False)
        } for u in admins]
        return Response(data, status=status.HTTP_200_OK)

    target_email = request.data.get('email')
    target_role = request.data.get('role')
    is_superuser_param = request.data.get('is_superuser')

    if not target_email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects(email=target_email.lower()).first()
    except Exception:
        user = None

    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Perform updates
    if target_role:
        if target_role not in ['client', 'lawyer', 'admin']:
            return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        user.role = target_role

    if is_superuser_param is not None:
        user.is_superuser = bool(is_superuser_param)

    user.save()
    return Response({
        'message': f'User {target_email} updated successfully.',
        'role': user.role,
        'is_superuser': user.is_superuser
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_verification_doc(request):
    """Upload verification document to Cloudinary"""
    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        return Response({'error': 'No file was uploaded.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate file type (accept PDF, JPG, PNG only)
    filename = uploaded_file.name.lower()
    allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
    if not any(filename.endswith(ext) for ext in allowed_extensions):
        return Response({'error': 'Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate file size (limit 10MB)
    max_size = 10 * 1024 * 1024 # 10MB
    if uploaded_file.size > max_size:
        return Response({'error': 'File size exceeds 10MB limit.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(uploaded_file)
        secure_url = upload_result.get('secure_url')
        return Response({'secure_url': secure_url}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error uploading to Cloudinary: {e}")
        return Response({'error': f'Upload failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)