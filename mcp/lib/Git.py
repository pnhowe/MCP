from mcp.lib.SCM import SCM, SCMException


class GitException( SCMException ):
  pass


class Git( SCM ):
  def __init__( self, repo ):
    self.repo = repo

  def mergeToBranch( self, merge ):
    raise Exception( 'Merges not supported by generic git' )

  def mergeToRef( self, merge ):
    raise Exception( 'Merges not supported by generic git' )
