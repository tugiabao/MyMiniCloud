import os
import socket
from flask import Flask, jsonify
from flask_migrate import Migrate
from models import db, User

app = Flask(__name__)

# Lấy cấu hình từ biến môi trường (Docker đẩy vào)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def index():
    return jsonify({
        "message": "Welcome to MyMiniCloud API",
        "container_id": socket.gethostname(),
        "status": "Running"
    })

@app.route('/users')
def get_users():
    users = User.query.all()
    return jsonify([{"id": u.id, "username": u.username} for u in users])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)