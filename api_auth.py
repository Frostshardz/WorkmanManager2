from functools import wraps
from flask import request, jsonify, g
from models import User
import logging


def extract_bearer_token():
    """Extract bearer token from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    if not auth_header.startswith('Bearer '):
        return None
    
    return auth_header[7:]  # Remove 'Bearer ' prefix


def require_api_token(f):
    """Decorator to require valid API token for route access"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = extract_bearer_token()
        
        if not token:
            return jsonify({
                'error': 'Missing or invalid Authorization header',
                'message': 'Please provide a valid Bearer token'
            }), 401
        
        user = User.find_by_token(token)
        if not user:
            return jsonify({
                'error': 'Invalid token',
                'message': 'The provided token is invalid or expired'
            }), 401
        
        # Set the current user for the request
        g.current_user = user
        return f(*args, **kwargs)
    
    return decorated_function


def require_api_role(required_roles):
    """Decorator to require specific roles for API access"""
    if isinstance(required_roles, str):
        required_roles = [required_roles]
    
    def decorator(f):
        @wraps(f)
        @require_api_token
        def decorated_function(*args, **kwargs):
            user = g.current_user
            
            if user.role.value not in required_roles:
                return jsonify({
                    'error': 'Insufficient permissions',
                    'message': f'This operation requires one of: {", ".join(required_roles)}'
                }), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def require_api_manage_workmen(f):
    """Decorator to require workmen management permissions for API"""
    @wraps(f)
    @require_api_token
    def decorated_function(*args, **kwargs):
        user = g.current_user
        
        if not user.can_manage_workmen():
            return jsonify({
                'error': 'Insufficient permissions',
                'message': 'This operation requires supervisor or admin privileges'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function


def require_api_clock_workmen(f):
    """Decorator to require clock permissions for API"""
    @wraps(f)
    @require_api_token
    def decorated_function(*args, **kwargs):
        user = g.current_user
        
        if not user.can_clock_workmen():
            return jsonify({
                'error': 'Insufficient permissions',
                'message': 'This operation requires employee, supervisor or admin privileges'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function