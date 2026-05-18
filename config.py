import os

class Config:
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))

    # Database URL
    db_url = os.environ.get('DATABASE_URL')

    # Fix Render postgres URL issue
    if db_url and db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)

    SQLALCHEMY_DATABASE_URI = db_url or \
        'sqlite:///' + os.path.join(BASE_DIR, 'college_hub.db')

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT
    JWT_SECRET = os.environ.get(
        'JWT_SECRET',
        'dev-secret-key'
    )

    JWT_EXPIRATION_HOURS = 24

    # Uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')

    MAX_CONTENT_LENGTH = 16 * 1024 * 1024