from django.test import TestCase, Client
from rest_framework import status
from unittest.mock import patch
from datetime import datetime
from authentication.models import User, Notification
from lawyer.models import LawyerProfile
from utils.models import SupportQuery
from authentication.views import get_tokens_for_user

class AdminPanelTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        # Clean database
        User.objects.delete()
        LawyerProfile.objects.delete()
        SupportQuery.objects.delete()
        Notification.objects.delete()

        # Create admin user
        self.admin_user = User.create_user(
            email='admin@example.com',
            username='adminuser',
            password='password'
        )
        self.admin_user.role = 'admin'
        self.admin_user.save()

        # Create regular client user
        self.client_user = User.create_user(
            email='client@example.com',
            username='clientuser',
            password='password'
        )
        self.client_user.role = 'client'
        self.client_user.save()

        # Create lawyer user and profile
        self.lawyer_user = User.create_user(
            email='lawyer@example.com',
            username='lawyeruser',
            password='password'
        )
        self.lawyer_user.role = 'lawyer'
        self.lawyer_user.save()

        self.lawyer_profile = LawyerProfile(
            user=self.lawyer_user,
            license_number='LIC-12345',
            bar_council_id='BAR-999',
            education='LL.B.',
            experience_years=5,
            verification_status='pending',
            verification_documents=['http://cloudinary.com/doc1.pdf']
        ).save()

        # Get tokens for auth headers
        admin_tokens = get_tokens_for_user(self.admin_user)
        self.admin_headers = {'HTTP_AUTHORIZATION': f'Bearer {admin_tokens["access"]}'}

        client_tokens = get_tokens_for_user(self.client_user)
        self.client_headers = {'HTTP_AUTHORIZATION': f'Bearer {client_tokens["access"]}'}

    def tearDown(self):
        User.objects.delete()
        LawyerProfile.objects.delete()
        SupportQuery.objects.delete()
        Notification.objects.delete()

    def test_permission_denied_for_non_admin(self):
        # Client tries to get pending lawyers
        response = self.client.get('/api/lawyer/admin/pending-lawyers/', **self.client_headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_pending_lawyers_list(self):
        response = self.client.get('/api/lawyer/admin/pending-lawyers/', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['license_number'], 'LIC-12345')
        self.assertEqual(data[0]['verification_status'], 'pending')

    def test_admin_verify_lawyer_approval(self):
        url = f'/api/lawyer/admin/lawyers/{self.lawyer_user.id}/verify/'
        response = self.client.patch(url, {
            'status': 'approved',
            'notes': 'All documents are valid.'
        }, content_type='application/json', **self.admin_headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify db updates
        profile = LawyerProfile.objects(user=self.lawyer_user).first()
        user = User.objects(id=self.lawyer_user.id).first()
        self.assertEqual(profile.verification_status, 'approved')
        self.assertEqual(profile.verification_notes, 'All documents are valid.')
        self.assertTrue(user.is_lawyer_verified)
        self.assertEqual(user.lawyer_verification_status, 'approved')

        # Check notification
        notifs = Notification.objects(recipient=self.lawyer_user)
        self.assertEqual(notifs.count(), 1)
        self.assertIn('approved', notifs.first().message)

    def test_admin_verify_lawyer_rejection_validation(self):
        url = f'/api/lawyer/admin/lawyers/{self.lawyer_user.id}/verify/'
        # Rejection reason is required
        response = self.client.patch(url, {
            'status': 'rejected',
            'notes': ''
        }, content_type='application/json', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Successful rejection
        response = self.client.patch(url, {
            'status': 'rejected',
            'notes': 'Document blurry.'
        }, content_type='application/json', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        profile = LawyerProfile.objects(user=self.lawyer_user).first()
        user = User.objects(id=self.lawyer_user.id).first()
        self.assertEqual(profile.verification_status, 'rejected')
        self.assertEqual(user.lawyer_verification_status, 'rejected')
        self.assertFalse(user.is_lawyer_verified)

    def test_admin_stats(self):
        response = self.client.get('/api/lawyer/admin/stats/', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn('total_users', data)
        self.assertIn('lawyers', data)
        self.assertEqual(data['total_users'], 3)
        self.assertEqual(data['lawyers']['pending'], 1)

    def test_super_admin_role_management(self):
        # Regular admin tries to manage role
        response = self.client.patch('/api/lawyer/admin/manage-admin-role/', {
            'email': 'client@example.com',
            'role': 'admin'
        }, content_type='application/json', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Make admin_user the official superadmin
        self.admin_user.email = 'nileshmori7757@gmail.com'
        self.admin_user.save()
        admin_tokens = get_tokens_for_user(self.admin_user)
        super_headers = {'HTTP_AUTHORIZATION': f'Bearer {admin_tokens["access"]}'}

        # Super admin gets admin list
        response = self.client.get('/api/lawyer/admin/manage-admin-role/', **super_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)

        # Super admin promotes client to admin
        response = self.client.patch('/api/lawyer/admin/manage-admin-role/', {
            'email': 'client@example.com',
            'role': 'admin',
            'is_superuser': True
        }, content_type='application/json', **super_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        client_db = User.objects(email='client@example.com').first()
        self.assertEqual(client_db.role, 'admin')
        self.assertTrue(client_db.is_superuser)

    def test_support_queries_submission_and_replies(self):
        # Submit a query anonymously
        response = self.client.post('/api/utils/contact/', {
            'name': 'Visitor',
            'email': 'visitor@example.com',
            'subject': 'Help',
            'message': 'Cannot sign up'
        }, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(SupportQuery.objects.count(), 1)

        query = SupportQuery.objects.first()
        self.assertEqual(query.name, 'Visitor')
        self.assertEqual(query.status, 'open')

        # Admin lists queries
        response = self.client.get('/api/utils/admin/queries/', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)

        # Admin replies to query
        url = f'/api/utils/admin/queries/{query.id}/reply/'
        response = self.client.patch(url, {
            'reply': 'Try clearing cache.'
        }, content_type='application/json', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        updated_query = SupportQuery.objects(id=query.id).first()
        self.assertEqual(updated_query.status, 'answered')
        self.assertEqual(updated_query.admin_reply, 'Try clearing cache.')

    def test_warning_count_and_auto_ban(self):
        # List users
        response = self.client.get('/api/auth/admin/users/', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['count'], 3)

        # Warn user 1
        url = f'/api/auth/admin/users/{self.client_user.id}/warn/'
        response = self.client.post(url, {'reason': 'Spamming'}, content_type='application/json', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        client_db = User.objects(id=self.client_user.id).first()
        self.assertEqual(client_db.warning_count, 1)
        self.assertTrue(client_db.is_active)

        # Warn user 2
        self.client.post(url, {'reason': 'Spamming again'}, content_type='application/json', **self.admin_headers)
        # Warn user 3 -> auto ban
        response = self.client.post(url, {'reason': 'Third strike'}, content_type='application/json', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        client_db = User.objects(id=self.client_user.id).first()
        self.assertEqual(client_db.warning_count, 3)
        self.assertFalse(client_db.is_active)
        self.assertEqual(client_db.ban_reason, 'Automatically banned after 3 warnings.')

        # Direct Ban and Unban
        self.admin_user.email = 'nileshmori7757@gmail.com'
        self.admin_user.save()
        
        # Direct Ban lawyer
        ban_url = f'/api/auth/admin/users/{self.lawyer_user.id}/ban/'
        response = self.client.post(ban_url, {'reason': 'Severe violation'}, content_type='application/json', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        lawyer_db = User.objects(id=self.lawyer_user.id).first()
        self.assertFalse(lawyer_db.is_active)
        self.assertEqual(lawyer_db.ban_reason, 'Severe violation')

        # Unban lawyer
        unban_url = f'/api/auth/admin/users/{self.lawyer_user.id}/unban/'
        response = self.client.post(unban_url, {'reset_warnings': True}, content_type='application/json', **self.admin_headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        lawyer_db = User.objects(id=self.lawyer_user.id).first()
        self.assertTrue(lawyer_db.is_active)
        self.assertEqual(lawyer_db.ban_reason, '')

    def test_lawyer_signup_step_1_no_professional_fields_required(self):
        # Delete existing lawyer user to avoid email conflicts
        User.objects(email='newlawyer@example.com').delete()
        User.objects(username='newlawyer').delete()
        
        response = self.client.post('/api/auth/signup/', {
            'email': 'newlawyer@example.com',
            'username': 'newlawyer',
            'name': 'New Lawyer',
            'password': 'Password123!',
            'password2': 'Password123!',
            'role': 'lawyer'
        }, content_type='application/json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects(email='newlawyer@example.com').first()
        self.assertIsNotNone(user)
        self.assertEqual(user.lawyer_verification_status, 'not_submitted')
        self.assertFalse(user.is_lawyer_verified)
        
        profile = LawyerProfile.objects(user=user).first()
        self.assertIsNotNone(profile)
        self.assertEqual(profile.verification_status, 'not_submitted')
        self.assertEqual(profile.license_number, '')
        self.assertEqual(profile.bar_council_id, '')

    def test_lawyer_onboarding_step_2_patch_success(self):
        profile = LawyerProfile.objects(user=self.lawyer_user).first()
        profile.verification_status = 'not_submitted'
        profile.license_number = ''
        profile.bar_council_id = ''
        profile.save()
        
        self.lawyer_user.lawyer_verification_status = 'not_submitted'
        self.lawyer_user.save()

        tokens = get_tokens_for_user(self.lawyer_user)
        lawyer_auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {tokens["access"]}'}

        response = self.client.patch('/api/lawyer/my-profile/', {
            'license_number': 'LIC-99999',
            'bar_council_id': 'BAR-77777',
            'education': 'Harvard Law School',
            'experience_years': 10,
            'law_firm': 'Prestige Law',
            'specializations': ['Criminal Law', 'Intellectual Property'],
            'consultation_fee': '$250/hr',
            'bio': 'Experienced attorney.',
            'verification_documents': ['http://cloudinary.com/cert.pdf']
        }, content_type='application/json', **lawyer_auth_headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        updated_profile = LawyerProfile.objects(user=self.lawyer_user).first()
        self.assertEqual(updated_profile.verification_status, 'pending')
        self.assertEqual(updated_profile.license_number, 'LIC-99999')
        self.assertEqual(updated_profile.bar_council_id, 'BAR-77777')
        self.assertEqual(updated_profile.education, 'Harvard Law School')
        self.assertEqual(updated_profile.experience_years, 10)
        self.assertEqual(updated_profile.law_firm, 'Prestige Law')
        self.assertEqual(updated_profile.specializations, ['Criminal Law', 'Intellectual Property'])
        self.assertEqual(updated_profile.consultation_fee, '$250/hr')
        self.assertEqual(updated_profile.bio, 'Experienced attorney.')
        self.assertEqual(updated_profile.verification_documents, ['http://cloudinary.com/cert.pdf'])

        updated_user = User.objects(id=self.lawyer_user.id).first()
        self.assertEqual(updated_user.lawyer_verification_status, 'pending')

    @patch('cloudinary.uploader.upload')
    def test_lawyer_upload_verification_doc_success(self, mock_upload):
        mock_upload.return_value = {'secure_url': 'https://cloudinary.com/proof.pdf'}
        
        tokens = get_tokens_for_user(self.lawyer_user)
        lawyer_auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {tokens["access"]}'}

        from django.core.files.uploadedfile import SimpleUploadedFile
        file_data = SimpleUploadedFile('document.pdf', b'fake pdf content', content_type='application/pdf')
        
        response = self.client.post('/api/lawyer/upload-verification-doc/', {
            'file': file_data
        }, **lawyer_auth_headers)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['secure_url'], 'https://cloudinary.com/proof.pdf')
        mock_upload.assert_called_once()

    def test_lawyer_upload_verification_doc_invalid_file_type(self):
        tokens = get_tokens_for_user(self.lawyer_user)
        lawyer_auth_headers = {'HTTP_AUTHORIZATION': f'Bearer {tokens["access"]}'}

        from django.core.files.uploadedfile import SimpleUploadedFile
        file_data = SimpleUploadedFile('malicious.exe', b'fake executable content', content_type='application/octet-stream')
        
        response = self.client.post('/api/lawyer/upload-verification-doc/', {
            'file': file_data
        }, **lawyer_auth_headers)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Invalid file type', response.json()['error'])
