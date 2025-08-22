from django.shortcuts import render
from rest_framework import generics
from .serializers import RegisterSerializer
from .models import CustomUser
from rest_framework.permissions import AllowAny

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

# Create your views here.
