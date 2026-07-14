from rest_framework import serializers
from authentication.serializers import UserSerializer
from .models import LawyerProfile, LawyerConnectionRequest, LawyerReview


class LawyerProfileSerializer(serializers.Serializer):
    """Serializer for lawyer public profile"""

    id = serializers.CharField(read_only=True)
    user = UserSerializer(read_only=True)
    phone = serializers.CharField(read_only=True)
    education = serializers.CharField(read_only=True)
    experience_years = serializers.IntegerField(read_only=True)
    law_firm = serializers.CharField(read_only=True)
    specializations = serializers.ListField(child=serializers.CharField(), read_only=True)
    license_number = serializers.CharField(read_only=True)
    bar_council_id = serializers.CharField(read_only=True)
    consultation_fee = serializers.CharField(read_only=True)
    bio = serializers.CharField(read_only=True)
    verification_status = serializers.CharField(read_only=True)
    verification_notes = serializers.CharField(read_only=True)
    availability = serializers.JSONField(required=False)
    # Computed fields (injected by views)
    average_rating = serializers.FloatField(read_only=True, required=False)
    review_count = serializers.IntegerField(read_only=True, required=False)


class LawyerConnectionRequestSerializer(serializers.Serializer):
    """Serializer for lawyer connection requests"""

    id = serializers.CharField(read_only=True)
    client = UserSerializer(read_only=True)
    lawyer = UserSerializer(read_only=True)
    message = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(read_only=True)
    request_type = serializers.CharField(required=False, default='consultation')
    preferred_contact_method = serializers.CharField(required=False, allow_blank=True)
    preferred_contact_value = serializers.CharField(required=False, allow_blank=True)
    preferred_time = serializers.DateTimeField(required=False, allow_null=True)
    meeting_link = serializers.CharField(read_only=True)
    case_status = serializers.CharField(read_only=True)
    case_notes = serializers.CharField(read_only=True, required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class LawyerConnectionStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['accepted', 'declined'])
    message = serializers.CharField(required=False, allow_blank=True)


class LawyerReviewSerializer(serializers.Serializer):
    """Serializer for lawyer reviews"""

    id = serializers.CharField(read_only=True)
    lawyer = serializers.SerializerMethodField()
    client = serializers.SerializerMethodField()
    connection_request_id = serializers.SerializerMethodField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    review_text = serializers.CharField(required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)

    def get_lawyer(self, obj):
        try:
            u = obj.lawyer
            return {'id': str(u.id), 'name': u.name or u.username}
        except Exception:
            return None

    def get_client(self, obj):
        try:
            u = obj.client
            return {'id': str(u.id), 'name': u.name or u.username}
        except Exception:
            return None

    def get_connection_request_id(self, obj):
        try:
            return str(obj.connection_request.id)
        except Exception:
            return None


class LawyerProfileEditSerializer(serializers.Serializer):
    """Serializer for lawyers editing their own profile (self-service)."""

    bio = serializers.CharField(required=False, allow_blank=True)
    specializations = serializers.ListField(child=serializers.CharField(), required=False)
    experience_years = serializers.IntegerField(required=False)
    consultation_fee = serializers.CharField(required=False, allow_blank=True)
    education = serializers.CharField(required=False, allow_blank=True)
    law_firm = serializers.CharField(required=False, allow_blank=True)
