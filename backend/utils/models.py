from mongoengine import Document, StringField, ReferenceField, DateTimeField, NULLIFY
from datetime import datetime
from authentication.models import User

class SupportQuery(Document):
    """Stores contact form submissions and replies from admins"""
    user = ReferenceField(User, required=False, reverse_delete_rule=NULLIFY)
    name = StringField(max_length=150)
    email = StringField(max_length=255, required=True)
    subject = StringField(max_length=255, required=True)
    message = StringField(required=True)
    status = StringField(choices=('open', 'answered', 'closed'), default='open')
    admin_reply = StringField(required=False)
    replied_by = ReferenceField(User, required=False, reverse_delete_rule=NULLIFY)
    replied_at = DateTimeField(required=False)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'support_queries',
        'indexes': [
            'status',
            '-created_at'
        ]
    }
