from django.core.management.base import BaseCommand
from authentication.models import User

class Command(BaseCommand):
    help = 'Promotes a user to admin role and optionally designates as superuser'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to promote')
        parser.add_argument(
            '--superuser',
            action='store_true',
            help='Promote to superuser status as well',
        )

    def handle(self, *args, **options):
        email = options['email'].strip().lower()
        make_superuser = options['superuser']

        try:
            user = User.objects(email=email).first()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error querying database: {e}"))
            return

        if not user:
            self.stdout.write(self.style.ERROR(f"User with email '{email}' not found."))
            return

        user.role = 'admin'
        if make_superuser:
            user.is_superuser = True
            role_desc = 'admin and superuser'
        else:
            role_desc = 'admin'

        user.save()
        self.stdout.write(self.style.SUCCESS(f"Successfully promoted {email} to {role_desc}."))
