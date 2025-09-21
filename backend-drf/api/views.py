from rest_framework.response import Response
from rest_framework import generics
from .serializers import RegisterSerializer
from rest_framework import status
from .models import CustomUser
from django.http import HttpResponse
import json
from rest_framework.permissions import AllowAny, IsAuthenticated
from .pdf_utils import merge_pdf_with_edits

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

        merged_pdf = merge_pdf_with_edits(pdf, edits)

        response = HttpResponse(merged_pdf, content_type="application/pdf")
        response["Content-Disposition"] = f"attachment; filename=edited_{pdf.name}"
        return response


    def get(self, request, *args, **kwargs):
        
        return Response({
            "name" : request.user.username,
            "id" : request.user.id,
            "message": f"Hello {request.user.username}, tokens are valid"
        })
    


