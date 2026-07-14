from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from mongoengine import DoesNotExist
from authentication.models import User
from .models import LawyerProfile, LawyerConnectionRequest
from chat.models import ChatConversation, ChatMessage
import cloudinary
import cloudinary.uploader
from uuid import uuid4
from datetime import datetime

from .serializers import (
    LawyerProfileSerializer,
    LawyerConnectionRequestSerializer,
    LawyerConnectionStatusSerializer,
)
from authentication.serializers import UserSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def lawyer_list_view(request):
    """List approved lawyers with optional specialization filter"""
    specialization = request.query_params.get('specialization', '').strip()
    profiles = LawyerProfile.objects(verification_status='approved')
    
    if specialization:
        profiles = profiles.filter(specializations__icontains=specialization)
    
    serializer = LawyerProfileSerializer(profiles, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


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

    summary = {
        'total_requests': connection_requests.count(),
        'pending_requests': connection_requests.filter(status='pending').count(),
        'accepted_requests': connection_requests.filter(status='accepted').count(),
        'declined_requests': connection_requests.filter(status='declined').count(),
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