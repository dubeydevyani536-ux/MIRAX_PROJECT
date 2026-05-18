from flask import Blueprint, request, jsonify
from models import User, Project
from auth import token_required
from sqlalchemy import or_

search_bp = Blueprint('search', __name__)


@search_bp.route('/api/search', methods=['GET'])
@token_required
def global_search(current_user):
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'users': [], 'projects': []}), 200

    keyword = f"%{q}%"

    users = User.query.filter(
        or_(User.name.ilike(keyword), User.email.ilike(keyword), User.club_name.ilike(keyword))
    ).limit(20).all()

    projects = Project.query.filter(
        or_(Project.title.ilike(keyword), Project.description.ilike(keyword),
            Project.required_skills.ilike(keyword))
    ).limit(20).all()

    return jsonify({
        'users': [{'email': u.email, 'name': u.name, 'role': u.role,
                    'cpi': u.cpi, 'club_name': u.club_name} for u in users],
        'projects': [{'id': p.id, 'title': p.title, 'description': p.description[:150],
                       'required_skills': p.required_skills, 'posted_by': p.posted_by,
                       'created_at': p.created_at.isoformat()} for p in projects]
    }), 200
