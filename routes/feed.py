from flask import Blueprint, request, jsonify
from models import db, SocialPost, User
from auth import token_required
from config import Config
import os

feed_bp = Blueprint('feed', __name__)


@feed_bp.route('/api/feed', methods=['POST'])
@token_required
def create_post(current_user):
    try:
        content = request.form.get('content', '').strip()
        if not content:
            return jsonify({'error': 'Content is required'}), 400

        image_path = None
        if 'image' in request.files:
            img = request.files['image']
            if img.filename:
                os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'images'), exist_ok=True)
                filename = f"{current_user.email.replace('@','_').replace('.','_')}_{img.filename}"
                img.save(os.path.join(Config.UPLOAD_FOLDER, 'images', filename))
                image_path = f"images/{filename}"

        post = SocialPost(content=content, image_path=image_path, posted_by=current_user.email)
        db.session.add(post)
        db.session.commit()
        return jsonify({'message': 'Post published'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@feed_bp.route('/api/feed', methods=['GET'])
@token_required
def list_feed(current_user):
    posts = SocialPost.query.order_by(SocialPost.created_at.desc()).all()
    return jsonify([{
        'id': p.id, 'content': p.content, 'image_path': p.image_path,
        'posted_by': p.posted_by,
        'author_name': User.query.get(p.posted_by).name if User.query.get(p.posted_by) else 'Unknown',
        'author_role': User.query.get(p.posted_by).role if User.query.get(p.posted_by) else '',
        'created_at': p.created_at.isoformat()
    } for p in posts]), 200
