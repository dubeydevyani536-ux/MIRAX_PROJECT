from flask import Blueprint, request, jsonify
from models import db, Announcement, User
from auth import token_required, role_required
from config import Config
import os

announcements_bp = Blueprint('announcements', __name__)


@announcements_bp.route('/api/announcements', methods=['POST'])
@token_required
@role_required('coordinator', 'professor')
def create_announcement(current_user):
    try:
        title = request.form.get('title', '').strip()
        content = request.form.get('content', '').strip()
        if not title or not content:
            return jsonify({'error': 'Title and content required'}), 400

        image_path = None
        if 'image' in request.files:
            img = request.files['image']
            if img.filename:
                os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'images'), exist_ok=True)
                filename = f"{current_user.email.replace('@','_').replace('.','_')}_{img.filename}"
                img.save(os.path.join(Config.UPLOAD_FOLDER, 'images', filename))
                image_path = f"images/{filename}"

        ann = Announcement(
            title=title, content=content,
            image_path=image_path, posted_by=current_user.email
        )
        db.session.add(ann)
        db.session.commit()
        return jsonify({'message': 'Announcement posted'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@announcements_bp.route('/api/announcements', methods=['GET'])
@token_required
def list_announcements(current_user):
    anns = Announcement.query.order_by(Announcement.created_at.desc()).all()
    result = []
    for a in anns:
        author = User.query.get(a.posted_by)
        result.append({
            'id': a.id, 'title': a.title, 'content': a.content,
            'image_path': a.image_path,
            'posted_by': a.posted_by,
            'author_name': author.name if author else 'Unknown',
            'author_role': author.role if author else '',
            'club_name': author.club_name if author else None,
            'created_at': a.created_at.isoformat()
        })
    return jsonify(result), 200
