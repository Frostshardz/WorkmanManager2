from app import db
from datetime import datetime
from sqlalchemy import String, DateTime, Text, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import enum
import secrets
import string


class UserRole(enum.Enum):
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    EMPLOYEE = "employee"


class User(UserMixin, db.Model):
    """Model for user authentication and authorization"""
    __tablename__ = 'users'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    api_token: Mapped[str] = mapped_column(String(64), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        """Set password hash"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check password against hash"""
        return check_password_hash(self.password_hash, password)
    
    def has_role(self, role):
        """Check if user has specific role"""
        if isinstance(role, str):
            role = UserRole(role)
        return self.role == role
    
    def can_manage_workmen(self):
        """Check if user can add/edit workmen"""
        return self.role in [UserRole.ADMIN, UserRole.SUPERVISOR]
    
    def can_clock_workmen(self):
        """Check if user can clock workmen in/out"""
        return self.role in [UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.EMPLOYEE]
    
    def generate_api_token(self):
        """Generate a new API token for the user"""
        self.api_token = secrets.token_urlsafe(32)
        return self.api_token
    
    def revoke_api_token(self):
        """Revoke the user's API token"""
        self.api_token = None
    
    @staticmethod
    def find_by_token(token):
        """Find user by API token"""
        from app import db
        return db.session.query(User).filter_by(api_token=token, is_active=True).first()
    
    
    def __repr__(self):
        return f'<User {self.username}: {self.role.value}>'


class Workman(db.Model):
    """Model for storing workman information"""
    __tablename__ = 'workmen'
    
    trn: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    company: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to time entries
    time_entries: Mapped[List["TimeEntry"]] = relationship("TimeEntry", back_populates="workman", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<Workman {self.trn}: {self.name}>'
    
    def get_current_status(self):
        """Get current clock status of the workman"""
        latest_entry = db.session.query(TimeEntry).filter_by(workman_trn=self.trn).order_by(TimeEntry.clock_in.desc()).first()
        if latest_entry and not latest_entry.clock_out:
            return 'clocked_in'
        return 'clocked_out'
    
    def get_latest_clock_in(self):
        """Get the latest clock in time"""
        latest_entry = db.session.query(TimeEntry).filter_by(workman_trn=self.trn).order_by(TimeEntry.clock_in.desc()).first()
        if latest_entry and not latest_entry.clock_out:
            return latest_entry.clock_in
        return None
    
    def get_latest_clock_out(self):
        """Get the latest clock out time"""
        latest_entry = db.session.query(TimeEntry).filter_by(workman_trn=self.trn).filter(TimeEntry.clock_out.isnot(None)).order_by(TimeEntry.clock_out.desc()).first()
        if latest_entry:
            return latest_entry.clock_out
        return None


class TimeEntry(db.Model):
    """Model for storing time tracking entries"""
    __tablename__ = 'time_entries'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    workman_trn: Mapped[str] = mapped_column(String(50), db.ForeignKey('workmen.trn'), nullable=False)
    clock_in: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    clock_out: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationship to workman
    workman: Mapped["Workman"] = relationship("Workman", back_populates="time_entries")
    
    def __repr__(self):
        return f'<TimeEntry {self.workman_trn}: {self.clock_in} - {self.clock_out}>'
    
    def get_duration_hours(self):
        """Calculate duration in hours if clocked out"""
        if self.clock_out:
            duration = self.clock_out - self.clock_in
            return round(duration.total_seconds() / 3600, 2)
        return None
    
    def get_duration_formatted(self):
        """Get formatted duration string"""
        if self.clock_out:
            duration = self.clock_out - self.clock_in
            hours = int(duration.total_seconds() // 3600)
            minutes = int((duration.total_seconds() % 3600) // 60)
            return f"{hours}h {minutes}m"
        return "In Progress"