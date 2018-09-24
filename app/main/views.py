from flask import render_template, jsonify, request, json, flash, url_for, redirect, abort
from flask_login import current_user, login_required
from ..models import User, Role, Yield, Consolidation, Staff, Propose, Iteration, Tree, Approve
from datetime import datetime
from flask import Blueprint
from .. import db, app_version
from . import get_checkpoint, get_records, get_current_iteration, get_approve_struct_id_array, check_approved,\
    get_approves, shrink_user_role
from time import time
import flask_excel as excel

main = Blueprint('main', __name__)
CHECKPOINT_MESSAGE = u'Предложение численности готовит {} в срок до {} включительно'


@main.route('/', methods=['GET', 'POST'])
def index():
    if current_user.is_authenticated:
        # save last login date
        dt = datetime.now()
        current_user.last_login_date = dt
        db.session.commit()

        shrink_user_role(current_user)

        cur_iteration = get_current_iteration()
        if cur_iteration is None:
            abort(500)

        records = get_records(current_user, cur_iteration)

        if current_user.role.id > 6 or current_user.role.id == 0:
            approves = get_approves(cur_iteration)
        else:
            approves = None

        dt = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)

        checkpoint = get_checkpoint(cur_iteration, dt)

        struct_id_array = get_approve_struct_id_array(user=current_user, iteration=cur_iteration)
        quantity_approved =\
            check_approved(struct_id_array, iteration=cur_iteration) if struct_id_array is not None else 0

        flash(CHECKPOINT_MESSAGE.format(checkpoint[0], checkpoint[2].strftime("%d/%m/%Y")))
        return render_template('index.html',
                               db_data=records,
                               propose_role=checkpoint[1],
                               app_version=app_version,
                               cur_iteration=cur_iteration,
                               quantity_approved=quantity_approved,
                               approves=approves,
                               start_time=time())
    else:
        return redirect(url_for('auth.login'))


@main.route('/propose', methods=['POST'])
@login_required
def propose_quantity():
    user_id = request.form['user_id']
    staff_id = request.form['staff_id']
    propose_val = request.form['propose']
    comment_str = request.form['comment']
    remote_ip = request.remote_addr

    user = User.query.filter(User.id == user_id).first()
    if user is None:
        raise RuntimeError

    staff = Staff.query.filter_by(id=staff_id).first()
    if staff is None:
        raise RuntimeError

    # try write to db
    try:
        # create propose
        propose = Propose()
        propose.quantity_propose_tb = propose_val
        propose.user = user
        propose.staff = staff
        propose.comment = comment_str
        propose.publish_ip = remote_ip
        db.session.add(propose)

        # update tree
        tree = Tree.query.filter_by(staff_id=staff.id).first()
        if tree is None:
            raise RuntimeError

        tree.propose_user_name = user.name_short
        tree.propose_user_id = user.id
        tree.propose_role_ccode = user.role.ccode
        tree.propose_role_id = user.role.id
        tree.quantity_comment = comment_str
        tree.quantity_propose_tb = propose_val

        db.session.commit()
    except RuntimeError as re:
        db.session.rollback()
        return json.dumps({
            'error': re.args
        }), 500

    return jsonify({
        'propose_val': propose_val,
        'propose_user_name': user.name_short,
        'propose_role_ccode': user.role.ccode,
        'propose_role_id': user.role.id
    })


@main.route('/user/<int:user_id>', methods=['GET'])
@login_required
def index_byid(user_id):
    # enter in admin role by user_id
    if current_user.role.id != 0:
        return 'Service granted for administrator role only!', 403

    cur_iteration = get_current_iteration()
    if cur_iteration is None:
        abort(500)

    fake_user = User.query.filter_by(id=user_id).first()
    if fake_user is None:
        return 'User {} not found'.format(user_id), 200

    shrink_user_role(fake_user)

    # query by user consolidations
    records = get_records(fake_user, cur_iteration)
    dt = datetime.today().replace(hour=0, minute=0, second=0, microsecond=0)
    checkpoint = get_checkpoint(cur_iteration, dt)

    if fake_user.role.id > 6:
        approves = get_approves(cur_iteration)
    else:
        approves = None

    struct_id_array = get_approve_struct_id_array(user=fake_user, iteration=cur_iteration)
    quantity_approved = check_approved(struct_id_array, iteration=cur_iteration) if struct_id_array is not None else 0
    flash(CHECKPOINT_MESSAGE.format(checkpoint[0], checkpoint[2].strftime("%d/%m/%Y")))

    return render_template('index.html',
                           db_data=records,
                           propose_role=checkpoint[1],
                           fake_user=fake_user,
                           app_version=app_version,
                           cur_iteration=cur_iteration,
                           quantity_approved=quantity_approved,
                           approves=approves,
                           start_time=time())


@main.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@main.errorhandler(405)
def method_not_allowed(e):
    return render_template('405.html'), 405


@main.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500


@main.route('/export', methods=['GET'])
@login_required
def export_excel():
    cur_iteration = get_current_iteration()
    if cur_iteration is None:
        abort(500)
    records = get_records(current_user, cur_iteration)
    arr = []
    cols = [u'ТБ', u'ГОСБ', u'ВСП', u'ВСП_Код', u'Должность', u'Факт_числ-ть',
            u'Предл_ЦА', u'Коррект_ТБ', u'Коррект_Коммент', u'Коррект_ФИО', u'Коррект_Должн.']
    arr.append(cols)
    for record in records:
        row = [
            record[0].tb_name,
            record[0].gosb_name,
            record[0].vsp_name,
            record[0].urf_code,
            record[0].position_name,
            record[1].quantity_actual,
            record[1].quantity_propose_ca,
            record[0].quantity_propose_tb,
            record[0].quantity_comment,
            record[0].propose_user_name,
            record[0].propose_role_ccode
        ]
        arr.append(row)

    try:
        result = excel.make_response_from_array(array=arr, file_type="xls", file_name="export")
    except Exception as e:
        result = e
    return result


@main.route('/approve', methods=['POST'])
@login_required
def approve_quantity():
    # check user struct_id by current iteration and tree
    try:
        user_id = request.form['user_id']
        approved = int(request.form['approved'])
        cur_iteration = get_current_iteration()
        if cur_iteration is None:
            raise RuntimeError
        user = User.query.filter(User.id == user_id).first()
        if user is None:
            raise RuntimeError
        struct_id = get_approve_struct_id_array(user, cur_iteration)
        if struct_id is None:
            raise RuntimeError

        # change status
        if approved == 1:
            approved = 0
        else:
            approved = 1
        approve = Approve.query.filter(Approve.id_struct == struct_id[0])\
            .filter(Approve.iteration == cur_iteration).first()
        if approve is None:
            approve = Approve()
            approve.id_struct = struct_id[0]
            approve.iteration = cur_iteration
            approve.user = user
            approve.approved = approved
            approve.approve_ip = request.remote_addr
            db.session.add(approve)
        else:
            approve.user = user
            approve.approved = approved
            approve.approve_ip = request.remote_addr
        db.session.commit()
        return jsonify({'approved': approve.approved})
    except RuntimeError as re:
        db.session.rollback()
        return json.dumps({
            'error': re.args
        }), 500
