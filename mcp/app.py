from django.conf import settings

from cinp.server_werkzeug import WerkzeugServer
from cinp.server_common import Model, Action, Paramater

from mcp.Auth.models import getUser


class BlankTransaction():
  def __init__( self ):
    super().__init__()

  def get( self, model, object_id ):
    return None

  def create( self, model, value_map ):
    pass

  def update( self, model, object_id, value_map ):
    return None

  def list( self, model, filter_name, filter_values, position, count ):
    return []

  def delete( self, model, object_id ):
    return False

  def start( self ):
    pass

  def commit( self ):
    pass

  def abort( self ):
    pass


def contractorInfo():
  return { 'host': settings.CONTRACTOR_HOST, 'username': settings.CONTRACTOR_NULLUNIT_USERNAME, 'password': settings.CONTRACTOR_NULLUNIT_PASSWORD }


def packratInfo():
  return { 'host': settings.PACKRAT_HOST, 'username': settings.PACKRAT_NULLUNIT_USERNAME, 'password': settings.PACKRAT_NULLUNIT_PASSWORD }


def confluenceInfo():
  return { 'host': settings.CONFLUENCE_HOST, 'username': settings.CONFLUENCE_NULLUNIT_USERNAME, 'password': settings.CONFLUENCE_NULLUNIT_PASSWORD  }


def get_app( debug ):
  extras = {}
  if settings.UI_HOSTNAME is not None:
    extras[ 'cors_allow_origin' ] = settings.UI_HOSTNAME

  app = WerkzeugServer( root_path='/api/v1/', root_version='0.11', debug=debug, get_user=getUser, auth_header_list=[ 'AUTH-ID', 'AUTH-TOKEN' ], auth_cookie_list=[ 'SESSION' ], debug_dump_location=settings.DEBUG_DUMP_LOCATION, **extras )

  config = Model( name='config', field_list=[], transaction_class=BlankTransaction )
  config.checkAuth = lambda user, verb, id_list: True
  app.root_namespace.addElement( config )

  info = Action( name='getContractorInfo', return_paramater=Paramater( type='Map' ), func=contractorInfo )
  info.checkAuth = lambda user, verb, id_list: True
  config.addAction( info )
  info = Action( name='getPackratInfo', return_paramater=Paramater( type='Map' ), func=packratInfo )
  info.checkAuth = lambda user, verb, id_list: True
  config.addAction( info )
  info = Action( name='getConfluenceInfo', return_paramater=Paramater( type='Map' ), func=confluenceInfo )
  info.checkAuth = lambda user, verb, id_list: True
  config.addAction( info )

  app.registerNamespace( '/', 'mcp.Auth' )
  app.registerNamespace( '/', 'mcp.Resource' )
  app.registerNamespace( '/', 'mcp.Project' )
  app.registerNamespace( '/', 'mcp.Processor' )

  app.validate()

  return app
