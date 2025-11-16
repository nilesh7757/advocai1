from mongoengine import (
    Document,
    StringField,
    DateTimeField,
    BooleanField,
    ReferenceField,
    ListField,
    DictField,
)
from datetime import datetime
from authentication.models import User

class DocumentSession(Document):
    """Document session for storing uploaded documents and their summaries"""
    user = ReferenceField(User, required=True)
    document_text = StringField(required=True)
    summary = StringField(required=True)
    highlighted_preview = StringField()
    high_risk_clauses = ListField(DictField())
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'document_sessions',
        'indexes': [
            'user',
            '-created_at'
        ]
    }
    
    def __str__(self):
        return f"Session {self.id} - {self.user.email}"

class ChatMessage(Document):
    """Chat messages for document Q&A"""
    session = ReferenceField(DocumentSession, required=True)
    message = StringField(required=True)
    is_user = BooleanField(default=True)  # True for user, False for AI
    created_at = DateTimeField(default=datetime.utcnow)
    
    meta = {
        'collection': 'chat_messages',
        'indexes': [
            'session',
            'created_at'
        ]
    }
    
    def __str__(self):
        return f"{'User' if self.is_user else 'AI'}: {self.message[:50]}"
