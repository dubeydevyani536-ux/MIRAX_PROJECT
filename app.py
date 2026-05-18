from flask import Flask, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config.from_object(Config)
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
CORS(app)

db.init_app(app)

# Register blueprints
from auth import auth_bp
from routes.projects import projects_bp
from routes.announcements import announcements_bp
from routes.showcase import showcase_bp
from routes.feed import feed_bp
from routes.messages import messages_bp
from routes.search import search_bp
from routes.pitch import pitch_bp

app.register_blueprint(auth_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(announcements_bp)
app.register_blueprint(showcase_bp)
app.register_blueprint(feed_bp)
app.register_blueprint(messages_bp)
app.register_blueprint(search_bp)
app.register_blueprint(pitch_bp)


# Serve HTML pages
@app.route('/')
def index():
    return send_from_directory('templates', 'index.html')


@app.route('/dashboard')
def dashboard():
    return send_from_directory('templates', 'dashboard.html')


@app.route('/projects')
def projects_page():
    return send_from_directory('templates', 'projects.html')


@app.route('/announcements')
def announcements_page():
    return send_from_directory('templates', 'announcements.html')


@app.route('/showcase')
def showcase_page():
    return send_from_directory('templates', 'showcase.html')


@app.route('/feed')
def feed_page():
    return send_from_directory('templates', 'feed.html')


@app.route('/messages')
def messages_page():
    return send_from_directory('templates', 'messages.html')


@app.route('/search')
def search_page():
    return send_from_directory('templates', 'search.html')


@app.route('/profile')
def profile_page():
    return send_from_directory('templates', 'profile.html')


# Serve uploaded files
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(Config.UPLOAD_FOLDER, filename)


# Create tables on first run
with app.app_context():
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'resumes'), exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'showcases'), exist_ok=True)
    os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'images'), exist_ok=True)
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
