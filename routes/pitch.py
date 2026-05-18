from flask import Blueprint, request, jsonify
from models import db, Message, User
from auth import token_required, role_required

pitch_bp = Blueprint('pitch', __name__)


@pitch_bp.route('/api/pitch', methods=['POST'])
@token_required
def send_pitch(current_user):
    try:
        data = request.get_json()
        receiver = data.get('receiver_email', '').strip()
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()

        if not receiver or not title or not description:
            return jsonify({'error': 'Receiver, title, and description required'}), 400

        target = User.query.get(receiver)
        if not target:
            return jsonify({'error': 'Receiver not found'}), 404
        if target.role not in ['professor', 'coordinator']:
            return jsonify({'error': 'Can only pitch to professors or coordinators'}), 400

        msg = Message(
            sender_email=current_user.email, receiver_email=receiver,
            content=description, is_pitch=True, pitch_title=title
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify({'message': 'Pitch sent successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@pitch_bp.route('/api/pitch/received', methods=['GET'])
@token_required
@role_required('professor', 'coordinator')
def received_pitches(current_user):
    pitches = Message.query.filter_by(
        receiver_email=current_user.email, is_pitch=True
    ).order_by(Message.created_at.desc()).all()

    return jsonify([{
        'id': p.id, 'sender_email': p.sender_email,
        'sender_name': User.query.get(p.sender_email).name if User.query.get(p.sender_email) else 'Unknown',
        'title': p.pitch_title, 'description': p.content,
        'created_at': p.created_at.isoformat()
    } for p in pitches]), 200
