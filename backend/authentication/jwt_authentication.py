from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.settings import api_settings
from authentication.models import User
from mongoengine import DoesNotExist
from bson import ObjectId

class MongoEngineJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        """
        Attempts to find and return a user using the given validated token.
        Rejects the token if its token_version doesn't match the user's current version.
        """
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            return None

        try:
            user = User.objects(id=user_id).first()
            if not user:
                return None

            token_version = validated_token.get("token_version", 0)
            if token_version != getattr(user, "token_version", 0):
                return None

            return user
        except DoesNotExist:
            return None
        except Exception as e:
            print(f"Error retrieving user with ID {user_id}: {e}")
            return None
        return None
