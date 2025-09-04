# Overview

This is a Workmen Management System built with Flask that allows users to register, view, edit, and search for workmen/workers. The application provides a simple interface for managing a database of skilled workers, tracking their trades/skills, contact information, and work status. It's designed for small to medium-sized organizations that need to maintain records of available workers and their specializations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Template Engine**: Jinja2 templating with Flask
- **UI Framework**: Bootstrap 5 with dark theme support and Font Awesome icons
- **Responsive Design**: Mobile-first responsive layout using Bootstrap grid system
- **Static Assets**: CSS customizations stored in `/static/style.css`

## Backend Architecture
- **Web Framework**: Flask with Python
- **Application Structure**: Modular design with separate files for routes (`routes.py`) and main application (`app.py`)
- **Session Management**: Flask sessions with configurable secret key from environment variables
- **Routing**: RESTful route structure for CRUD operations on workmen records

## Data Storage
- **Database**: Replit Database (key-value store)
- **Data Model**: Simple workman records with fields for name, trade/skill, contact information, and status
- **ID Generation**: Sequential integer IDs generated automatically
- **Search Functionality**: In-memory filtering by workman name

## Key Features
- **Workman Registration**: Form-based registration with validation
- **Search and Filter**: Real-time search functionality by workman name
- **Detail Views**: Individual workman profile pages
- **Edit Capabilities**: Update workman information
- **Status Tracking**: Visual status indicators with color coding
- **Responsive UI**: Mobile-friendly interface with Bootstrap components

## Error Handling and Logging
- **Flash Messages**: User feedback system for form validation and operations
- **Debug Logging**: Comprehensive logging configuration for development
- **Form Validation**: Server-side validation with user-friendly error messages

# External Dependencies

## Frontend Dependencies
- **Bootstrap CSS**: CDN-hosted Bootstrap 5 with dark theme (`bootstrap-agent-dark-theme.min.css`)
- **Font Awesome**: Icon library for UI enhancement (`font-awesome/6.0.0`)

## Backend Dependencies
- **Flask**: Core web framework
- **Replit Database**: Built-in key-value database service for data persistence
- **Python Standard Library**: Logging, OS environment variable handling

## Development Environment
- **Replit Platform**: Cloud-based development and hosting environment
- **Environment Variables**: Configuration through Replit secrets/environment variables
- **Debug Mode**: Development server with auto-reload functionality