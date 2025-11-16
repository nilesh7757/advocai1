from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

@database_sync_to_async
def get_user_from_token(token):
    User = get_user_model()
    try:
        print(f"Backend: Attempting to authenticate token: {token[:30]}...") # Log token start
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        user = User.objects.get(id=user_id)
        print(f"Backend: Token authenticated successfully for user: {user.username}") # Log success
        return user
    except Exception as e:
        print(f"Backend: Token authentication failed: {e}") # Log failure reason
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    Custom middleware that takes a token from the query string and authenticates it.
    """

    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        print("Backend: TokenAuthMiddleware called.") # Log middleware entry
        query_string = parse_qs(scope['query_string'].decode('utf8'))
        token = query_string.get('token', [None])[0]

        if token:
            print(f"Backend: Token found in query string.") # Log token presence
            scope['user'] = await get_user_from_token(token)
        else:
            print("Backend: No token found in query string.") # Log no token
            scope['user'] = AnonymousUser()
        
        print(f"Backend: User in scope after TokenAuthMiddleware: {scope['user']}") # Log user in scope

        return await self.inner(scope, receive, send)


