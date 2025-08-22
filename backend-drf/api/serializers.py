from .models import CustomUser
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=CustomUser.objects.all(), message="This email is already registered.")]
    )
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'password']
    def create(self, validated_data):
        # Use Django's built-in create_user to hash the password
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        return user