from flask import Blueprint, request, jsonify
from models import db, Message, User
from auth import token_required
from sqlalchemy import or_, and_

messages_bp = Blueprint('messages', __name__)


@messages_bp.route('/api/messages', methods=['POST'])
@token_required
def send_message(current_user):
    try:
        data = request.get_json()
        receiver = data.get('receiver_email', '').strip()
        content = data.get('content', '').strip()
        is_pitch = data.get('is_pitch', False)
        pitch_title = data.get('pitch_title', '').strip()

        if not receiver or not content:
            return jsonify({'error': 'Receiver and content required'}), 400
        if not User.query.get(receiver):
            return jsonify({'error': 'Receiver not found'}), 404

        msg = Message(
            sender_email=current_user.email, receiver_email=receiver,
            content=content, is_pitch=is_pitch, pitch_title=pitch_title if is_pitch else None
        )
        db.session.add(msg)
        db.session.commit()
        return jsonify({'message': 'Message sent'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@messages_bp.route('/api/messages/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    email = current_user.email
    msgs = Message.query.filter(
        or_(Message.sender_email == email, Message.receiver_email == email)
    ).order_by(Message.created_at.desc()).all()

    seen = set()
    convos = []
    for m in msgs:
        other = m.receiver_email if m.sender_email == email else m.sender_email
        if other not in seen:
            seen.add(other)
            other_user = User.query.get(other)
            convos.append({
                'email': other,
                'name': other_user.name if other_user else 'Unknown',
                'role': other_user.role if other_user else '',
                'last_message': m.content[:80],
                'last_time': m.created_at.isoformat(),
                'is_pitch': m.is_pitch
            })
    return jsonify(convos), 200


@messages_bp.route('/api/messages/<path:other_email>', methods=['GET'])
@token_required
def get_thread(current_user, other_email):
    email = current_user.email
    msgs = Message.query.filter(
        or_(
            and_(Message.sender_email == email, Message.receiver_email == other_email),
            and_(Message.sender_email == other_email, Message.receiver_email == email)
        )
    ).order_by(Message.created_at.asc()).all()

    return jsonify([{
        'id': m.id, 'sender_email': m.sender_email, 'receiver_email': m.receiver_email,
        'content': m.content, 'is_pitch': m.is_pitch, 'pitch_title': m.pitch_title,
        'created_at': m.created_at.isoformat()
    } for m in msgs]), 200
