"""
WSGI config for pdfEditor project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import socket
import os 

try:
    s = socket.create_connection(("aws-1-us-east-2.pooler.supabase.com", 5432), timeout=5)
    print("✅ Supabase is reachable")
    s.close()
except Exception as e:
    print("❌ Supabase unreachable:", e)


from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pdfEditor.settings')

application = get_wsgi_application()
