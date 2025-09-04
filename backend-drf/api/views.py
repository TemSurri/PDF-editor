from rest_framework.response import Response
from rest_framework import generics
from .serializers import RegisterSerializer
from rest_framework import status
from .models import CustomUser
from rest_framework.permissions import AllowAny, IsAuthenticated

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ProtectedView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        
        return Response({
            "message": f"Hello {request.user.username}, your token is valid ✅"
        })
# Create your views here.
