from django.urls import path
from .views import *


urlpatterns = [
    path('register/', RegisterView.as_view(), name = 'register'),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("login/", LoginView.as_view(), name="login" ),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("csrf/", get_csrf_token, name="csrf" ),

    path('protected/', ProtectedView.as_view(), name = 'secure endpoint' )
]