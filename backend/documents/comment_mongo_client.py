from pymongo import MongoClient
from bson.objectid import ObjectId
from django.conf import settings
import datetime

def get_mongo_db():
    client = MongoClient(settings.MONGO_URI)
    return client[settings.MONGO_DB_NAME]

def get_comments_collection():
    db = get_mongo_db()
    return db.comments

def serialize_comment(comment):
    """
    Serializes a MongoDB comment document into a dictionary suitable for API response.
    Handles ObjectId conversion and ensures datetime objects are ISO formatted.
    """
    if not comment:
        return None
    
    serialized = {
        'id': str(comment['_id']),
        'document_id': comment.get('document_id'),
        'user': comment.get('user'),
        'content': comment.get('content'),
        'position': comment.get('position'),
        'created_at': comment.get('created_at').isoformat() if isinstance(comment.get('created_at'), datetime.datetime) else comment.get('created_at'),
        'parent_comment': str(comment['parent_comment']) if comment.get('parent_comment') else None,
        'replies': [],
        'mentions': comment.get('mentions', [])
    }
    return serialized

def get_comments_for_document(document_id):
    """
    Retrieves all comments for a given document_id, structured with replies.
    """
    comments_collection = get_comments_collection()
    
    all_raw_comments = list(comments_collection.find({'document_id': document_id}).sort('created_at', 1))
    
    all_serialized_comments = [serialize_comment(comment) for comment in all_raw_comments]
    
    comments_by_id = {comment['id']: comment for comment in all_serialized_comments}
    
    root_comments = []
    for comment in all_serialized_comments:
        if comment.get('parent_comment'):
            parent_id = comment['parent_comment']
            if parent_id in comments_by_id:
                comments_by_id[parent_id].setdefault('replies', []).append(comment)
            else:
                root_comments.append(comment)
        else:
            root_comments.append(comment)
            
    return root_comments

def add_comment(document_id, user, content, position=None, parent_comment_id=None):
    """
    Adds a new comment to the MongoDB comments collection.
    """
    import re
    from authentication.models import User as AuthUser, Notification as AuthNotification
    
    # Extract mentions
    mentions_usernames = re.findall(r'@([a-zA-Z0-9_-]+)', content)
    mentions_usernames = list(set(mentions_usernames))
    
    mentioned_users = []
    for username in mentions_usernames:
        try:
            u = AuthUser.objects.get(username=username)
            mentioned_users.append(u)
        except Exception:
            pass
            
    comments_collection = get_comments_collection()
    
    comment_data = {
        'document_id': document_id,
        'user': user,
        'content': content,
        'position': position,
        'created_at': datetime.datetime.now(datetime.timezone.utc),
        'parent_comment': ObjectId(parent_comment_id) if parent_comment_id else None,
        'mentions': [u.username for u in mentioned_users]
    }
    
    result = comments_collection.insert_one(comment_data)
    
    # Create notifications
    sender_user = None
    try:
        sender_user = AuthUser.objects.get(username=user)
    except Exception:
        pass
        
    for recipient in mentioned_users:
        if sender_user and recipient.id == sender_user.id:
            continue
        prefs = getattr(recipient, 'notification_preferences', {}) or {}
        if not prefs.get('mentions', True):
            continue
        try:
            AuthNotification(
                recipient=recipient,
                sender=sender_user,
                notification_type='mention',
                document_id=str(document_id),
                message=f"{sender_user.username if sender_user else 'Someone'} mentioned you in a comment."
            ).save()
        except Exception as e:
            print(f"Error creating notification: {e}")
    
    new_comment = comments_collection.find_one({'_id': result.inserted_id})
    return new_comment
