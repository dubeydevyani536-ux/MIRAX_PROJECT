from flask import Blueprint, request, jsonify
from models import db, Project, ProjectQuestion, Application, ApplicationAnswer, User, Message
from auth import token_required, role_required

projects_bp = Blueprint('projects', __name__)


@projects_bp.route('/api/projects', methods=['POST'])
@token_required
@role_required('professor', 'coordinator')
def create_project(current_user):
    try:
        data = request.get_json()
        project = Project(
            title=data['title'].strip(),
            description=data['description'].strip(),
            required_skills=data.get('required_skills', ''),
            posted_by=current_user.email,
            is_club_project=(current_user.role == 'coordinator')
        )
        db.session.add(project)
        db.session.flush()

        for i, q in enumerate(data.get('questions', [])):
            if q.strip():
                db.session.add(ProjectQuestion(project_id=project.id, question_text=q.strip(), order_num=i))

        db.session.commit()
        return jsonify({'message': 'Project created', 'project_id': project.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects', methods=['GET'])
@token_required
def list_projects(current_user):
    projects = Project.query.order_by(Project.created_at.desc()).all()
    result = []
    for p in projects:
        author = User.query.get(p.posted_by)
        result.append({
            'id': p.id, 'title': p.title, 'description': p.description,
            'required_skills': p.required_skills, 'posted_by': p.posted_by,
            'author_name': author.name if author else 'Unknown',
            'author_role': author.role if author else '',
            'is_club_project': p.is_club_project,
            'club_name': author.club_name if author and p.is_club_project else None,
            'question_count': len(p.questions),
            'application_count': len(p.applications),
            'created_at': p.created_at.isoformat()
        })
    return jsonify(result), 200


@projects_bp.route('/api/projects/<int:pid>', methods=['GET'])
@token_required
def get_project(current_user, pid):
    p = Project.query.get_or_404(pid)
    author = User.query.get(p.posted_by)
    questions = [{'id': q.id, 'question_text': q.question_text, 'order_num': q.order_num}
                 for q in sorted(p.questions, key=lambda x: x.order_num)]
    existing = Application.query.filter_by(project_id=pid, applicant_email=current_user.email).first()
    return jsonify({
        'id': p.id, 'title': p.title, 'description': p.description,
        'required_skills': p.required_skills, 'posted_by': p.posted_by,
        'author_name': author.name if author else 'Unknown',
        'author_role': author.role if author else '',
        'is_club_project': p.is_club_project,
        'club_name': author.club_name if author and p.is_club_project else None,
        'questions': questions, 'application_count': len(p.applications),
        'already_applied': existing is not None,
        'created_at': p.created_at.isoformat()
    }), 200


@projects_bp.route('/api/projects/<int:pid>/apply', methods=['POST'])
@token_required
def apply_project(current_user, pid):
    try:
        if current_user.role == 'professor':
            return jsonify({'error': 'Professors cannot apply'}), 403
        project = Project.query.get_or_404(pid)
        if Application.query.filter_by(project_id=pid, applicant_email=current_user.email).first():
            return jsonify({'error': 'Already applied'}), 409

        data = request.get_json()
        app = Application(project_id=pid, applicant_email=current_user.email)
        db.session.add(app)
        db.session.flush()

        for q in project.questions:
            ans = data.get('answers', {}).get(str(q.id), '')
            if ans:
                db.session.add(ApplicationAnswer(application_id=app.id, question_id=q.id, answer_text=ans))

        db.session.commit()
        return jsonify({'message': 'Application submitted'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/projects/<int:pid>/applications', methods=['GET'])
@token_required
def get_applications(current_user, pid):
    project = Project.query.get_or_404(pid)
    if project.posted_by != current_user.email:
        return jsonify({'error': 'Access denied'}), 403

    apps = Application.query.filter_by(project_id=pid).order_by(Application.created_at.desc()).all()
    result = []
    for a in apps:
        user = User.query.get(a.applicant_email)
        answers = [{'question_text': ProjectQuestion.query.get(ans.question_id).question_text,
                     'answer_text': ans.answer_text} for ans in a.answers]
        result.append({
            'id': a.id, 'applicant_email': a.applicant_email,
            'applicant_name': user.name if user else 'Unknown',
            'applicant_role': user.role if user else '',
            'cpi': user.cpi if user else None,
            'resume_path': user.resume_path if user else None,
            'status': a.status, 'answers': answers,
            'created_at': a.created_at.isoformat()
        })
    return jsonify(result), 200


@projects_bp.route('/api/applications/<int:aid>/status', methods=['PUT'])
@token_required
def update_status(current_user, aid):
    try:
        app = Application.query.get_or_404(aid)
        project = Project.query.get(app.project_id)
        if project.posted_by != current_user.email:
            return jsonify({'error': 'Access denied'}), 403
        data = request.get_json()
        new_status = data['status']
        if new_status not in ['accepted', 'rejected', 'pending']:
            return jsonify({'error': 'Invalid status'}), 400

        old_status = app.status
        app.status = new_status
        db.session.flush()

        # AUTO-CHAT: If accepted, create an automatic chat thread
        if new_status == 'accepted' and old_status != 'accepted':
            auto_msg = Message(
                sender_email=current_user.email,
                receiver_email=app.applicant_email,
                content=f"🎉 Congratulations! Your application for \"{project.title}\" has been accepted. Let's discuss the next steps!",
                is_pitch=False
            )
            db.session.add(auto_msg)

        db.session.commit()
        return jsonify({'message': f"Application {new_status}"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/api/my-projects', methods=['GET'])
@token_required
def my_projects(current_user):
    projects = Project.query.filter_by(posted_by=current_user.email).order_by(Project.created_at.desc()).all()
    return jsonify([{
        'id': p.id, 'title': p.title, 'description': p.description,
        'required_skills': p.required_skills, 'application_count': len(p.applications),
        'created_at': p.created_at.isoformat()
    } for p in projects]), 200
