from django.conf import settings

from cinp import client

CONTRACTOR_API_VERSION = '0.9'


def getContractor():
  return Contractor( settings.CONTRACTOR_HOST, settings.CONTRACTOR_PROXY, settings.CONTRACTOR_USERNAME, settings.CONTRACTOR_PASSWORD )


class Contractor():
  def __init__( self, host, proxy, username, password ):
    super().__init__()
    self.username = username
    self.cinp = client.CInP( host, '/api/v1/', proxy )

    root = self.cinp.describe( '/api/v1/' )
    if root[ 'api-version' ] != CONTRACTOR_API_VERSION:
      raise Exception( 'Expected API version "{0}" found "{1}"'.format( CONTRACTOR_API_VERSION, root[ 'api-version' ] ) )

    self.token = self.cinp.call( '/api/v1/Auth/User(login)', { 'username': self.username, 'password': password } )
    self.cinp.setAuth( username, self.token )

  def logout( self ):
    self.cinp.call( '/api/v1/Auth/User(logout)', { 'token': self.token } )

  def allocateDynamicResource( self, complex_id, blueprint_id, config_values, interface_map, hostname ):
    complex_uri = '/api/v1/Building/Complex:{0}:'.format( complex_id )
    site_id = self.cinp.uri.extractIds( self.cinp.get( complex_uri )[ 'site' ] )[0]
    foundation = self.cinp.call( '{0}(createFoundation)'.format( complex_uri ), { 'hostname': hostname, 'interface_name_list': [] } )

    data = {}
    data[ 'site' ] = '/api/v1/Site/Site:{0}:'.format( site_id )
    data[ 'foundation' ] = '/api/v1/Building/Foundation:{0}:'.format( self.cinp.uri.extractIds( foundation )[0] )
    data[ 'hostname' ] = hostname
    data[ 'blueprint' ] = '/api/v1/BluePrint/StructureBluePrint:{0}:'.format( blueprint_id )
    data[ 'config_values' ] = config_values
    structure = self.cinp.create( '/api/v1/Building/Structure', data )[0]

    counter = 0
    for name, interface in interface_map.items():
      data = {}
      data[ 'foundation' ] = foundation
      data[ 'name' ] = name
      data[ 'physical_location' ] = 'eth{0}'.format( counter )
      data[ 'is_provisioning' ] = bool( counter == 0 )
      self.cinp.create( '/api/v1/Utilities/RealNetworkInterface', data )
      counter += 1

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

    return ( self.cinp.uri.extractIds( foundation )[0], self.cinp.uri.extractIds( structure )[0] )

  def buildDynamicResource( self, foundation_id, structure_id ):
    self.createStructure( foundation_id )
    self.createStructure( structure_id )

  def releaseDynamicResource( self, foundation_id, structure_id ):
    self.destroyStructure( structure_id )
    self.destroyFoundation( foundation_id )

  def deleteDynamicResource( self, foundation_id, structure_id ):
    self.deleteStructure( structure_id )
    self.deleteFoundation( foundation_id )

  def updateDynamicResource( self, structure_id, config_values, hostname ):
    data = {}
    data[ 'config_values' ] = config_values
    data[ 'hostname' ] = hostname
    self.cinp.update( '/api/v1/Building/Structure:{0}:'.format( structure_id ), data )

  def allocateStaticResource( self, structure_id, blueprint_id, config_values, hostname ):
    data = {}
    data[ 'blueprint' ] = '/api/v1/Blueprint/StructureBlueprint:{0}'.format( blueprint_id )
    data[ 'config_values' ] = config_values
    data[ 'hostname' ] = hostname
    self.cinp.update( '/api/v1/Building/Structure:{0}:'.format( structure_id ), data )

  def buildStaticResource( self, structure_id ):
    self.createStructure( structure_id )

  def releaseStaticResource( self, structure_id ):
    self.destroyStructure( structure_id )

  def createFoundation( self, id ):
    self.cinp.call( '/api/v1/Building/Foundation:{0}:(doCreate)'.format( id ), {} )

  def createStructure( self, id ):
    self.cinp.call( '/api/v1/Building/Structure:{0}:(doCreate)'.format( id ), {} )

  def destroyFoundation( self, id ):
    self.cinp.call( '/api/v1/Building/Foundation:{0}:(doDestroy)'.format( id ), {} )

  def destroyStructure( self, id ):
    self.cinp.call( '/api/v1/Building/Structure:{0}:(doDestroy)'.format( id ), {} )

  def deleteFoundation( self, id ):
    self.cinp.delete( '/api/v1/Building/Foundation:{0}:'.format( id ) )

  def deleteStructure( self, id ):
    self.cinp.delete( '/api/v1/Building/Structure:{0}:'.format( id ) )

  def registerWebHook( self, instance, on_build, foundation_id=None, structure_id=None ):
    data = {}
    data[ 'one_shot' ] = True
    data[ 'extra_data' ] = { 'cookie': instance.cookie }
    data[ 'type' ] = 'call'

    if foundation_id is not None:
      data[ 'foundation' ] = '/api/v1/Building/Foundation:{0}:'.format( foundation_id )
    elif structure_id is not None:
      data[ 'structure' ] = '/api/v1/Building/Structure:{0}:'.format( structure_id )
    else:
      raise Exception( 'structure or foundation must be specified' )

    if on_build:
      data[ 'url' ] = '{0}/api/v1/Processor/Instance:{1}:(isBuilt)'.format( settings.MCP_HOST, instance.pk )
      self.cinp.create( '/api/v1/PostOffice/StructureBox', data )
    else:
      data[ 'url' ] = '{0}/api/v1/Processor/Instance:{1}:(isDestroyed)'.format( settings.MCP_HOST, instance.pk )
      self.cinp.create( '/api/v1/PostOffice/FoundationBox', data )

  def getNetworkInfo( self, id ):
    block = self.cinp.get( '/api/v1/Utilities/AddressBlock:{0}'.format( id ) )

    return block

  def getNetworkUsage( self, id ):
    usage = self.cinp.call( '/api/v1/Utilities/AddressBlock:{0}:(usage)'.format( id ), {} )

    return usage
