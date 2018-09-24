import os
from flask_migrate import MigrateCommand, Migrate
from flask_script import Shell, Manager, Server
from flask_admin import Admin
from app import create_app, db, admin
from app.models import User, Role, Iteration, Propose, Value,\
    ValueGroup, Tree, Yield, Position
import datetime

app = create_app(os.getenv('FLASK_CONFIG') or 'default')
adminApp = Admin(app, name='qmt', template_mode='bootstrap3')
adminApp.add_view(admin.YSAdminViewUser(User, db.session))
adminApp.add_view(admin.YSAdminViewIteration(Iteration, db.session))

migrate = Migrate(app, db)
manager = Manager(app)


def make_shell_context():
    return dict(db=db,
                User=User,
                Role=Role,
                Iteration=Iteration,
                Tree=Tree,
                Propose=Propose,
                Value=Value,
                ValueGroup=ValueGroup,
                Yield=Yield,
                Position=Position,
                app=app,
                dt=datetime)


manager.add_command('runserver', Server())
manager.add_command("shell", Shell(make_context=make_shell_context))
manager.add_command("db", MigrateCommand)


if __name__ == '__main__':
    manager.run()


