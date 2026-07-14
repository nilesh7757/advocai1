from mongoengine import (
    Document,
    StringField,
    BooleanField,
    DateTimeField,
    EmailField,
    ReferenceField,
    ListField,
    IntField,
    DictField,
    CASCADE,
)
from django.utils import timezone
from datetime import datetime
from authentication.models import User

class LawyerProfile(Document):
    """Extended profile information for lawyers"""

    user = ReferenceField(User, required=True, unique=True, reverse_delete_rule=CASCADE)
    phone = StringField(max_length=20, default='')
    education = StringField(max_length=255, default='')
    experience_years = IntField(default=0)
    law_firm = StringField(max_length=255, default='')
    specializations = ListField(StringField(max_length=120), default=list)
    license_number = StringField(max_length=120, required=True)
    bar_council_id = StringField(max_length=120, required=True)
    consultation_fee = StringField(max_length=120, default='')
    bio = StringField(default='')
    verification_documents = ListField(StringField(max_length=512), default=list)
    verification_status = StringField(
        max_length=32,
        default='pending',
        choices=('pending', 'approved', 'rejected'),
    )
    verification_notes = StringField(default='')
    verified_at = DateTimeField()
    availability = ListField(DictField(), default=list)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'lawyer_profiles',
        'db_alias': 'default',
        'indexes': [
            'verification_status',
            {'fields': ['user'], 'unique': True},
        ],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)


class LawyerConnectionRequest(Document):
    """Connection requests between clients and lawyers"""

    client = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    lawyer = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    message = StringField(default='')
    status = StringField(
        max_length=32,
        default='pending',
        choices=('pending', 'accepted', 'declined', 'withdrawn'),
    )
    request_type = StringField(
        max_length=32,
        default='consultation',
        choices=('consultation', 'quote'),
    )
    preferred_contact_method = StringField(max_length=32, default='email')
    preferred_contact_value = StringField(max_length=255, default='')
    preferred_time = DateTimeField(required=False, null=True)
    meeting_link = StringField(max_length=512, default='')
    # Case / matter tracking
    case_status = StringField(
        max_length=32,
        default='open',
        choices=('open', 'in_progress', 'resolved'),
    )
    case_notes = StringField(default='')
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'lawyer_connection_requests',
        'db_alias': 'default',
        'indexes': [
            {'fields': ['client', 'lawyer', 'status']},
            'lawyer',
            'client',
        ],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)


class LawyerReview(Document):
    """Reviews left by clients for lawyers after an accepted engagement"""

    lawyer = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    client = ReferenceField(User, required=True, reverse_delete_rule=CASCADE)
    connection_request = ReferenceField(
        LawyerConnectionRequest, required=True, reverse_delete_rule=CASCADE
    )
    rating = IntField(required=True, min_value=1, max_value=5)
    review_text = StringField(default='')
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'lawyer_reviews',
        'db_alias': 'default',
        'indexes': [
            # unique-together: one review per client+connection_request
            {'fields': ['client', 'connection_request'], 'unique': True},
            'lawyer',
        ],
    }