# Add basic auth to dashboard (for production deployment)

from functools import wraps
from flask import request, Response
import os

def check_auth(username, password):
    """Check if username/password is valid."""
    # Use environment variables for security
    DASHBOARD_USER = os.environ.get('DASHBOARD_USER', 'admin')
    DASHBOARD_PASS = os.environ.get('DASHBOARD_PASS', 'changeme123')
    return username == DASHBOARD_USER and password == DASHBOARD_PASS

def authenticate():
    """Send 401 response that enables basic auth."""
    return Response(
        'Authentication required', 401,
        {'WWW-Authenticate': 'Basic realm="Honeypot Dashboard"'}
    )

def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        if not auth or not check_auth(auth.username, auth.password):
            return authenticate()
        return f(*args, **kwargs)
    return decorated

# Then add @requires_auth to your routes:
# @app.route('/')
# @requires_auth
# def index():
#     ...
