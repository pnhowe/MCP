import logging
import subprocess

MAKE_CMD = '/usr/bin/make'


class MakeException( Exception ):
  def __init__( self, msg=None, stderr=None ):
    self.msg = msg
    self.stderr = stderr

  def __str__( self ):
    if self.stderr:
      return '{0}: {1}'.format( self.msg, self.stderr )
    else:
      return self.msg


class Makefile():
  def __init__( self, dir, build_name ):
    self.dir = dir
    self.build_name = build_name

  def _execute( self, target, do_split=True ):
    logging.info( 'makefile: executing target "{0}"'.format( target ) )

    try:
      args = [ MAKE_CMD, 'BUILD_NAME={0}'.format( self.build_name ), 'MCP=1', '-s', '-C', self.dir, target ]
      logging.debug( 'makefile: executing "{0}"'.format( args ) )
      proc = subprocess.Popen( args, stdout=subprocess.PIPE, stderr=subprocess.PIPE )
      ( stdout, stderr ) = proc.communicate()
    except Exception as e:
      raise MakeException( 'Exception {0} while makeing target "{1}"'.format( e, target ) )

    stdout = stdout.decode()
    stderr = stderr.decode()
    logging.debug( 'make: rc: {0}'.format( proc.returncode ) )
    logging.debug( 'make: stderr:\n----------\n{0}\n---------\nstdout:\n----------\n{1}\n---------'.format( stderr, stdout ) )

    if proc.returncode == 2:
      if stderr.startswith( 'make: *** No rule to make target' ):
        return [], stderr

    if proc.returncode != 0:
      logging.error( 'make returned "{0}":\n{1}\n{2}'.format( proc.returncode, stderr, stdout ) )
      raise MakeException( 'make returned "{0}"'.format( proc.returncode ), stderr )

    result = []
    if do_split:
      for line in stdout.strip().splitlines():
        result += line.split()
    else:
      for line in stdout.strip().splitlines():
        result.append( line.strip() )

    return result, stderr

  def lint( self ):
    self._execute( '-n' )

  def version( self ):
    tmp, stderr = self._execute( 'version' )
    if not tmp:
      raise MakeException( 'Empty/Missing Version', stderr )

    return tmp[0]

  def autoBuilds( self ):
    return self._execute( 'auto-builds' )[0]

  def manualBuilds( self ):
    return self._execute( 'manual-builds' )[0]

  def resources( self, build ):
    return self._execute( '{0}-resources'.format( build ), do_split=False )[0]

  def networks( self, build ):
    return self._execute( '{0}-networks'.format( build ), do_split=False )[0]

  def depends( self, build ):
    return self._execute( '{0}-depends'.format( build ), do_split=False )[0]

  def testBluePrints( self ):
    return self._execute( 'test-blueprints' )[0]

  def docBluePrints( self ):
    return self._execute( 'doc-blueprints' )[0]

  def packageBluePrints( self, type ):  # type in dpkg, rpm, respkg, resource
    return self._execute( '{0}-blueprints'.format( type ) )[0]
