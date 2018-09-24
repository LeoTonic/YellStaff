import os
from urllib.parse import quote_plus
basedir = os.path.abspath(os.path.dirname(__file__))


class Login:
    DB_NAME = ""
    DB_LOGIN = ""
    DB_PASSWORD = ""


class Config:
    APP_NAME = 'QMT'
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'hard to guess string'
    DB_LOGIN = os.environ.get('DB_LOGIN') or Login.DB_LOGIN
    DB_PASSWORD = os.environ.get('DB_PASSWORD') or Login.DB_PASSWORD
    DB_NAME = os.environ.get('DB_NAME') or Login.DB_NAME
    DOMAIN = os.environ.get('DOMAIN')
    if DB_LOGIN and DB_PASSWORD and DB_NAME:
        DB_REQ = "DATABASE={0};UID={1};PWD={2}".format(DB_NAME, DB_LOGIN, DB_PASSWORD)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    BOOTSTRAP_SERVE_LOCAL = True
    TEMPLATES_AUTO_RELOAD = True
    ISU_AUTHORIZATION_URL = '{0}/api/webauth/login'.format(DOMAIN)
    ISU_GET_USER_INFO_URL = '{0}/api/GetUserInfo/get'.format(DOMAIN)

    LOGIN_MESSAGE = u'Авторизуйтесь для просмотра страницы.'

    @staticmethod
    def init_app(app):
        pass


class DevelopmentConfig(Config):
    DEBUG = True
    if Config.DB_REQ:
        db_con = "DRIVER={SQL Server Native Client 11.0};SERVER=SBT-CUP-001.ca.sbrf.ru;" + Config.DB_REQ
        params = quote_plus(db_con)
        if os.environ.get('MIGRATE') == '1':
            params = params.replace('%', '%%')
        SQLALCHEMY_DATABASE_URI = "mssql+pyodbc:///?odbc_connect={}".format(params)
    else:
        print("Connection string error")


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TEST_DATABASE_URL') or \
        'sqlite://'


class ProductionConfig(Config):
    if Config.DB_REQ:
        db_con = "DRIVER={SQL Server Native Client 11.0};SERVER=SBT-CUP-001.ca.sbrf.ru;" + Config.DB_REQ
        params = quote_plus(db_con)
        if os.environ.get('MIGRATE') == '1':
            params = params.replace('%', '%%')
        SQLALCHEMY_DATABASE_URI = "mssql+pyodbc:///?odbc_connect={}".format(params)
    else:
        print("Connection string error")


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
