from pymongo import MongoClient
from bson.objectid import ObjectId
from django.conf import settings
import datetime

def get_mongo_db():
    client = MongoClient(settings.MONGO_URI)
    return client[settings.MONGO_DB_NAME]

def get_signatures_collection():
    db = get_mongo_db()
    return db.signatures

def get_signatures_for_document(document_id):
    """
    Retrieves all signers/signatures for a given document_id.
    """
    col = get_signatures_collection()
    doc_sigs = col.find_one({'document_id': str(document_id)})
    if not doc_sigs:
        return []
    
    signers = doc_sigs.get('signers', [])
    for s in signers:
        if isinstance(s.get('signed_at'), datetime.datetime):
            s['signed_at'] = s['signed_at'].isoformat()
    return signers

def set_signers_for_document(document_id, signers_list):
    """
    Sets the list of signers for a document. Each signer has:
    {name, email, status: 'pending'|'signed'|'declined', signed_at: None, signature_url: None}
    """
    col = get_signatures_collection()
    
    formatted_signers = []
    for s in signers_list:
        formatted_signers.append({
            'name': s.get('name'),
            'email': s.get('email'),
            'status': s.get('status', 'pending'),
            'signed_at': None,
            'signature_url': s.get('signature_url')
        })
        
    col.update_one(
        {'document_id': str(document_id)},
        {'$set': {
            'signers': formatted_signers,
            'updated_at': datetime.datetime.now(datetime.timezone.utc)
        }},
        upsert=True
    )
    return formatted_signers

def update_signer_status(document_id, email, status, signature_url=None):
    """
    Updates the signature status of a signer identified by their email in a document.
    """
    col = get_signatures_collection()
    doc_sigs = col.find_one({'document_id': str(document_id)})
    if not doc_sigs:
        return False
        
    signers = doc_sigs.get('signers', [])
    updated = False
    for s in signers:
        if s.get('email') == email:
            s['status'] = status
            if status == 'signed':
                s['signed_at'] = datetime.datetime.now(datetime.timezone.utc)
                if signature_url:
                    s['signature_url'] = signature_url
            elif status == 'declined':
                s['signed_at'] = None
                s['signature_url'] = None
            updated = True
            break
            
    if updated:
        col.update_one(
            {'document_id': str(document_id)},
            {'$set': {
                'signers': signers,
                'updated_at': datetime.datetime.now(datetime.timezone.utc)
            }}
        )
        return True
    return False
