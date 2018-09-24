from flask import render_template, request, session
from flask import Blueprint
from flask_login import login_required
from ..models import Iteration, Yield, Office, Value, ValueGroup, Position
from .. import db, app_version
from time import time

browse = Blueprint('browse', __name__)


@browse.route('/', methods=['POST'])
@login_required
def browse_values():
    offices_list = request.form.getlist('offices[]')
    offices_list = list(map(int, offices_list))

    cbo_tb = request.form.getlist('cbo_tb[]')
    cbo_gosb = request.form.getlist('cbo_gosb[]')
    cbo_rso = request.form.getlist('cbo_rso[]')
    cbo_rgo = request.form.getlist('cbo_rgo[]')
    cbo_pos = request.form.getlist('cbo_pos[]')
    cbo_approve = request.form.getlist('cbo_approve[]')
    current_page = request.form.get('current_page')

    # store session data
    session['browse_storetime'] = time()  # store only for two hours
    session['browse_list'] = offices_list
    session['browse_cbo_tb'] = cbo_tb
    session['browse_cbo_gosb'] = cbo_gosb
    session['browse_cbo_rso'] = cbo_rso
    session['browse_cbo_rgo'] = cbo_rgo
    session['browse_cbo_pos'] = cbo_pos
    session['browse_cbo_approve'] = cbo_approve
    session['browse_page'] = current_page

    if offices_list is None:
        return 'VSP list is empty!', 404

    # query to database
    iteration = Iteration.query.filter(Iteration.is_active == 1).first()
    if iteration is None:
        return 'Active iteration is null', 404

    q = db.session.query(Yield, Value, ValueGroup, Position, Iteration, Office) \
        .join(Value).join(ValueGroup).join(Position).join(Iteration) \
        .join(Office, Office.id_struct == Yield.id_struct_vsp)\
        .filter(Iteration.is_active == 1).filter(Yield.id_struct_vsp.in_(offices_list)).all()

    return render_template("browse/index.html", db_data=q, app_version=app_version)
