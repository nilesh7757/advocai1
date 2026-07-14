from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from mongoengine import DoesNotExist
from .models import User, LawyerProfile, LawyerConnectionRequest
import random
import cloudinary
import cloudinary.uploader
import requests as http_requests

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    GoogleAuthSerializer,
    VerifyOTPSerializer,
    ResendOTPSerializer,
    UserProfileSerializer,
    LawyerProfileSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    LawyerConnectionRequestSerializer,
    ChangePasswordSerializer,
    AddPasswordSerializer,
    LawyerConnectionStatusSerializer,
)
from datetime import datetime
from uuid import uuid4

from .otp_utils import create_and_send_otp, is_otp_valid, clear_otp
from utils.permissions import IsAdminUser


def get_tokens_for_user(user):
    """Generate JWT tokens for a MongoEngine user"""
    refresh = RefreshToken()
    refresh["user_id"] = str(user.id)
    refresh["email"] = user.email
    refresh["token_version"] = getattr(user, "token_version", 0)

    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


@api_view(["POST"])
@permission_classes([AllowAny])
def signup_view(request):
    """Register new user and send OTP for verification"""
    try:
        # Validate request data
        if not request.data:
            return Response(
                {"error": "No data provided. Please fill in all required fields."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            # Format validation errors for better readability
            errors = {}
            for field, messages in serializer.errors.items():
                if isinstance(messages, list):
                    errors[field] = messages[0] if messages else "Invalid value"
                else:
                    errors[field] = str(messages)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Create user
        try:
            user = serializer.save()
        except Exception as e:
            return Response(
                {
                    "error": "Failed to create user account. Please try again.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # User is not verified yet, send OTP
        user.is_verified = False
        user.save()

        # Generate and send OTP
        try:
            otp_sent = create_and_send_otp(user)

            if not otp_sent:
                # Rollback user creation if OTP fails
                user.delete()
                return Response(
                    {
                        "error": "Failed to send verification email. Please check your email address and try again."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            # Rollback user creation if OTP fails
            user.delete()
            return Response(
                {
                    "error": "Email service temporarily unavailable. Please try again later.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        response_payload = {
            "message": "Registration successful. OTP sent to your email. Please verify to continue.",
            "email": user.email,
            "requires_verification": True,
            "redirect": "verify-otp",
            "role": user.role,
            "lawyer_verification_status": user.lawyer_verification_status,
        }
        if user.role == "lawyer":
            response_payload["lawyer_message"] = (
                "Your lawyer profile is pending verification. Our team will review your credentials shortly."
            )
        return Response(response_payload, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {
                "error": "An unexpected error occurred during registration. Please try again.",
                "details": str(e) if settings.DEBUG else None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """Login user with email and password"""
    try:
        # Validate request data
        if not request.data:
            return Response(
                {"error": "Please provide email and password."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            # Format validation errors
            errors = {}
            for field, messages in serializer.errors.items():
                if isinstance(messages, list):
                    errors[field] = messages[0] if messages else "Invalid value"
                else:
                    errors[field] = str(messages)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        # Check if user exists
        try:
            user = User.objects(email=email).first()
            if not user:
                return Response(
                    {
                        "error": "Invalid email or password. Please check your credentials and try again."
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        except DoesNotExist:
            return Response(
                {
                    "error": "Invalid email or password. Please check your credentials and try again."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except Exception as e:
            return Response(
                {
                    "error": "Database error. Please try again later.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Check if user registered with Google and has no usable password
        if user.auth_provider == "google" and not user.has_usable_password():
            return Response(
                {
                    "error": "This account is registered with Google. Please use Google Sign In."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Authenticate user
        try:
            authenticated_user = authenticate(email=email, password=password)
            if authenticated_user is None:
                return Response(
                    {
                        "error": "Invalid email or password. Please check your credentials and try again."
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            user = authenticated_user
        except Exception as e:
            return Response(
                {
                    "error": "Authentication failed. Please try again.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Check if user is verified
        if not user.is_verified:
            # Send OTP for verification
            try:
                otp_sent = create_and_send_otp(user)

                if not otp_sent:
                    return Response(
                        {
                            "error": "Failed to send verification email. Please try again."
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
            except Exception as e:
                return Response(
                    {
                        "error": "Email service temporarily unavailable. Please try again later.",
                        "details": str(e) if settings.DEBUG else None,
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            return Response(
                {
                    "message": "Your account is not verified. OTP sent to your email.",
                    "email": user.email,
                    "requires_verification": True,
                    "redirect": "verify-otp",
                },
                status=status.HTTP_200_OK,
            )

        # Check if two-factor authentication is enabled
        if getattr(user, "two_factor_enabled", False):
            try:
                otp_sent = create_and_send_otp(user)

                if not otp_sent:
                    return Response(
                        {
                            "error": "Failed to send two-factor OTP. Please try again."
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    )
            except Exception as e:
                return Response(
                    {
                        "error": "Email service temporarily unavailable. Please try again later.",
                        "details": str(e) if settings.DEBUG else None,
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            return Response(
                {
                    "message": "OTP sent for two-factor verification.",
                    "email": user.email,
                    "requires_2fa": True,
                    "redirect": "verify-otp",
                },
                status=status.HTTP_200_OK,
            )

        # User is verified, generate tokens
        try:
            user.last_login = datetime.now()
            user.save()
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
        except Exception as e:
            return Response(
                {
                    "error": "Failed to generate authentication tokens. Please try again.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "message": "Login successful",
                "user": user_data,
                "tokens": tokens,
                "redirect": "home",
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(
            {
                "error": "An unexpected error occurred during login. Please try again.",
                "details": str(e) if settings.DEBUG else None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth_view(request):
    """Authenticate user with Google OAuth"""
    try:
        # Validate request data
        if not request.data or not request.data.get("token"):
            return Response(
                {"error": "Google authentication token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {
                    "error": "Invalid Google authentication data.",
                    "details": serializer.errors,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        token = serializer.validated_data["token"]

        # Verify the token by fetching user info from Google
        # This works with both access tokens and ID tokens
        headers = {"Authorization": f"Bearer {token}"}
        response = http_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo", headers=headers, timeout=10
        )

        if response.status_code != 200:
            # If access token fails, try to verify as ID token
            if settings.GOOGLE_CLIENT_ID:
                try:
                    idinfo = id_token.verify_oauth2_token(
                        token, requests.Request(), settings.GOOGLE_CLIENT_ID
                    )
                    user_info = idinfo
                except Exception as e:
                    return Response(
                        {"error": "Invalid Google token", "details": str(e)},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
            else:
                return Response(
                    {
                        "error": "Failed to verify Google token",
                        "details": response.text,
                    },
                    status=status.HTTP_401_UNAUTHORIZED,
                )
        else:
            user_info = response.json()

        # Get user info from Google response
        email = user_info.get("email")
        google_id = user_info.get("sub")
        name = user_info.get("name", "")

        if not email:
            return Response(
                {"error": "Email not provided by Google"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if user exists
        user = None
        try:
            user = User.objects(email=email).first()
            if user:
                if not user.is_active:
                    return Response(
                        {"error": "This account has been banned/deactivated. Please contact support."},
                        status=status.HTTP_403_FORBIDDEN
                    )
                # Update Google ID if not set
                if not user.google_id:
                    user.google_id = google_id
                    user.auth_provider = "google"
                    user.is_verified = True  # Google users are auto-verified
                    user.save()
        except DoesNotExist:
            user = None

        if not user:
            # Create new user
            username = email.split("@")[0]
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects(username=username).first():
                username = f"{base_username}{counter}"
                counter += 1

            user = User.create_user(
                email=email,
                username=username,
                name=name,
                google_id=google_id,
                auth_provider="google",
                password="!",  # Unusable password for OAuth users
            )
            user.is_verified = True  # Google users are auto-verified
            user.save()

        user.last_login = datetime.now()
        user.save()
        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        return Response(
            {
                "message": "Google authentication successful",
                "user": user_data,
                "tokens": tokens,
                "redirect": "home",
            },
            status=status.HTTP_200_OK,
        )

    except http_requests.exceptions.Timeout:
        return Response(
            {"error": "Google authentication timed out. Please try again."},
            status=status.HTTP_504_GATEWAY_TIMEOUT,
        )
    except http_requests.exceptions.ConnectionError:
        return Response(
            {
                "error": "Unable to connect to Google services. Please check your internet connection."
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except http_requests.exceptions.RequestException as e:
        return Response(
            {
                "error": "Failed to communicate with Google services. Please try again.",
                "details": str(e) if settings.DEBUG else None,
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    except Exception as e:
        return Response(
            {
                "error": "Google authentication failed. Please try again.",
                "details": str(e) if settings.DEBUG else None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_detail_update_view(request):
    """Get or update authenticated user profile"""
    user = request.user

    if request.method == "GET":
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == "PATCH":
        data = request.data.copy()  # Make a mutable copy of request.data

        # Handle profile picture upload
        profile_picture_file = request.FILES.get("profile_picture")
        if profile_picture_file:
            try:
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(profile_picture_file)
                data["profile_picture"] = upload_result[
                    "secure_url"
                ]  # Add the URL to the data for the serializer
            except Exception as e:
                return Response(
                    {"error": f"Failed to upload profile picture: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # Handle cover photo upload
        cover_photo_file = request.FILES.get("cover_photo")
        if cover_photo_file:
            try:
                # Upload to Cloudinary
                upload_result = cloudinary.uploader.upload(cover_photo_file)
                data["cover_photo"] = upload_result[
                    "secure_url"
                ]  # Add the URL to the data for the serializer
            except Exception as e:
                return Response(
                    {"error": f"Failed to upload cover photo: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        # Handle other profile data (e.g., name)
        serializer = UserProfileSerializer(
            user, data=data, partial=True
        )  # Pass the modified data
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """Verify OTP and activate user account"""
    try:
        # Validate request data
        if not request.data:
            return Response(
                {"error": "Please provide email and OTP code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            # Format validation errors
            errors = {}
            for field, messages in serializer.errors.items():
                if isinstance(messages, list):
                    errors[field] = messages[0] if messages else "Invalid value"
                else:
                    errors[field] = str(messages)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        otp = serializer.validated_data["otp_code"]

        # Find user
        try:
            user = User.objects(email=email).first()
            if not user:
                return Response(
                    {"error": "No account found with this email address."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        except DoesNotExist:
            return Response(
                {"error": "No account found with this email address."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {
                    "error": "Database error. Please try again later.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Verify OTP
        try:
            purpose = serializer.validated_data.get("purpose", "signup")
            if is_otp_valid(user, otp):
                if purpose == "signup":
                    user.is_verified = True
                user.save()
                clear_otp(user)

                # Update last_login for 2FA login completion
                if purpose == "login_2fa":
                    user.last_login = datetime.now()
                    user.save()

                tokens = get_tokens_for_user(user)
                user_data = UserSerializer(user).data

                if purpose == "login_2fa":
                    return Response(
                        {
                            "message": "Two-factor verification successful.",
                            "user": user_data,
                            "tokens": tokens,
                            "redirect": "home",
                        },
                        status=status.HTTP_200_OK,
                    )

                return Response(
                    {
                        "message": "Account verified successfully. You can now login.",
                        "user": user_data,
                        "tokens": tokens,
                        "redirect": "home",
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Invalid or expired OTP. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except Exception as e:
            return Response(
                {
                    "error": "OTP verification failed. Please try again.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except Exception as e:
        return Response(
            {
                "error": "An unexpected error occurred. Please try again.",
                "details": str(e) if settings.DEBUG else None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def resend_otp_view(request):
    """Resend OTP to user's email"""
    try:
        # Validate request data
        if not request.data or not request.data.get("email"):
            return Response(
                {"error": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ResendOTPSerializer(data=request.data)
        if not serializer.is_valid():
            # Format validation errors
            errors = {}
            for field, messages in serializer.errors.items():
                if isinstance(messages, list):
                    errors[field] = messages[0] if messages else "Invalid value"
                else:
                    errors[field] = str(messages)
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        purpose = request.data.get("purpose", "signup")

        # Find user
        try:
            user = User.objects(email=email).first()
            if not user:
                return Response(
                    {"error": "No account found with this email address."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        except DoesNotExist:
            return Response(
                {"error": "No account found with this email address."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {
                    "error": "Database error. Please try again later.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Check if already verified (skip for 2FA login purpose)
        if purpose != "login_2fa" and user.is_verified:
            return Response(
                {"error": "Your account is already verified. Please login."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Send OTP
        try:
            otp_sent = create_and_send_otp(user)

            if otp_sent:
                return Response(
                    {"message": "New OTP sent to your email. Please check your inbox."},
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    {"error": "Failed to send OTP. Please try again."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            return Response(
                {
                    "error": "Email service temporarily unavailable. Please try again later.",
                    "details": str(e) if settings.DEBUG else None,
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    except Exception as e:
        return Response(
            {
                "error": "An unexpected error occurred. Please try again.",
                "details": str(e) if settings.DEBUG else None,
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout user by blacklisting the refresh token"""
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_all_devices_view(request):
    """Increment token_version to instantly invalidate all issued tokens."""
    try:
        user = request.user
        user.token_version = getattr(user, "token_version", 0) + 1
        user.last_login = datetime.now()
        user.save()
        return Response(
            {"message": "Logged out of all other devices."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def two_factor_toggle_view(request):
    """Enable or disable two-factor authentication for the authenticated user."""
    user = request.user

    # Users without a usable password (OAuth-only) cannot enable 2FA
    if not user.has_usable_password():
        return Response(
            {"error": "Two-factor authentication requires a password. Please add a password to your account first."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    enabled = request.data.get("enabled")
    if enabled is None:
        return Response(
            {"error": "The 'enabled' field is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user.two_factor_enabled = bool(enabled)
    user.save()

    return Response(
        {
            "message": "Two-factor authentication has been enabled." if user.two_factor_enabled else "Two-factor authentication has been disabled.",
            "two_factor_enabled": user.two_factor_enabled,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    """Soft-delete the authenticated user's account."""
    try:
        user = request.user

        # If user has a usable password, require password confirmation
        if user.has_usable_password():
            password = request.data.get("password")
            if not password:
                return Response(
                    {"error": "Password is required to delete your account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not user.check_password(password):
                return Response(
                    {"error": "Incorrect password. Please try again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Soft-delete: deactivate + invalidate all tokens
        user.is_active = False
        user.deactivated_at = datetime.now()
        user.token_version = getattr(user, "token_version", 0) + 1
        user.save()

        return Response(
            {"message": "Your account has been deleted."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def lawyer_list_view(request):
    """List approved lawyers"""
    profiles = LawyerProfile.objects.all()
    serializer = LawyerProfileSerializer(profiles, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def lawyer_detail_view(request, lawyer_id):
    """Retrieve lawyer detail"""
    try:
        user = User.objects(id=lawyer_id, role="lawyer").first()
    except DoesNotExist:
        user = None
    if not user:
        return Response(
            {"error": "Lawyer not found."}, status=status.HTTP_404_NOT_FOUND
        )

    profile = LawyerProfile.objects(user=user).first()
    if not profile:
        return Response(
            {"error": "Lawyer profile not found."}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = LawyerProfileSerializer(profile)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def connect_with_lawyer_view(request, lawyer_id):
    """Create a connection request with a lawyer"""
    if str(request.user.id) == lawyer_id:
        return Response(
            {"error": "You cannot connect with yourself."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        lawyer = User.objects(id=lawyer_id, role="lawyer").first()
    except DoesNotExist:
        lawyer = None

    if not lawyer:
        return Response(
            {"error": "Lawyer not found."}, status=status.HTTP_404_NOT_FOUND
        )

    profile = LawyerProfile.objects(user=lawyer).first()
    if not profile:
        return Response(
            {"error": "Lawyer is not available for connections yet."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    existing_request = LawyerConnectionRequest.objects(
        client=request.user, lawyer=lawyer, status="pending"
    ).first()
    if existing_request:
        serializer = LawyerConnectionRequestSerializer(existing_request)
        return Response(
            {
                "message": "You already have a pending connection request with this lawyer.",
                "request": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    message = request.data.get("message", "").strip()
    preferred_method = request.data.get("preferred_contact_method", "email")
    preferred_value = request.data.get("preferred_contact_value", request.user.email)
    preferred_time_str = request.data.get("preferred_time")
    meeting_link = request.data.get("meeting_link")

    preferred_time = None
    if preferred_time_str:
        try:
            preferred_time = datetime.fromisoformat(
                preferred_time_str.replace("Z", "+00:00")
            )
        except ValueError:
            return Response(
                {"error": "Invalid preferred time format. Use ISO 8601 format."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if not meeting_link:
        meeting_link = (
            f"https://meet.google.com/new?hs=224&authuser=0&advocai={uuid4().hex[:8]}"
        )

    connection_request = LawyerConnectionRequest.objects.create(
        client=request.user,
        lawyer=lawyer,
        message=message,
        preferred_contact_method=preferred_method,
        preferred_contact_value=preferred_value,
        preferred_time=preferred_time,
        meeting_link=meeting_link,
    )

    serializer = LawyerConnectionRequestSerializer(connection_request)
    return Response(
        {
            "message": "Connection request submitted successfully.",
            "request": serializer.data,
            "meeting_link": meeting_link,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lawyer_dashboard_view(request):
    """Return dashboard information for a lawyer"""
    if not request.user.is_lawyer:
        return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

    profile = LawyerProfile.objects(user=request.user).first()
    profile_data = LawyerProfileSerializer(profile).data if profile else None

    connection_requests = LawyerConnectionRequest.objects(lawyer=request.user).order_by(
        "-created_at"
    )
    connection_serializer = LawyerConnectionRequestSerializer(
        connection_requests, many=True
    )

    summary = {
        "total_requests": connection_requests.count(),
        "pending_requests": connection_requests.filter(status="pending").count(),
        "accepted_requests": connection_requests.filter(status="accepted").count(),
        "declined_requests": connection_requests.filter(status="declined").count(),
    }

    return Response(
        {
            "profile": profile_data,
            "user": UserSerializer(request.user).data,
            "connections": connection_serializer.data,
            "summary": summary,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def lawyer_connection_update_view(request, connection_id):
    """Allow lawyer to update connection request status"""
    if not request.user.is_lawyer:
        return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

    connection_request = LawyerConnectionRequest.objects(
        id=connection_id, lawyer=request.user
    ).first()
    if not connection_request:
        return Response(
            {"error": "Connection request not found."}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = LawyerConnectionStatusSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    new_status = serializer.validated_data["status"]
    connection_request.status = new_status
    connection_request.message = serializer.validated_data.get(
        "message", connection_request.message
    )
    connection_request.save()

    response_serializer = LawyerConnectionRequestSerializer(connection_request)
    return Response(
        {
            "message": f"Connection request {new_status}.",
            "request": response_serializer.data,
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password_view(request):
    """Send OTP for password reset"""
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]

    try:
        user = User.objects(email=email).first()
        if not user:
            return Response(
                {"error": "User with this email does not exist."},
                status=status.HTTP_404_NOT_FOUND,
            )
    except DoesNotExist:
        return Response(
            {"error": "User with this email does not exist."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Check if user registered with Google
    if user.auth_provider == "google":
        return Response(
            {
                "error": "This account is registered with Google. Please use Google Sign In. Password reset is not available for Google accounts."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Generate and send OTP for password reset
    otp_sent = create_and_send_otp(user)

    if not otp_sent:
        return Response(
            {"error": "Failed to send OTP. Please try again."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return Response(
        {"message": "OTP sent to your email for password reset.", "email": user.email},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_view(request):
    """Reset user password with OTP verification"""
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data["email"]
    otp = serializer.validated_data["otp_code"]
    new_password = serializer.validated_data["new_password"]

    try:
        user = User.objects(email=email).first()
        if not user:
            return Response(
                {"error": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )
    except DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    # Check if user registered with Google
    if user.auth_provider == "google":
        return Response(
            {
                "error": "This account is registered with Google. Password reset is not available."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify OTP
    if not is_otp_valid(user, otp):
        return Response(
            {"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST
        )

    # Reset password
    user.set_password(new_password)
    user.save()
    clear_otp(user)  # Clear OTP after successful reset

    return Response(
        {
            "message": "Password reset successfully. Please login with your new password."
        },
        status=status.HTTP_200_OK,
    )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Change user password"""
    user = request.user
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        if not user.check_password(serializer.data.get("current_password")):
            return Response({"error": "Incorrect current password."}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.data.get("new_password"))
        user.save()
        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
    print("ChangePasswordSerializer errors:", serializer.errors) # Debugging line
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_password_view(request):
    """Add a password to a Google-authenticated user"""
    user = request.user
    if user.auth_provider != 'google':
        return Response({"error": "This feature is only for users who signed up with Google."}, status=status.HTTP_400_BAD_REQUEST)
    if user.password and user.password != '!':
        return Response({"error": "You already have a password."}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = AddPasswordSerializer(data=request.data)
    if serializer.is_valid():
        user.set_password(serializer.data.get("new_password"))
        user.save()
        return Response({"message": "Password added successfully."}, status=status.HTTP_200_OK)
    print("AddPasswordSerializer errors:", serializer.errors) # Debugging line
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_view(request):
    """
    Fetch notifications for the current authenticated user.
    """
    from .models import Notification
    try:
        user = request.user
        notifications = Notification.objects(recipient=user).order_by('-created_at')
        
        serialized = []
        for n in notifications:
            serialized.append({
                'id': str(n.id),
                'sender': n.sender.username if n.sender else 'Someone',
                'notification_type': n.notification_type,
                'document_id': n.document_id,
                'message': n.message,
                'is_read': n.is_read,
                'created_at': n.created_at.isoformat() if n.created_at else None
            })
        return Response(serialized, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching notifications: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def mark_notification_read_view(request, notification_id):
    """
    Mark a notification as read.
    """
    from .models import Notification
    try:
        user = request.user
        notification = Notification.objects.get(id=notification_id, recipient=user)
        notification.is_read = True
        notification.save()
        return Response({'success': True}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error updating notification: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_stats_view(request):
    """Return activity counts for the authenticated user."""
    try:
        from document_summarizer.models import DocumentSession
        from lawyer.models import LawyerConnectionRequest
        from documents.mongo_client import conversations_collection

        user = request.user

        documents_analyzed_count = DocumentSession.objects(user=user).count()

        documents_created_count = conversations_collection.count_documents(
            {'owner': user.username}
        )

        lawyer_consultations_count = LawyerConnectionRequest.objects(
            (LawyerConnectionRequest.client == user) | (LawyerConnectionRequest.lawyer == user),
            status='accepted'
        ).count()

        return Response({
            'documents_analyzed_count': documents_analyzed_count,
            'documents_created_count': documents_created_count,
            'lawyer_consultations_count': lawyer_consultations_count,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching profile stats: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_users_view(request):
    """
    Search users for autocomplete/mentions.
    """
    query = request.GET.get('q', '').strip()
    try:
        if query:
            users = User.objects(username__icontains=query)[:10]
        else:
            users = User.objects()[:20]
            
        serialized = [{'username': u.username, 'name': u.name} for u in users]
        return Response(serialized, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ==========================================
# Admin Warning and Ban Endpoints
# ==========================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_users(request):
    """List all users for admin browsing with search and status filters, paginated"""
    search_query = request.query_params.get('search', '').strip()
    status_filter = request.query_params.get('status', '').strip()
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 10))

    users = User.objects.all()

    if search_query:
        from mongoengine.queryset.visitor import Q
        users = users.filter(Q(email__icontains=search_query) | Q(username__icontains=search_query) | Q(name__icontains=search_query))

    if status_filter == 'banned':
        users = users.filter(is_active=False)
    elif status_filter == 'active':
        users = users.filter(is_active=True)

    total_count = users.count()
    
    # Paginate
    start = (page - 1) * page_size
    end = start + page_size
    paginated_users = users.order_by('-date_joined')[start:end]

    data = [{
        'id': str(u.id),
        'username': u.username,
        'email': u.email,
        'name': getattr(u, 'name', ''),
        'role': u.role,
        'is_active': u.is_active,
        'warning_count': getattr(u, 'warning_count', 0),
        'warnings': getattr(u, 'warnings', []) or [],
        'ban_reason': getattr(u, 'ban_reason', ''),
        'date_joined': u.date_joined.isoformat() if u.date_joined else None,
    } for u in paginated_users]

    return Response({
        'count': total_count,
        'page': page,
        'page_size': page_size,
        'results': data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_warn_user(request, user_id):
    """Issue a warning to a user, auto-banning at 3 strikes"""
    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'error': 'Warning reason is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects(id=user_id).first()
    except Exception:
        user = None

    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Don't allow warning/banning yourself
    if str(user.id) == str(request.user.id):
        return Response({'error': 'You cannot issue warnings to yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    # Append warning
    warning_entry = {
        'reason': reason,
        'issued_by': request.user.username,
        'issued_at': datetime.utcnow().isoformat()
    }
    
    if not hasattr(user, 'warnings') or user.warnings is None:
        user.warnings = []
        
    user.warnings.append(warning_entry)
    user.warning_count = len(user.warnings)

    auto_banned = False
    if user.warning_count >= 3:
        user.is_active = False
        user.ban_reason = "Automatically banned after 3 warnings."
        auto_banned = True

    user.save()

    # Send Notification
    try:
        from authentication.models import Notification
        msg = f"You have been issued a warning for: {reason}."
        if auto_banned:
            msg += " Your account has been automatically banned due to reaching 3 strikes."
            
        Notification(
            recipient=user,
            sender=request.user,
            notification_type='warning',
            document_id='system',
            message=msg
        ).save()
    except Exception as e:
        print(f"Error creating warning notification: {e}")

    return Response({
        'message': 'Warning issued successfully.',
        'warning_count': user.warning_count,
        'is_active': user.is_active,
        'ban_reason': getattr(user, 'ban_reason', '')
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_ban_user(request, user_id):
    """Directly ban a user"""
    reason = request.data.get('reason', '').strip()
    if not reason:
        return Response({'error': 'Ban reason is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects(id=user_id).first()
    except Exception:
        user = None

    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if str(user.id) == str(request.user.id):
        return Response({'error': 'You cannot ban yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    user.is_active = False
    user.ban_reason = reason
    user.save()

    # Send Notification
    try:
        from authentication.models import Notification
        Notification(
            recipient=user,
            sender=request.user,
            notification_type='ban',
            document_id='system',
            message=f"Your account has been banned. Reason: {reason}"
        ).save()
    except Exception as e:
        print(f"Error creating ban notification: {e}")

    return Response({
        'message': 'User banned successfully.',
        'is_active': user.is_active,
        'ban_reason': user.ban_reason
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_unban_user(request, user_id):
    """Unban a banned user and optionally reset warning strikes"""
    reset_warnings = bool(request.data.get('reset_warnings', False))

    try:
        user = User.objects(id=user_id).first()
    except Exception:
        user = None

    if not user:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    user.is_active = True
    user.ban_reason = ''
    
    if reset_warnings:
        user.warning_count = 0
        user.warnings = []

    user.save()

    # Send Notification
    try:
        from authentication.models import Notification
        Notification(
            recipient=user,
            sender=request.user,
            notification_type='unban',
            document_id='system',
            message="Your account access has been reinstated by the administrator."
        ).save()
    except Exception as e:
        print(f"Error creating unban notification: {e}")

    return Response({
        'message': 'User reinstated successfully.',
        'is_active': user.is_active,
        'warning_count': user.warning_count
    }, status=status.HTTP_200_OK)
