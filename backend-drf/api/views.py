from rest_framework.response import Response
from rest_framework import generics
from .serializers import RegisterSerializer

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
    


