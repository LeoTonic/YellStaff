from datetime import datetime
from ..models import Iteration, User, Tree, Staff, Office, Consolidation, Approve
from .. import db


def get_checkpoint(iteration: Iteration, dt: datetime):
    check_position = u'Банк'
    check_role = 50  # Рук.РБ
    check_date = iteration.check_date_rdir

    if iteration.check_date_tb and iteration.check_date_tb >= dt:
        check_position = u'Тер.Банк'
        check_role = 18  # Рук.ТБ
        check_date = iteration.check_date_tb

    if iteration.check_date_gosb and iteration.check_date_gosb >= dt:
        check_position = u'ГОСБ'
        check_role = 11  # Рук.ГОСБ
        check_date = iteration.check_date_gosb

    if iteration.check_date_rsvsp and iteration.check_date_rsvsp >= dt:
        check_position = u'РСО'
        check_role = 6  # Рук.сети ВСП
        check_date = iteration.check_date_rsvsp

    if iteration.check_date_rgvsp and iteration.check_date_rgvsp >= dt:
        check_position = u'РГО'
        check_role = 2  # Рук.группы ВСП
        check_date = iteration.check_date_rgvsp

    if iteration.check_date_rvsp and iteration.check_date_rvsp >= dt:
        check_position = u'РВСП'
        check_role = 1  # Рук.ВСП
        check_date = iteration.check_date_rvsp

    # check for null date
    if check_date is None:
        check_date = datetime.now()

    return check_position, check_role, check_date


def get_current_iteration():
    return Iteration.query.filter(Iteration.is_active == 1).first()
    # return Iteration.query.order_by(Iteration.id.desc()).first()


def get_records(user: User, iteration: Iteration):
    rid = user.role.id
    # admin or supervisor
    if rid == 0 or rid == 20 or rid == 34 or rid == 49 or rid == 50 or rid == 55:
        # select all records
        return db.session.query(Tree, Staff).join(Staff).filter(Tree.iteration == iteration).all()
    else:
        # query by user consolidations
        off_arr = db.session.query(Consolidation.id_struct_vsp).filter(Consolidation.iteration == iteration)\
            .filter(Consolidation.id_user == user.id).all()
        offices = list(map(lambda x: x[0], off_arr))
        return db.session.query(Tree, Staff).join(Staff)\
            .filter(Tree.iteration == iteration).filter(Tree.id_struct_vsp.in_(offices)).all()


def get_approve_struct_id_array(user: User, iteration: Iteration):
    rid = user.role.id
    office = db.session.query(Consolidation.id_struct_vsp).filter(Consolidation.iteration == iteration)\
        .filter(Consolidation.id_user == user.id).first()
    if office is None:
        return None
    tree = db.session.query(Tree).filter(Tree.id_struct_vsp == office[0]).first()
    if tree is None:
        return None

    if rid >= 16:
        return [tree.tb_id]
    elif rid < 16:
        return [tree.gosb_id, tree.tb_id]
    else:
        return None


def check_approved(struct_id_array, iteration: Iteration):
    approve = Approve.query\
        .filter(Approve.id_struct.in_(struct_id_array))\
        .filter(Approve.iteration == iteration)\
        .filter(Approve.approved == 1).first()
    return 1 if approve is not None else 0


def get_approves(iteration: Iteration):
    app_arr = db.session.query(Approve.id_struct)\
        .filter(Approve.iteration == iteration)\
        .filter(Approve.approved == 1).all()
    return list(map(lambda x: x[0], app_arr))


def shrink_user_role(user: User):
    if user.role_id == 17 or user.role_id == 14:
        user.role_id = 18
