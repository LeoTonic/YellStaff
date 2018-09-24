from flask import redirect, url_for
from flask_admin.contrib.sqla import ModelView
from flask_login import current_user


class YSAdminViewUser(ModelView):
    column_default_sort = 'name_full'
    can_delete = False
    page_size = 50
    column_searchable_list = ['name_full']
    column_filters = ['name_full']

    def is_accessible(self):
        if current_user.is_authenticated:
            if current_user.id == 0:
                return True
        return False

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('auth.login'))


class YSAdminViewIteration(ModelView):
    column_default_sort = 'id'
    can_delete = False
    page_size = 50

    def is_accessible(self):
        if current_user.is_authenticated:
            if current_user.id == 0:
                return True
        return False

    def inaccessible_callback(self, name, **kwargs):
        return redirect(url_for('auth.login'))
