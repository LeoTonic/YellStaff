from . import db, login_manager
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime as dt
import re

# fio pattern
FIO_PATTERN = re.compile(r'(\w+)\s(\w+)\s(\w+)')


class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True, nullable=False)
    ccode = db.Column(db.String(16), unique=True, nullable=False)

    users = db.relationship('User', backref='role', lazy='dynamic')

    def __repr__(self):
        return '<Role: {}>'.format(self.name)


class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name_full = db.Column(db.String(128), nullable=False)
    name_short = db.Column(db.String(64), nullable=True)
    email = db.Column(db.String(128), nullable=True)
    saphr_id = db.Column(db.Integer, nullable=True)

    is_active = db.Column(db.Integer)
    last_login_date = db.Column(db.DateTime, nullable=True)

    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'))

    logins = db.relationship('Login', backref='user', lazy='dynamic')
    proposes = db.relationship('Propose', backref='user', lazy='dynamic')
    approves = db.relationship('Approve', backref='user', lazy='dynamic')

    @property
    def user_name(self):
        return self.name_full

    @user_name.setter
    def user_name(self, name):
        self.name_full = name
        short_name = ""
        try:
            sre = re.search(FIO_PATTERN, name)
            short_name = ("{} {}.{}.".format(sre.group(1), sre.group(2)[0], sre.group(3)[0])) if sre else name
        except Exception as error:
            print(error)
            short_name = name
        finally:
            self.name_short = (short_name[:64]) if len(short_name) > 64 else short_name

    def __repr__(self):
        return '<User: {}>'.format(self.name_short)


class Login(db.Model):
    __tablename__ = 'logins'
    id = db.Column(db.Integer, primary_key=True)
    login = db.Column(db.String(128), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    @property
    def password(self):
        raise AttributeError('password is not readable')

    @password.setter
    def password(self, password):
        self.password_hash = generate_password_hash(password)

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return '<Login: {}>'.format(self.login)


class Position(db.Model):
    __tablename__ = 'positions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), unique=True, nullable=False)
    ccode = db.Column(db.String(16), unique=True, nullable=False)

    values = db.relationship('Value', backref='position', lazy='dynamic')
    staffs = db.relationship('Staff', backref='position', lazy='dynamic')


class ValueGroup(db.Model):
    __tablename__ = 'valuegroups'
    id = db.Column(db.Integer, primary_key=True)
    name_full = db.Column(db.String(128), unique=True, nullable=False)
    name_short = db.Column(db.String(16), unique=True, nullable=False)

    values = db.relationship('Value', backref='valuegroup', lazy='dynamic')

    def __repr__(self):
        return '<ValueGroup: {}>'.format(self.name_short)


class Value(db.Model):
    __tablename__ = 'values'
    id = db.Column(db.Integer, primary_key=True)
    name_full = db.Column(db.String(128), unique=True, nullable=False)
    name_short = db.Column(db.String(16))
    measurement = db.Column(db.String(16))

    valuegroup_id = db.Column(db.Integer, db.ForeignKey('valuegroups.id'))
    position_id = db.Column(db.Integer, db.ForeignKey('positions.id'))

    yields = db.relationship('Yield', backref='value', lazy='dynamic')

    def __repr__(self):
        return '<Value: {}>'.format(self.name_short)


class Iteration(db.Model):
    __tablename__ = 'iterations'
    id = db.Column(db.Integer, primary_key=True)
    is_active = db.Column(db.Integer)
    publish_date = db.Column(db.DateTime, default=dt.utcnow())
    publish_author = db.Column(db.String(128), nullable=True)
    description = db.Column(db.String(255))
    quantity_actual_date = db.Column(db.DateTime, nullable=True)
    quantity_potential_date = db.Column(db.DateTime, nullable=True)

    check_date_rvsp = db.Column(db.DateTime, nullable=True)
    check_date_rgvsp = db.Column(db.DateTime, nullable=True)
    check_date_rsvsp = db.Column(db.DateTime, nullable=True)
    check_date_gosb = db.Column(db.DateTime, nullable=True)
    check_date_tb = db.Column(db.DateTime, nullable=True)
    check_date_rdir = db.Column(db.DateTime, nullable=True)

    staffs = db.relationship('Staff', backref='iteration', lazy='dynamic')
    consolidations = db.relationship('Consolidation', backref='iteration', lazy='dynamic')
    yields = db.relationship('Yield', backref='iteration', lazy='dynamic')
    trees = db.relationship('Tree', backref='iteration', lazy='dynamic')
    approves = db.relationship('Approve', backref='iteration', lazy='dynamic')

    def __repr__(self):
        return '<Iter: {}>'.format(self.id)


class Office(db.Model):
    __tablename__ = 'offices'
    id = db.Column(db.Integer, primary_key=True)
    id_struct = db.Column(db.Integer)  # isu_id_struct
    vsp_id = db.Column(db.Integer)
    vsp_name = db.Column(db.String(128), nullable=False)
    urf_code = db.Column(db.String(32), nullable=False)
    city = db.Column(db.String(64))
    tb_id = db.Column(db.Integer)
    tb_name = db.Column(db.String(128))
    gosb_id = db.Column(db.Integer)
    gosb_name = db.Column(db.String(128))
    osb_id = db.Column(db.Integer)
    osb_name = db.Column(db.String(128))

    def __repr__(self):
        return '<Office: {}>'.format(self.urf_code)


class Staff(db.Model):
    __tablename__ = 'staffs'
    id = db.Column(db.Integer, primary_key=True)
    quantity_actual = db.Column(db.Float)
    quantity_potential = db.Column(db.Float)
    quantity_propose_ca = db.Column(db.Float)
    alert_increase = db.Column(db.String(255))
    alert_decrease = db.Column(db.String(255))
    publish_date = db.Column(db.DateTime, default=dt.utcnow())
    publish_author = db.Column(db.String(128), nullable=True)

    iteration_id = db.Column(db.Integer, db.ForeignKey('iterations.id'))
    position_id = db.Column(db.Integer, db.ForeignKey('positions.id'))
    id_struct_vsp = db.Column(db.Integer)

    proposes = db.relationship('Propose', backref='staff', lazy='dynamic')
    trees = db.relationship('Tree', backref='staff', lazy='dynamic')


class Consolidation(db.Model):
    __tablename__ = 'consolidations'
    id = db.Column(db.Integer, primary_key=True)
    publish_date = db.Column(db.DateTime, default=dt.utcnow())
    publish_author = db.Column(db.String(128), nullable=True)
    id_user = db.Column(db.Integer)  # isu user id
    id_struct_vsp = db.Column(db.Integer)  # isu office id_struct
    iteration_id = db.Column(db.Integer, db.ForeignKey('iterations.id'))

    def __repr__(self):
        return '<Cons: {}-{}>'.format(self.id_struct_vsp, self.id_user)


class Yield(db.Model):
    __tablename__ = 'yields'
    id = db.Column(db.Integer, primary_key=True)
    current = db.Column(db.Float)

    value_id = db.Column(db.Integer, db.ForeignKey('values.id'))
    iteration_id = db.Column(db.Integer, db.ForeignKey('iterations.id'))
    id_struct_vsp = db.Column(db.Integer)


class Propose(db.Model):
    __tablename__ = 'proposes'
    id = db.Column(db.Integer, primary_key=True)
    quantity_propose_tb = db.Column(db.Float)
    publish_date = db.Column(db.DateTime, default=dt.utcnow())
    publish_ip = db.Column(db.String(32))
    comment = db.Column(db.String(255))

    staff_id = db.Column(db.Integer, db.ForeignKey('staffs.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))


class Tree(db.Model):
    __tablename__ = 'trees'
    id = db.Column(db.Integer, primary_key=True)
    iteration_id = db.Column(db.Integer, db.ForeignKey('iterations.id'))
    staff_id = db.Column(db.Integer, db.ForeignKey('staffs.id'))

    id_struct_vsp = db.Column(db.Integer)

    city_name = db.Column(db.String(64))
    quantity_propose_tb = db.Column(db.Float)
    quantity_comment = db.Column(db.String(255))
    propose_user_name = db.Column(db.String(64))
    propose_user_id = db.Column(db.Integer)
    propose_role_ccode = db.Column(db.String(16))
    propose_role_id = db.Column(db.Integer)

    rdir_name = db.Column(db.String(128))
    tb_name = db.Column(db.String(128))
    tb_id = db.Column(db.Integer)
    gosb_name = db.Column(db.String(128))
    gosb_id = db.Column(db.Integer)
    rsvsp_name = db.Column(db.String(128))
    orsvsp_name = db.Column(db.String(128))
    rgvsp_name = db.Column(db.String(128))
    orgvsp_name = db.Column(db.String(128))
    vsp_name = db.Column(db.String(128))
    urf_code = db.Column(db.String(32))
    position_name = db.Column(db.String(128))


class BoilerTemp(db.Model):
    __tablename__ = 'boiler_temp'
    id = db.Column(db.Integer, primary_key=True)
    value_name = db.Column(db.String(128))
    urf = db.Column(db.String(32))
    report_date = db.Column(db.DateTime)
    col = db.Column(db.String(64))
    update_login = db.Column(db.String(64))
    position_id = db.Column(db.Integer)


class VSPConsolidatorTemp(db.Model):
    __tablename__ = 'vsp_consolidator_temp'
    id = db.Column(db.Integer, primary_key=True)
    id_struct_vsp = db.Column(db.Integer)
    urf = db.Column(db.String(32))
    id_user = db.Column(db.Integer)
    fio = db.Column(db.String(128))
    role_id = db.Column(db.Integer)
    struct_name = db.Column(db.String(128))


class Approve(db.Model):
    __tablename__ = 'approves'
    id = db.Column(db.Integer, primary_key=True)
    id_struct = db.Column(db.Integer)  # tb_id or gosb_id

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    iteration_id = db.Column(db.Integer, db.ForeignKey('iterations.id'))
    approved = db.Column(db.Integer)

    approve_date = db.Column(db.DateTime, default=dt.utcnow())
    approve_ip = db.Column(db.String(32))


class QTARecommends(db.Model):
    __tablename__ = 'qta_final_recomends'
    id = db.Column(db.Integer, primary_key=True)
    urf_from = db.Column(db.String(20), index=True, nullable=False)
    urf_to = db.Column(db.String(20), index=True, nullable=False)
    is_rg_show = db.Column(db.Integer)
    priority = db.Column(db.Integer)
    distance = db.Column(db.Float)
    secret_key = db.Column(db.String(255), index=True, nullable=False)

    def __repr__(self):
        return '<QTARecom: {}-{}-{}>'.format(self.urf_from, self.urf_to, self.distance)


class QTAVsp(db.Model):
    __tablename__ = 'qta_vsp_to_from'
    id = db.Column(db.Integer, primary_key=True)
    urf = db.Column(db.String(20), index=True, nullable=False)
    vsp_short_name = db.Column(db.String(20))
    row_sort = db.Column(db.Integer, index=True)
    column_sort = db.Column(db.Integer, index=True)
    vsp_to_need_string = db.Column(db.String(300))
    vsp_from_offet_string = db.Column(db.String(300))
    region = db.Column(db.String(255))
    rg_vsp = db.Column(db.String(255))

    def __repr__(self):
        return '<QTAVsp: {}>'.format(self.urf)


class QTAUpdate(db.Model):
    __tablename__ = 'qta_update_status'
    id = db.Column(db.Integer, primary_key=True)
    date_actual = db.Column(db.DateTime, index=True)
    is_new = db.Column(db.Integer)

    def __repr__(self):
        return '<QTAActual: {}>'.format(self.date_actual)


class QTASelect(db.Model):
    __tablename__ = 'qta_selected'
    id = db.Column(db.Integer, primary_key=True)
    vsp_from = db.Column(db.String(300))
    vsp_to = db.Column(db.String(300))
    update_time = db.Column(db.DateTime, default=dt.utcnow())
    is_active = db.Column(db.Integer)
    client_info = db.Column(db.String(255))
    secret_key = db.Column(db.String(255), index=True, nullable=False)

    def __repr__(self):
        return '<QTASelected: {}-{}>'.format(self.vsp_from, self.vsp_to)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
