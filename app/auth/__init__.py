from flask import session


def reset_session_values():
    session['browse_storetime'] = None
    session['browse_list'] = None
    session['browse_cbo_tb'] = None
    session['browse_cbo_gosb'] = None
    session['browse_cbo_rso'] = None
    session['browse_cbo_rgo'] = None
    session['browse_cbo_pos'] = None
    session['browse_cbo_approve'] = None
    session['browse_page'] = None
