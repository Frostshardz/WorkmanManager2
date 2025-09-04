from flask import Blueprint, request, jsonify, g
from app import app, db
from models import User, Workman, TimeEntry, UserRole
from api_auth import require_api_token, require_api_role, require_api_manage_workmen, require_api_clock_workmen
from datetime import datetime
import logging

# Create API blueprint
api_bp = Blueprint('api', __name__, url_prefix='/api/v1')


# Authentication endpoints
@api_bp.route('/auth/token', methods=['POST'])
def generate_token():
    """Generate API token for user"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 401
    
    # Generate new token
    token = user.generate_api_token()
    db.session.commit()
    
    logging.info(f"API token generated for user {username}")
    
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role.value
        }
    })


@api_bp.route('/auth/revoke', methods=['POST'])
@require_api_token
def revoke_token():
    """Revoke current API token"""
    user = g.current_user
    user.revoke_api_token()
    db.session.commit()
    
    logging.info(f"API token revoked for user {user.username}")
    
    return jsonify({'message': 'Token revoked successfully'})


# User information
@api_bp.route('/me', methods=['GET'])
@require_api_token
def get_current_user():
    """Get current user information"""
    user = g.current_user
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role.value,
        'permissions': {
            'can_manage_workmen': user.can_manage_workmen(),
            'can_clock_workmen': user.can_clock_workmen()
        }
    })


# Workmen management endpoints
@api_bp.route('/workmen', methods=['GET'])
@require_api_token
def list_workmen():
    """List all workmen"""
    search = request.args.get('search', '')
    
    query = Workman.query
    if search:
        query = query.filter(Workman.name.ilike(f'%{search}%'))
    
    workmen = query.order_by(Workman.name).all()
    
    return jsonify({
        'workmen': [{
            'trn': w.trn,
            'name': w.name,
            'company': w.company,
            'location': w.location,
            'status': w.get_current_status(),
            'created_at': w.created_at.isoformat(),
            'updated_at': w.updated_at.isoformat()
        } for w in workmen]
    })


@api_bp.route('/workmen', methods=['POST'])
@require_api_manage_workmen
def create_workman():
    """Create a new workman"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    required_fields = ['trn', 'name', 'company', 'location']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if TRN already exists
    existing = Workman.query.filter_by(trn=data['trn']).first()
    if existing:
        return jsonify({'error': 'TRN already exists'}), 400
    
    workman = Workman(
        trn=data['trn'],
        name=data['name'],
        company=data['company'],
        location=data['location']
    )
    
    db.session.add(workman)
    db.session.commit()
    
    logging.info(f"Workman {workman.name} created via API by {g.current_user.username}")
    
    return jsonify({
        'message': 'Workman created successfully',
        'workman': {
            'trn': workman.trn,
            'name': workman.name,
            'company': workman.company,
            'location': workman.location,
            'status': workman.get_current_status(),
            'created_at': workman.created_at.isoformat()
        }
    }), 201


@api_bp.route('/workmen/<string:trn>', methods=['GET'])
@require_api_token
def get_workman(trn):
    """Get specific workman details"""
    workman = Workman.query.filter_by(trn=trn).first()
    if not workman:
        return jsonify({'error': 'Workman not found'}), 404
    
    return jsonify({
        'trn': workman.trn,
        'name': workman.name,
        'company': workman.company,
        'location': workman.location,
        'status': workman.get_current_status(),
        'latest_clock_in': workman.get_latest_clock_in().isoformat() if workman.get_latest_clock_in() else None,
        'latest_clock_out': workman.get_latest_clock_out().isoformat() if workman.get_latest_clock_out() else None,
        'created_at': workman.created_at.isoformat(),
        'updated_at': workman.updated_at.isoformat()
    })


@api_bp.route('/workmen/<string:trn>', methods=['PUT'])
@require_api_manage_workmen
def update_workman(trn):
    """Update workman details"""
    workman = Workman.query.filter_by(trn=trn).first()
    if not workman:
        return jsonify({'error': 'Workman not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    # Update fields if provided
    if 'name' in data:
        workman.name = data['name']
    if 'company' in data:
        workman.company = data['company']
    if 'location' in data:
        workman.location = data['location']
    
    workman.updated_at = datetime.utcnow()
    db.session.commit()
    
    logging.info(f"Workman {workman.trn} updated via API by {g.current_user.username}")
    
    return jsonify({
        'message': 'Workman updated successfully',
        'workman': {
            'trn': workman.trn,
            'name': workman.name,
            'company': workman.company,
            'location': workman.location,
            'status': workman.get_current_status(),
            'updated_at': workman.updated_at.isoformat()
        }
    })


@api_bp.route('/workmen/<string:trn>', methods=['DELETE'])
@require_api_manage_workmen
def delete_workman(trn):
    """Delete workman"""
    workman = Workman.query.filter_by(trn=trn).first()
    if not workman:
        return jsonify({'error': 'Workman not found'}), 404
    
    name = workman.name
    db.session.delete(workman)
    db.session.commit()
    
    logging.info(f"Workman {trn} ({name}) deleted via API by {g.current_user.username}")
    
    return jsonify({'message': f'Workman {name} deleted successfully'})


# Time tracking endpoints
@api_bp.route('/workmen/<string:trn>/clock-in', methods=['POST'])
@require_api_clock_workmen
def clock_in_workman(trn):
    """Clock in a workman"""
    workman = Workman.query.filter_by(trn=trn).first()
    if not workman:
        return jsonify({'error': 'Workman not found'}), 404
    
    # Check if already clocked in
    existing_entry = TimeEntry.query.filter_by(workman_trn=trn, clock_out=None).first()
    if existing_entry:
        return jsonify({'error': f'{workman.name} is already clocked in'}), 400
    
    # Create new time entry
    time_entry = TimeEntry(
        workman_trn=trn,
        clock_in=datetime.utcnow()
    )
    
    data = request.get_json()
    if data and 'notes' in data:
        time_entry.notes = data['notes']
    
    db.session.add(time_entry)
    db.session.commit()
    
    logging.info(f"Workman {trn} clocked in via API by {g.current_user.username}")
    
    return jsonify({
        'message': f'{workman.name} clocked in successfully',
        'time_entry': {
            'id': time_entry.id,
            'clock_in': time_entry.clock_in.isoformat(),
            'notes': time_entry.notes
        }
    })


@api_bp.route('/workmen/<string:trn>/clock-out', methods=['POST'])
@require_api_clock_workmen
def clock_out_workman(trn):
    """Clock out a workman"""
    workman = Workman.query.filter_by(trn=trn).first()
    if not workman:
        return jsonify({'error': 'Workman not found'}), 404
    
    # Find active time entry
    active_entry = TimeEntry.query.filter_by(workman_trn=trn, clock_out=None).first()
    if not active_entry:
        return jsonify({'error': 'Cannot clock out without clocking in first'}), 400
    
    # Update clock out time
    active_entry.clock_out = datetime.utcnow()
    
    data = request.get_json()
    if data and 'notes' in data:
        if active_entry.notes:
            active_entry.notes += f" | {data['notes']}"
        else:
            active_entry.notes = data['notes']
    
    db.session.commit()
    
    logging.info(f"Workman {trn} clocked out via API by {g.current_user.username}")
    
    return jsonify({
        'message': f'{workman.name} clocked out successfully',
        'time_entry': {
            'id': active_entry.id,
            'clock_in': active_entry.clock_in.isoformat(),
            'clock_out': active_entry.clock_out.isoformat(),
            'duration_hours': active_entry.get_duration_hours(),
            'duration_formatted': active_entry.get_duration_formatted(),
            'notes': active_entry.notes
        }
    })


@api_bp.route('/workmen/<string:trn>/time-entries', methods=['GET'])
@require_api_token
def get_workman_time_entries(trn):
    """Get time entries for a workman"""
    workman = Workman.query.filter_by(trn=trn).first()
    if not workman:
        return jsonify({'error': 'Workman not found'}), 404
    
    entries = TimeEntry.query.filter_by(workman_trn=trn).order_by(TimeEntry.clock_in.desc()).all()
    
    return jsonify({
        'workman': {
            'trn': workman.trn,
            'name': workman.name
        },
        'time_entries': [{
            'id': entry.id,
            'clock_in': entry.clock_in.isoformat(),
            'clock_out': entry.clock_out.isoformat() if entry.clock_out else None,
            'duration_hours': entry.get_duration_hours(),
            'duration_formatted': entry.get_duration_formatted(),
            'notes': entry.notes
        } for entry in entries],
        'total_completed_hours': sum([entry.get_duration_hours() or 0 for entry in entries]),
        'completed_sessions': len([entry for entry in entries if entry.clock_out])
    })


# Admin endpoints
@api_bp.route('/admin/users', methods=['GET'])
@require_api_role('admin')
def list_users():
    """List all users (admin only)"""
    users = User.query.order_by(User.username).all()
    
    return jsonify({
        'users': [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role.value,
            'is_active': user.is_active,
            'has_token': bool(user.api_token),
            'created_at': user.created_at.isoformat()
        } for user in users]
    })


# Blueprint will be registered in app.py