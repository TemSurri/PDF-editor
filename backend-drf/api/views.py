from rest_framework.response import Response
from rest_framework import generics, views
from .serializers import *
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse

from .models import CustomUser
from django.http import HttpResponse
import json
from rest_framework.permissions import AllowAny, IsAuthenticated
from .pdf_utils import *

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class ProtectedView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        pdf = request.FILES.get('pdf')
        json_edits = request.data.get('edits')
        edits = json.loads(json_edits) if json_edits else []
        way = int(request.data.get("way"))
        print(way)
        if way == 0:
            merged_pdf = merge_pdf_with_edits(pdf, edits)

            safe_name = sanitize_filename(pdf.name) if pdf and pdf.name else "doc.pdf"

            response = HttpResponse(merged_pdf, content_type="application/pdf")
            response["Content-Disposition"] = f"attachment; filename=edited_{safe_name}"
            return response
        
        else:
            try:
                pdf_file = request.FILES["pdf"]
              
                edits_json = request.POST["edits"]
                pdf_bytes = pdf_file.read()

                output_pdf_bytes = apply_edits_to_pdf(pdf_bytes, edits_json)

                response = HttpResponse(output_pdf_bytes, content_type="application/pdf")
                response["Content-Disposition"] = "inline; filename=output.pdf"
                return response

            except Exception as e:
                return HttpResponse(f"Error: {str(e)}", status=500)

    def get(self, request, *args, **kwargs):
        
        return Response({
            "name" : request.user.username,
            "id" : request.user.id,
            "message": f"Hello {request.user.username}, tokens are valid"
        })

class LogoutView(views.APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        
        refresh_token = request.COOKIES.get("refresh_token")

        response = Response({"message": "Logged Out"}, status=status.HTTP_205_RESET_CONTENT)
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")

        if not refresh_token:
            return response

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError as e:
            if "blacklisted" in str(e).lower():
                pass
            else:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return response
class LoginView(views.APIView):

    def post(self, request):
        serializer = LoginUserSerializer(data = request.data)

        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            response = Response(status = status.HTTP_200_OK)
            response.set_cookie(key="access_token", value=access_token, httponly = True, secure=True,samesite="None")
            response.set_cookie(key="refresh_token", value=str(refresh), httponly = True, secure=True,samesite="None")
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"error": "No refresh token"}, status=400)
        try:
            data = {"refresh": refresh_token}
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            access = serializer.validated_data["access"]

            response = Response(status=status.HTTP_200_OK)
            response.set_cookie("access_token", access, httponly=True, secure=True, samesite="None")
            if "refresh" in serializer.validated_data:
                response.set_cookie("refresh_token", serializer.validated_data["refresh"], httponly=True, secure=True, samesite="None")
            return response
        except (InvalidToken, TokenError):
            response = Response({"error": "Invalid or blacklisted refresh"}, status=401)
            response.delete_cookie("access_token")
            response.delete_cookie("refresh_token")
            return response
        
@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({"detail": "CSRF cookie set"})