from .models import CustomUser
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import authenticate

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length =8)
    username = serializers.CharField(
        min_length =5,
        max_length=30,
        validators=[UniqueValidator(queryset=CustomUser.objects.all(), message="This username is already taken.")]
            )
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=CustomUser.objects.all(), message="This email is already registered.")]
    )
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password']
    def create(self, validated_data):
        # using Django's built-in create_user functin to hash the password
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )

        return user
    
class LoginUserSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only = True)

    def validate(self, data):
        user = authenticate(**data)
        if user and user.is_active:
            return {"user":user}
        raise serializers.ValidationError("Incorrect Credentials")