from flask import render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app import app, db
from models import Workman, TimeEntry, User, UserRole
from auth import require_manage_workmen, require_clock_workmen
from forms import AdminUserForm
from datetime import datetime
import logging

# TRN (Tax Registration Number) is now provided by user during registration

def get_all_workmen():
    """Get all workmen from the database"""
    workmen = db.session.query(Workman).order_by(Workman.name).all()
    return workmen

@app.route('/')
def index():
    """Landing page or dashboard based on authentication"""
    if not current_user.is_authenticated:
        return render_template('landing.html')
    else:
        return redirect(url_for('dashboard'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Dashboard showing all workmen for authenticated users"""
    search_query = request.args.get('search', '').strip()
    
    # Filter workmen based on search query
    if search_query:
        workmen = db.session.query(Workman).filter(Workman.name.ilike(f'%{search_query}%')).order_by(Workman.name).all()
    else:
        workmen = get_all_workmen()
    
    return render_template('index.html', workmen=workmen, search_query=search_query)

@app.route('/register', methods=['GET', 'POST'])
@require_manage_workmen
def register_workman():
    """Register a new workman"""
    if request.method == 'POST':
        trn = request.form.get('trn', '').strip()
        name = request.form.get('name', '').strip()
        company = request.form.get('company', '').strip()
        location = request.form.get('location', '').strip()
        
        # Validation
        if not trn:
            flash('TRN is required', 'error')
            return render_template('register.html')
        
        # Check if TRN already exists
        existing_workman = db.session.query(Workman).filter_by(trn=trn).first()
        if existing_workman:
            flash('TRN already exists. Please use a unique TRN.', 'error')
            return render_template('register.html')
        
        if not name:
            flash('Name is required', 'error')
            return render_template('register.html')
        
        if not company:
            flash('Company is required', 'error')
            return render_template('register.html')
        
        if not location:
            flash('Location is required', 'error')
            return render_template('register.html')
        
        # Register the workman with the provided TRN
        new_workman = Workman(
            trn=trn,
            name=name,
            company=company,
            location=location
        )
        
        db.session.add(new_workman)
        db.session.commit()
        
        flash(f'Workman {name} registered successfully with TRN {trn}', 'success')
        logging.info(f"Workman {name} registered with TRN {trn}")
        return redirect(url_for('index'))
    
    return render_template('register.html')

@app.route('/workman/<string:workman_trn>')
@login_required
def workman_detail(workman_trn):
    """View workman details"""
    workman = db.session.query(Workman).filter_by(trn=workman_trn).first()
    if not workman:
        flash('Workman not found', 'error')
        return redirect(url_for('index'))
    
    return render_template('workman_detail.html', workman=workman)

@app.route('/workman/<string:workman_trn>/edit', methods=['GET', 'POST'])
@require_manage_workmen
def edit_workman(workman_trn):
    """Edit workman details"""
    workman = db.session.query(Workman).filter_by(trn=workman_trn).first()
    if not workman:
        flash('Workman not found', 'error')
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        company = request.form.get('company', '').strip()
        location = request.form.get('location', '').strip()
        
        # Validation
        if not name:
            flash('Name is required', 'error')
            return render_template('edit_workman.html', workman=workman)
        
        if not company:
            flash('Company is required', 'error')
            return render_template('edit_workman.html', workman=workman)
        
        if not location:
            flash('Location is required', 'error')
            return render_template('edit_workman.html', workman=workman)
        
        # Update the workman
        workman.name = name
        workman.company = company
        workman.location = location
        workman.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        flash(f'Workman {name} updated successfully', 'success')
        logging.info(f"Workman {workman_trn} updated")
        return redirect(url_for('workman_detail', workman_trn=workman_trn))
    
    return render_template('edit_workman.html', workman=workman)

@app.route('/workman/<string:workman_trn>/clock_in', methods=['POST'])
@require_clock_workmen
def clock_in(workman_trn):
    """Clock in a workman"""
    workman = db.session.query(Workman).filter_by(trn=workman_trn).first()
    if not workman:
        flash('Workman not found', 'error')
        return redirect(url_for('index'))
    
    # Check if already clocked in
    existing_entry = db.session.query(TimeEntry).filter_by(workman_trn=workman_trn, clock_out=None).first()
    if existing_entry:
        flash(f'{workman.name} is already clocked in', 'warning')
        return redirect(url_for('workman_detail', workman_trn=workman_trn))
    
    # Create new time entry
    time_entry = TimeEntry(
        workman_trn=workman_trn,
        clock_in=datetime.utcnow()
    )
    
    db.session.add(time_entry)
    db.session.commit()
    
    flash(f'{workman.name} clocked in successfully', 'success')
    logging.info(f"Workman {workman_trn} clocked in at {time_entry.clock_in}")
    return redirect(url_for('workman_detail', workman_trn=workman_trn))

@app.route('/workman/<string:workman_trn>/clock_out', methods=['POST'])
@require_clock_workmen
def clock_out(workman_trn):
    """Clock out a workman"""
    workman = db.session.query(Workman).filter_by(trn=workman_trn).first()
    if not workman:
        flash('Workman not found', 'error')
        return redirect(url_for('index'))
    
    # Find the active time entry (not clocked out)
    active_entry = db.session.query(TimeEntry).filter_by(workman_trn=workman_trn, clock_out=None).first()
    if not active_entry:
        flash('Cannot clock out without clocking in first', 'error')
        return redirect(url_for('workman_detail', workman_trn=workman_trn))
    
    # Update clock out time
    active_entry.clock_out = datetime.utcnow()
    db.session.commit()
    
    flash(f'{workman.name} clocked out successfully', 'success')
    logging.info(f"Workman {workman_trn} clocked out at {active_entry.clock_out}")
    return redirect(url_for('workman_detail', workman_trn=workman_trn))

@app.route('/locations')
@login_required
def locations():
    """View workmen grouped by location"""
    workmen = get_all_workmen()
    
    # Group workmen by location
    locations_dict = {}
    for workman in workmen:
        location = workman.location
        if location not in locations_dict:
            locations_dict[location] = []
        locations_dict[location].append(workman)
    
    # Sort locations alphabetically (workmen are already sorted by name)
    sorted_locations = dict(sorted(locations_dict.items()))
    
    return render_template('locations.html', locations=sorted_locations)

@app.route('/workman/<string:workman_trn>/time_history')
@login_required
def workman_time_history(workman_trn):
    """View time tracking history for a specific workman"""
    workman = db.session.query(Workman).filter_by(trn=workman_trn).first()
    if not workman:
        flash('Workman not found', 'error')
        return redirect(url_for('index'))
    
    # Get time entries for this workman
    time_entries = db.session.query(TimeEntry).filter_by(workman_trn=workman_trn).order_by(TimeEntry.clock_in.desc()).all()
    
    # Calculate total hours
    total_hours = sum([entry.get_duration_hours() or 0 for entry in time_entries])
    completed_sessions = len([entry for entry in time_entries if entry.clock_out])
    
    return render_template('workman_time_history.html',
                         workman=workman,
                         time_entries=time_entries,
                         total_hours=round(total_hours, 2),
                         completed_sessions=completed_sessions)

@app.route('/workman/<string:workman_trn>/delete', methods=['POST'])
@require_manage_workmen
def delete_workman(workman_trn):
    """Delete a workman"""
    workman = db.session.query(Workman).filter_by(trn=workman_trn).first()
    if not workman:
        flash('Workman not found', 'error')
        return redirect(url_for('index'))
    
    workman_name = workman.name
    db.session.delete(workman)  # This will cascade delete time entries
    db.session.commit()
    
    flash(f'Workman {workman_name} deleted successfully', 'success')
    logging.info(f"Workman {workman_trn} deleted")
    return redirect(url_for('index'))

@app.route('/reports')
@login_required
def reports():
    """Time tracking reports"""
    from sqlalchemy import func
    from datetime import datetime, timedelta
    
    # Get date filters from request
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    workman_filter = request.args.get('workman')
    
    # Build query
    query = db.session.query(TimeEntry).join(Workman)
    
    # Apply filters
    if start_date:
        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(TimeEntry.clock_in >= start_dt)
        except ValueError:
            flash('Invalid start date format', 'error')
            start_date = None
    
    if end_date:
        try:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d')
            # Add one day to include the entire end date
            end_dt = end_dt + timedelta(days=1)
            query = query.filter(TimeEntry.clock_in < end_dt)
        except ValueError:
            flash('Invalid end date format', 'error')
            end_date = None
    
    if workman_filter:
        query = query.filter(Workman.trn == workman_filter)
    
    # Get time entries
    time_entries = query.order_by(TimeEntry.clock_in.desc()).all()
    
    # Calculate statistics
    total_hours = sum([entry.get_duration_hours() or 0 for entry in time_entries])
    completed_sessions = len([entry for entry in time_entries if entry.clock_out])
    active_sessions = len([entry for entry in time_entries if not entry.clock_out])
    
    # Group by workman for summary
    workman_stats = {}
    for entry in time_entries:
        trn = entry.workman_trn
        if trn not in workman_stats:
            workman_stats[trn] = {
                'workman': entry.workman,
                'total_hours': 0,
                'sessions': 0,
                'completed_sessions': 0
            }
        workman_stats[trn]['sessions'] += 1
        if entry.clock_out:
            workman_stats[trn]['completed_sessions'] += 1
            workman_stats[trn]['total_hours'] += entry.get_duration_hours() or 0
    
    # Get all workmen for filter dropdown
    all_workmen = db.session.query(Workman).order_by(Workman.name).all()
    
    return render_template('reports.html', 
                         time_entries=time_entries,
                         total_hours=round(total_hours, 2),
                         completed_sessions=completed_sessions,
                         active_sessions=active_sessions,
                         workman_stats=workman_stats,
                         all_workmen=all_workmen,
                         start_date=start_date,
                         end_date=end_date,
                         workman_filter=workman_filter)

# Admin routes
@app.route('/admin/users')
@login_required
def admin_users():
    """Admin page to manage users"""
    if not current_user.has_role('admin'):
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    users = db.session.query(User).order_by(User.username).all()
    return render_template('admin/users.html', users=users)

@app.route('/admin/users/<int:user_id>/edit', methods=['GET', 'POST'])
@login_required
def admin_edit_user(user_id):
    """Edit user details (admin only)"""
    if not current_user.has_role('admin'):
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    user = db.session.query(User).get(user_id)
    if not user:
        flash('User not found', 'error')
        return redirect(url_for('admin_users'))
    
    form = AdminUserForm(obj=user)
    if form.validate_on_submit():
        user.username = form.username.data
        user.email = form.email.data
        user.role = UserRole(form.role.data)
        user.is_active = form.active.data
        
        if form.password.data:
            user.set_password(form.password.data)
        
        try:
            db.session.commit()
            flash(f'User {user.username} updated successfully', 'success')
            return redirect(url_for('admin_users'))
        except Exception as e:
            db.session.rollback()
            flash('Failed to update user', 'error')
            logging.error(f"Error updating user {user_id}: {e}")
    
    return render_template('admin/edit_user.html', form=form, user=user)

@app.route('/admin/users/<int:user_id>/delete', methods=['POST'])
@login_required
def admin_delete_user(user_id):
    """Delete user (admin only)"""
    if not current_user.has_role('admin'):
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    if current_user.id == user_id:
        flash('You cannot delete your own account', 'error')
        return redirect(url_for('admin_users'))
    
    user = db.session.query(User).get(user_id)
    if not user:
        flash('User not found', 'error')
        return redirect(url_for('admin_users'))
    
    username = user.username
    db.session.delete(user)
    db.session.commit()
    
    flash(f'User {username} deleted successfully', 'success')
    logging.info(f"Admin {current_user.username} deleted user {username}")
    return redirect(url_for('admin_users'))

@app.route('/admin/users/<int:user_id>/generate-token', methods=['POST'])
@login_required
def admin_generate_token(user_id):
    """Generate API token for user (admin only)"""
    if not current_user.has_role('admin'):
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    user = db.session.query(User).get(user_id)
    if not user:
        flash('User not found', 'error')
        return redirect(url_for('admin_users'))
    
    token = user.generate_api_token()
    db.session.commit()
    
    flash(f'API token generated for {user.username}: {token}', 'success')
    logging.info(f"Admin {current_user.username} generated API token for user {user.username}")
    return redirect(url_for('admin_edit_user', user_id=user_id))

@app.route('/admin/users/<int:user_id>/revoke-token', methods=['POST'])
@login_required
def admin_revoke_token(user_id):
    """Revoke API token for user (admin only)"""
    if not current_user.has_role('admin'):
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
    
    user = db.session.query(User).get(user_id)
    if not user:
        flash('User not found', 'error')
        return redirect(url_for('admin_users'))
    
    if not user.api_token:
        flash(f'{user.username} does not have an active API token', 'warning')
        return redirect(url_for('admin_edit_user', user_id=user_id))
    
    user.revoke_api_token()
    db.session.commit()
    
    flash(f'API token revoked for {user.username}', 'success')
    logging.info(f"Admin {current_user.username} revoked API token for user {user.username}")
    return redirect(url_for('admin_edit_user', user_id=user_id))
