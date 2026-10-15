"""
vault24/wsgi.py
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vault24.settings")
application = get_wsgi_application()
