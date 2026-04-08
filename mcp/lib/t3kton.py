import logging

from django.conf import settings

from cinp.client import CInP, NotFound, InvalidSession

CONTRACTOR_API_VERSION = '1.0'


def getContractor():
  return Contractor( settings.CONTRACTOR_HOST, settings.CONTRACTOR_PROXY, settings.CONTRACTOR_USERNAME, settings.CONTRACTOR_PASSWORD )


class Contractor():
  def relogin( func ):
    async def wrapper( self, *args, **kwargs ):
      try:
        return await func( self, *args, **kwargs )
      except InvalidSession:
        logging.debug( 'contractor: got invalid session, re-logging in and re-trying' )
        await self.logout()
        await self.login()
        return await func( self, *args, **kwargs )

    return wrapper

  def __init__( self, host, proxy, username, password ):
    super().__init__()
    self.host = host
    self.proxy = proxy
    self.username = username
    self.password = password

    self.cinp = None
    self.token = None

  async def __aenter__( self ):
    self.cinp = await CInP( host=self.host, root_path='/api/v1/', proxy=self.proxy ).__aenter__()

    root, _ = await self.cinp.describe( '/api/v1/', retry_count=30 )  # be very tollerant for the initial describe, let things settle
    if root[ 'api-version' ] != CONTRACTOR_API_VERSION:
      raise Exception( 'Expected API version "{0}" found "{1}"'.format( CONTRACTOR_API_VERSION, root[ 'api-version' ] ) )

    await self.login()
    return self

  async def __aexit__( self, exc_type, exc, tb ):
    await self.logout()
    await self.cinp.__aexit__( exc_type, exc, tb )
    self.cinp = None

  async def login( self ):
    self.token = await self.cinp.call( '/api/v1/Auth/User(login)', { 'username': self.username, 'password': self.password }, retry_count=10 )
    self.cinp.setAuth( self.username, self.token )

  async def logout( self ):
    try:
      await self.cinp.call( '/api/v1/Auth/User(logout)', { 'token': self.token }, retry_count=10  )
    except InvalidSession:
      pass
    self.cinp.setAuth()
    self.token = None

  async def allocateDynamicResource( self, site_id, complex_id, blueprint_id, config_values, interface_map, hostname ):
    complex_uri = '/api/v1/Building/Complex:{0}:'.format( complex_id )
    foundation = None
    structure = None
    try:
      interface_map_list = [ { 'name': name, 'network_id': interface[ 'network_id' ] } for name, interface in interface_map.items() ]
      foundation = self.cinp.call( '{0}(createFoundation)'.format( complex_uri ), { 'hostname': hostname, 'interface_map_list': interface_map_list, 'site': '/api/v1/Site/Site:{0}:'.format( site_id ) } )

      data = {}
      data[ 'site' ] = '/api/v1/Site/Site:{0}:'.format( site_id )
      data[ 'foundation' ] = '/api/v1/Building/Foundation:{0}:'.format( self.cinp.uri.extractIds( foundation )[0] )
      data[ 'hostname' ] = hostname
      data[ 'blueprint' ] = '/api/v1/BluePrint/StructureBluePrint:{0}:'.format( blueprint_id )
      data[ 'config_values' ] = config_values
      structure = self.cinp.create( '/api/v1/Building/Structure', data )[0]

      for name, interface in interface_map.items():
        data = {}
        data[ 'networked' ] = structure.replace( '/Building/Structure:', '/Utilities/Networked:' )
        data[ 'interface_name' ] = name
        data[ 'is_primary' ] = interface[ 'is_primary' ]

        offset = interface.get( 'offset', None )

        if offset is not None:
          data[ 'offset' ] = offset
          data[ 'address_block' ] = '/api/v1/Utilities/AddressBlock:{0}:'.format( interface[ 'address_block_id' ] )
          self.cinp.create( '/api/v1/Utilities/Address', data )
        else:
          self.cinp.call( '/api/v1/Utilities/AddressBlock:{0}:(nextAddress)'.format( interface[ 'address_block_id' ] ), data )

    except Exception as e:
      if structure is not None:
        self.cinp.delete( structure, retry_count=10 )

      if foundation is not None:
        self.cinp.delete( foundation, retry_count=10 )

      raise e

    return ( self.cinp.uri.extractIds( foundation )[0], self.cinp.uri.extractIds( structure )[0] )

  async def buildDynamicResource( self, foundation_id, structure_id=None ):
    await self.createFoundation( foundation_id )
    if structure_id is not None:
      await self.createStructure( structure_id )

  async def releaseDynamicResource( self, foundation_id, structure_id ):
    structure = None
    try:
      structure = await self.cinp.get( '/api/v1/Building/Structure:{0}:'.format( structure_id ), retry_count=10 )
    except NotFound:
      pass

    if structure is not None:
      if structure[ 'state' ] == 'built':
        await self.destroyStructure( structure_id )
      else:
        self.deleteStructure( structure_id )
        # return False ?

    # TODO: this needs some thinking.... for the edge cases with the webhook and all
    # need to look for jobs, if they exist, wait? stop the job?  also.... what happens when we
    # pick up a pre-alloc that is still building.  There is also some logic the "release" methods in other places
    # that need re-thinking to match

    # should we throw messages up to `self.resource_instance.release()` in Processor/models.py to skip and come back arround?

    # post a message some where so someone knows we are failing to cleanup

    # deleteStructure can throw `cinp.client.DetailedInvalidRequest: Not Deletable`

    foundation = None
    try:
      foundation = await self.cinp.get( '/api/v1/Building/Foundation:{0}:'.format( foundation_id ), retry_count=10 )
    except NotFound:
      pass  # return False?

    if foundation is not None:
      if foundation[ 'state' ] == 'built':
        await self.destroyFoundation( foundation_id )
      else:
        await self.deleteFoundation( foundation_id )
        # return False ?

    return True

  async def deleteDynamicResource( self, foundation_id, structure_id ):
    try:
       await self.deleteStructure( structure_id )
    except NotFound:
      pass

    try:
      await self.deleteFoundation( foundation_id )
    except NotFound:
      pass

  async def getFullConfig( self, structure_id ):
    return await self.cinp.call( '/api/v1/Building/Structure:{0}:(getConfig)'.format( structure_id ), {}, retry_count=10 )

  async def updateConfig( self, structure_id, config_values, hostname ):
    data = {}
    data[ 'config_values' ] = config_values
    data[ 'hostname' ] = hostname
    await self.cinp.update( '/api/v1/Building/Structure:{0}:'.format( structure_id ), data, retry_count=10 )

  async def allocateStaticResource( self, structure_id, blueprint_id, config_values, hostname ):
    data = {}
    data[ 'blueprint' ] = '/api/v1/Blueprint/StructureBlueprint:{0}'.format( blueprint_id )
    data[ 'config_values' ] = config_values
    data[ 'hostname' ] = hostname
    await self.cinp.update( '/api/v1/Building/Structure:{0}:'.format( structure_id ), data, retry_count=10 )

  async def buildStaticResource( self, structure_id ):
    await self.createStructure( structure_id )

  async def releaseStaticResource( self, structure_id ):
    await self.destroyStructure( structure_id )

  async def createFoundation( self, id ):
    await self.cinp.call( '/api/v1/Building/Foundation:{0}:(doCreate)'.format( id ), {}, retry_count=10 )

  async def createStructure( self, id ):
    await self.cinp.call( '/api/v1/Building/Structure:{0}:(doCreate)'.format( id ), {}, retry_count=10 )

  async def destroyFoundation( self, id ):
    await self.cinp.call( '/api/v1/Building/Foundation:{0}:(doDestroy)'.format( id ), {}, retry_count=10 )

  async def destroyStructure( self, id ):
    await self.cinp.call( '/api/v1/Building/Structure:{0}:(doDestroy)'.format( id ), {}, retry_count=10 )

  async def deleteFoundation( self, id ):
    await self.cinp.delete( '/api/v1/Building/Foundation:{0}:'.format( id ), retry_count=10 )

  async def deleteStructure( self, id ):
    await self.cinp.delete( '/api/v1/Building/Structure:{0}:'.format( id ), retry_count=10 )

  async def registerWebHook( self, instance, on_build, foundation_id=None, structure_id=None ):
    data = {}
    data[ 'one_shot' ] = True
    data[ 'extra_data' ] = { 'cookie': instance.cookie }
    data[ 'type' ] = 'call'

    box_url = None
    if foundation_id is not None:
      data[ 'foundation' ] = '/api/v1/Building/Foundation:{0}:'.format( foundation_id )
      box_url = '/api/v1/PostOffice/FoundationBox'

    elif structure_id is not None:
      data[ 'structure' ] = '/api/v1/Building/Structure:{0}:'.format( structure_id )
      box_url = '/api/v1/PostOffice/StructureBox'

    else:
      raise Exception( 'structure or foundation must be specified' )

    if on_build:
      data[ 'url' ] = '{0}/api/v1/Processor/BuildJobResourceInstance:{1}:(signalBuilt)'.format( settings.MCP_HOST, instance.pk )
    else:
      data[ 'url' ] = '{0}/api/v1/Processor/BuildJobResourceInstance:{1}:(signalDestroyed)'.format( settings.MCP_HOST, instance.pk )

    await self.cinp.create( box_url, data )

  async def getNetworkUsage( self, id ):
    return await self.cinp.call( '/api/v1/Utilities/AddressBlock:{0}:(usage)'.format( id ), {}, retry_count=10 )

  async def getBluePrint( self, id ):
    return await self.cinp.get( '/api/v1/BluePrint/StructureBluePrint:{0}:'.format( id ), retry_count=10 )

  # used by manageResources.py
  async def getSite( self, id ):
    return await self.cinp.get( '/api/v1/Site/Site:{0}:'.format( id ), retry_count=10 )

  async def getNetwork( self, id ):
    return await self.cinp.get( '/api/v1/Utilities/Network:{0}:'.format( id ), retry_count=10 )

  async def getAddressBlock( self, id ):
    return await self.cinp.get( '/api/v1/Utilities/AddressBlock:{0}:'.format( id ), retry_count=10 )

  async def getComplex( self, id ):
    return await self.cinp.get( '/api/v1/Building/Complex:{0}:'.format( id ), retry_count=10 )
