import logging

from django.conf import settings

from cinp.client import CInP, InvalidSession, DetailedInvalidRequest

PACKRAT_API_VERSION = '2.0'


def getPackrat():
  logging.debug( 'packrat: connecting to Packrat...' )
  return Packrat( settings.PACKRAT_HOST, settings.PACKRAT_PROXY, settings.PACKRAT_USERNAME, settings.PACKRAT_PASSWORD )


class Packrat():
  def __init__( self, host, proxy, username, password ):
    super().__init__()
    self.host = host
    self.proxy = proxy
    self.username = username
    self.password = password

    self.cinp = None
    self.token = None

  async def __aenter__( self ):
    self.cinp = await CInP( host=self.host, root_path='/api/v2/', proxy=self.proxy ).__aenter__()

    root, _ = await self.cinp.describe( '/api/v2/', retry_count=10 )
    if root[ 'api-version' ] != PACKRAT_API_VERSION:
      raise Exception( 'Expected API version "{0}" found "{1}"'.format( PACKRAT_API_VERSION, root[ 'api-version' ] ) )

    logging.debug( 'packrat: login' )
    self.token = await self.cinp.call( '/api/v2/Auth/User(login)', { 'username': self.username, 'password': self.password }, retry_count=10 )
    self.cinp.setAuth( self.username, self.token )
    return self

  async def __aexit__( self, exc_type, exc, tb ):
    await self.logout()
    await self.cinp.__aexit__( exc_type, exc, tb )
    self.cinp = None

  async def logout( self ):
    logging.debug( 'packrat: logout' )
    try:
      await self.cinp.call( '/api/v2/Auth/User(logout)', { 'token': self.token }, retry_count=10 )
    except InvalidSession:
      pass
    self.cinp.setAuth()
    self.token = None

  async def packages( self ):
    logging.debug( 'packrat: listing packages' )
    results = []

    for item in ( await self.cinp.list( '/api/v2/Package/Package', count=50, retry_count=10 ) )[0]:
      results.append( item.split( ':' )[1] )

    return results

  async def package_files( self, package ):
    logging.debug( 'packrat: listing package files for "{0}"'.format( package ) )

    return await self.cinp.getFilteredObjects( '/api/v2/Package/PackageFile', 'package', { 'package': '/api/v2/Package/Package:{0}:'.format( package ) }, retry_count=10 )

  async def tag_requirements_map( self ):
    logging.debug( 'packrat: get tag_requirements_map' )
    results = {}

    tag_map = await self.cinp.call( '/api/v2/Attrib/Tag(tagMap)', {}, retry_count=10 )
    for ( tag, info ) in tag_map.items():
      if info[ 'change_control' ]:  # we can't promote these anyway
        continue

      results[ tag ] = info[ 'required' ]

    return results

  async def tag( self, package_file_id, tag ):
    logging.debug( 'packrat: tagging package file "{0}" with "{1}"'.format( package_file_id, tag ) )
    try:
      await self.cinp.call( '{0}(tag)'.format( package_file_id ), { 'tag': '/api/v2/Attrib/Tag:{0}:'.format( tag ) }, retry_count=10 )
    except DetailedInvalidRequest as e:
      if e.error != 'ALLREADY_TAGGED':
        raise e

  async def fail( self, package_file_id ):
    logging.debug( 'packrat: failing package file "{0}"'.format( package_file_id ) )
    await self.cinp.call( '{0}(fail)'.format( package_file_id ), {}, retry_count=10 )
