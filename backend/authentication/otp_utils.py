import random
import string
from django.core.mail import send_mail
from django.conf import settings
from datetime import datetime, timedelta

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def create_and_send_otp(user):
    """Generate OTP, save to user, and send via email"""
    otp_code = generate_otp()
    user.otp_code = otp_code
    user.otp_created_at = datetime.now()
    user.save()
    
    # Send OTP via email
    subject = 'Your OTP for AdvocAI Verification'
    message = f'Your OTP code is: {otp_code}\n\nThis code will expire in 3 minutes.'
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [user.email]
    
    try:
        send_mail(subject, message, from_email, recipient_list)
        return True
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False

def is_otp_valid(user, otp_code):
    """Validate OTP code and check expiration (10 minutes)"""
    if not user.otp_code or not user.otp_created_at:
        return False
    
    if user.otp_code != otp_code:
        return False
    
    # Check if OTP is expired (10 minutes)
    expiration_time = user.otp_created_at + timedelta(minutes=10)
    if datetime.now() > expiration_time:
        return False
    
    return True

def clear_otp(user):
    """Clear OTP after successful verification"""
    user.otp_code = None
    user.otp_created_at = None
    user.save()
