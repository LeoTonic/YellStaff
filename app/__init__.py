from flask import Flask
from flask_bootstrap import Bootstrap
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import config
import flask_excel

app_version = '1.3.2'

bootstrap = Bootstrap()
db = SQLAlchemy(session_options={'autoflush': False})
login_manager = LoginManager()
login_manager.session_protection = 'strong'
login_manager.login_view = 'auth.login'


def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    bootstrap.init_app(app)
    db.init_app(app)
    login_manager.init_app(app)
    flask_excel.init_excel(app)

    from .main.views import main as main_blueprint
    app.register_blueprint(main_blueprint)
    from .auth.views import auth as auth_blueprint
    app.register_blueprint(auth_blueprint, url_prefix='/auth')
    from .browse.views import browse as browse_blueprint
    app.register_blueprint(browse_blueprint, url_prefix='/browse')

    # register error handlers
    from .main.views import page_not_found, server_error, method_not_allowed
    app.register_error_handler(404, page_not_found)
    app.register_error_handler(405, method_not_allowed)
    app.register_error_handler(500, server_error)

    print('create app for {} configuration'.format(config_name))

    return app
