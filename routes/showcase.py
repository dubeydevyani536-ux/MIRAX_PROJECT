from flask import Blueprint, request, jsonify, send_from_directory
from models import db, Showcase, User
from auth import token_required
from config import Config
import os

showcase_bp = Blueprint('showcase', __name__)


@showcase_bp.route('/api/showcase', methods=['POST'])
@token_required
def create_showcase(current_user):
    try:
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        if not title or not description:
            return jsonify({'error': 'Title and description required'}), 400

        file_path = None
        if 'project_file' in request.files:
            f = request.files['project_file']
            if f.filename:
                os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'showcases'), exist_ok=True)
                filename = f"{current_user.email.replace('@','_').replace('.','_')}_{f.filename}"
                f.save(os.path.join(Config.UPLOAD_FOLDER, 'showcases', filename))
                file_path = f"showcases/{filename}"

        s = Showcase(title=title, description=description, file_path=file_path, posted_by=current_user.email)
        db.session.add(s)
        db.session.commit()
        return jsonify({'message': 'Showcase project uploaded'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@showcase_bp.route('/api/showcase', methods=['GET'])
@token_required
def list_showcases(current_user):
    items = Showcase.query.order_by(Showcase.created_at.desc()).all()
    return jsonify([{
        'id': s.id, 'title': s.title, 'description': s.description,
        'file_path': s.file_path, 'posted_by': s.posted_by,
        'author_name': User.query.get(s.posted_by).name if User.query.get(s.posted_by) else 'Unknown',
        'created_at': s.created_at.isoformat()
    } for s in items]), 200


@showcase_bp.route('/api/showcase/<int:sid>', methods=['GET'])
@token_required
def get_showcase(current_user, sid):
    s = Showcase.query.get_or_404(sid)
    author = User.query.get(s.posted_by)
    return jsonify({
        'id': s.id, 'title': s.title, 'description': s.description,
        'file_path': s.file_path, 'posted_by': s.posted_by,
        'author_name': author.name if author else 'Unknown',
        'created_at': s.created_at.isoformat()
    }), 200


@showcase_bp.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)
