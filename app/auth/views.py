import os
from flask import render_template, redirect, url_for, request, flash
from flask_login import login_user, logout_user, login_required
from flask import Blueprint
import requests
import json
import hashlib
from ..models import User, Role
from .. import db, app_version
from .forms import LoginForm
from config import config
from . import reset_session_values

auth = Blueprint('auth', __name__)

INCORRECT_PASSWORD = u'Неверное имя пользователя или пароль!'
ROLE_ACCESS_DENIED = u'Вход для данной роли пользователя запрещен!'
SERVER_ERROR = u'Ошибка связи с сервером ИСУ!'

ISU_AUTH_PATTERN = 'username={}&password={}&app=qmt'


@auth.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        reset_session_values()
        # check for admin enter
        if form.login.data == 'admin':
            # admin authorization check
            user = admin_authenticate(form.password.data)
            if user is not None:
                print("admin entered")
                login_user(user, form.remember_me.data)
                next_var = request.args.get('next')
                if next_var is None or not next_var.startswith('/'):
                    next_var = url_for('main.index')
                return redirect(next_var)
            else:
                flash(INCORRECT_PASSWORD)
        else:
            # ISU authorization check
            user = isu_authenticate(form.login.data, form.password.data)
            if user is not None:
                login_user(user, form.remember_me.data)
                next_var = request.args.get('next')
                if next_var is None or not next_var.startswith('/'):
                    next_var = url_for('main.index')
                return redirect(next_var)

    return render_template('auth/login.html', form=form, app_version=app_version)


@auth.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Вы вышли из системы.')
    return redirect(url_for('main.index'))


def admin_authenticate(password):
    if hashlib.sha1(password.encode()).hexdigest() != '792883c4eebc3b69fa15b94e87456cf2c566c202':
        return None
    return User.query.filter_by(id=0).first()


def isu_authenticate(login_data, password_data):
    conf_name = os.getenv('FLASK_CONFIG') or 'default'
    conf_obj = config[conf_name]

    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = ISU_AUTH_PATTERN.format(login_data, password_data)
    try:
        resp = requests.post(conf_obj.ISU_AUTHORIZATION_URL, headers=headers, data=data)
        d = dict(resp.cookies)
        if resp.status_code == 200 and d.get('.ASPXAUTH'):
            resp_get = requests.get(conf_obj.ISU_GET_USER_INFO_URL, cookies=d)
            if resp_get.status_code == 200:
                cnt = resp_get.content.decode('utf-8')
                json_data = json.loads(cnt)
                user_id = json_data['User_Id']
                user_name = json_data['user_name']
                role_id = json_data['role_id']
                user = User.query.filter_by(id=user_id).first()
                if user is None:
                    user = create_user(user_id, user_name, role_id)
                else:
                    user = update_user(user, user_name, role_id)
                return user
        else:
            flash(INCORRECT_PASSWORD)
            return None
    except Exception as e:
        print(e)

    flash(SERVER_ERROR)
    return None


def create_user(user_id, name, role_id):
    role = Role.query.filter_by(id=role_id).first()
    if role is None:
        flash(ROLE_ACCESS_DENIED)
        return None
    # try to create user
    try:
        user = User()
        user.id = user_id
        user.is_active = -1
        user.user_name = name
        user.role = role
        db.session.add(user)
        db.session.commit()
        print('user {} created'.format(user.id))
        return user
    except Exception as e:
        db.session.rollback()
        print(e)
        return None


def update_user(user, user_name, role_id):
    role = Role.query.filter_by(id=role_id).first()
    if role is None:
        flash(ROLE_ACCESS_DENIED)
        return None
    # try to update user
    try:
        user.user_name = user_name
        user.role = role
        db.session.commit()
        print('user {} updated'.format(user.id))
        return user
    except Exception as e:
        db.session.rollback()
        print(e)
        return None
