from flask import Blueprint, request, jsonify
from models import db, User
from config import Config
import bcrypt
import jwt
import datetime
from functools import wraps
import os

auth_bp = Blueprint('auth', __name__)


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
        if not token:
            return jsonify({'error': 'Authentication token is missing'}), 401
        try:
            data = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            current_user = User.query.get(data['email'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated


def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'error': 'Access denied'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator


@auth_bp.route('/api/register', methods=['POST'])
def register():
    try:
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        name = request.form.get('name', '').strip()
        role = request.form.get('role', '').strip()

        if not all([email, password, name, role]):
            return jsonify({'error': 'All fields are required'}), 400
        if role not in ['student', 'coordinator', 'professor']:
            return jsonify({'error': 'Invalid role'}), 400
        if User.query.get(email):
            return jsonify({'error': 'Email already registered'}), 409

        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(email=email, password_hash=password_hash, name=name, role=role)

        if role in ['student', 'coordinator']:
            cpi = request.form.get('cpi')
            if cpi:
                user.cpi = float(cpi)
            if 'resume' in request.files:
                resume = request.files['resume']
                if resume.filename:
                    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'resumes'), exist_ok=True)
                    filename = f"{email.replace('@', '_').replace('.', '_')}_{resume.filename}"
                    filepath = os.path.join(Config.UPLOAD_FOLDER, 'resumes', filename)
                    resume.save(filepath)
                    user.resume_path = f"resumes/{filename}"

        if role == 'coordinator':
            user.club_name = request.form.get('club_name', '').strip()

        # Professor research interests
        if role == 'professor':
            ri = request.form.get('research_interests', '').strip()
            if ri:
                user.research_interests = ri

        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'Registration successful'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.query.get(email)
        if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Invalid email or password'}), 401

        token = jwt.encode({
            'email': user.email,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=Config.JWT_EXPIRATION_HOURS)
        }, Config.JWT_SECRET, algorithm='HS256')

        return jsonify({
            'token': token,
            'user': {
                'email': user.email, 'name': user.name, 'role': user.role,
                'cpi': user.cpi, 'club_name': user.club_name,
                'research_interests': user.research_interests
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/api/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({
        'email': current_user.email, 'name': current_user.name,
        'role': current_user.role, 'cpi': current_user.cpi,
        'club_name': current_user.club_name,
        'research_interests': current_user.research_interests,
        'resume_path': current_user.resume_path,
        'created_at': current_user.created_at.isoformat() if current_user.created_at else None
    }), 200


# NEW: Profile update endpoint
@auth_bp.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        # Handle both JSON and form data (form data needed for file uploads)
        if request.content_type and 'multipart/form-data' in request.content_type:
            name = request.form.get('name', '').strip()
            if name:
                current_user.name = name

            if current_user.role in ['student', 'coordinator']:
                cpi = request.form.get('cpi')
                if cpi:
                    current_user.cpi = float(cpi)
                if 'resume' in request.files:
                    resume = request.files['resume']
                    if resume.filename:
                        os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'resumes'), exist_ok=True)
                        filename = f"{current_user.email.replace('@', '_').replace('.', '_')}_{resume.filename}"
                        filepath = os.path.join(Config.UPLOAD_FOLDER, 'resumes', filename)
                        resume.save(filepath)
                        current_user.resume_path = f"resumes/{filename}"

            if current_user.role == 'coordinator':
                club = request.form.get('club_name', '').strip()
                if club:
                    current_user.club_name = club

            if current_user.role == 'professor':
                ri = request.form.get('research_interests', '').strip()
                current_user.research_interests = ri
        else:
            data = request.get_json()
            if data.get('name'):
                current_user.name = data['name'].strip()
            if current_user.role in ['student', 'coordinator'] and data.get('cpi'):
                current_user.cpi = float(data['cpi'])
            if current_user.role == 'coordinator' and data.get('club_name'):
                current_user.club_name = data['club_name'].strip()
            if current_user.role == 'professor':
                current_user.research_interests = data.get('research_interests', '').strip()

        db.session.commit()

        # Update the user object returned
        updated = {
            'email': current_user.email, 'name': current_user.name,
            'role': current_user.role, 'cpi': current_user.cpi,
            'club_name': current_user.club_name,
            'research_interests': current_user.research_interests,
            'resume_path': current_user.resume_path
        }
        return jsonify({'message': 'Profile updated', 'user': updated}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# NEW: My applications (for students to track status)
@auth_bp.route('/api/my-applications', methods=['GET'])
@token_required
def my_applications(current_user):
    from models import Application, Project
    apps = Application.query.filter_by(applicant_email=current_user.email).order_by(Application.created_at.desc()).all()
    result = []
    for a in apps:
        project = Project.query.get(a.project_id)
        poster = User.query.get(project.posted_by) if project else None
        result.append({
            'id': a.id,
            'project_id': a.project_id,
            'project_title': project.title if project else 'Deleted Project',
            'posted_by_name': poster.name if poster else 'Unknown',
            'posted_by_role': poster.role if poster else '',
            'status': a.status,
            'created_at': a.created_at.isoformat()
        })
    return jsonify(result), 200
