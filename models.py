from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

 
class User(db.Model):  # creates a static templete
    __tablename__ = 'users'
    email = db.Column(db.String(120), primary_key=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    cpi = db.Column(db.Float, nullable=True)
    resume_path = db.Column(db.String(256), nullable=True)
    club_name = db.Column(db.String(100), nullable=True)
    research_interests = db.Column(db.Text, nullable=True)  # NEW: for professors
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
           # establishes a relation between user and project(one user can have multiple projects)   
    projects = db.relationship('Project', backref='author', lazy=True)
    applications = db.relationship('Application', backref='applicant', lazy=True)
    announcements = db.relationship('Announcement', backref='author', lazy=True)
    showcases = db.relationship('Showcase', backref='author', lazy=True)
    social_posts = db.relationship('SocialPost', backref='author', lazy=True)
    sent_messages = db.relationship('Message', foreign_keys='Message.sender_email', backref='sender', lazy=True)
    received_messages = db.relationship('Message', foreign_keys='Message.receiver_email', backref='receiver', lazy=True)


class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    required_skills = db.Column(db.Text, nullable=True)
    posted_by = db.Column(db.String(120), db.ForeignKey('users.email'), nullable=False)
    is_club_project = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
          # establish relationship with projetctquestions
    questions = db.relationship('ProjectQuestion', backref='project', lazy=True, cascade='all, delete-orphan')
    applications = db.relationship('Application', backref='project', lazy=True, cascade='all, delete-orphan')


class ProjectQuestion(db.Model):
    __tablename__ = 'project_questions'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    order_num = db.Column(db.Integer, default=0)


class Application(db.Model):
    __tablename__ = 'applications'
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    applicant_email = db.Column(db.String(120), db.ForeignKey('users.email'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    answers = db.relationship('ApplicationAnswer', backref='application', lazy=True, cascade='all, delete-orphan')


class ApplicationAnswer(db.Model):
    __tablename__ = 'application_answers'
    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    question_id = db.Column(db.Integer, db.ForeignKey('project_questions.id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)


class Announcement(db.Model):
    __tablename__ = 'announcements'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.String(256), nullable=True)  # NEW: optional image
    posted_by = db.Column(db.String(120), db.ForeignKey('users.email'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class Showcase(db.Model):
    __tablename__ = 'showcases'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    file_path = db.Column(db.String(256), nullable=True)
    posted_by = db.Column(db.String(120), db.ForeignKey('users.email'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class SocialPost(db.Model):
    __tablename__ = 'social_posts'
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.String(256), nullable=True)  # NEW: optional image
    posted_by = db.Column(db.String(120), db.ForeignKey('users.email'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class Message(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    sender_email = db.Column(db.String(120), db.ForeignKey('users.email'), nullable=False)
    receiver_email = db.Column(db.String(120), db.ForeignKey('users.email'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_pitch = db.Column(db.Boolean, default=False)
    pitch_title = db.Column(db.String(200), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
