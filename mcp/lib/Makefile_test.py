import pytest

from mcp.lib.Makefile import Makefile, MakeException


class FakeProc:
  def __init__( self, returncode, stdout, stderr ):
    self.returncode = returncode
    self.stdout = stdout.encode()
    self.stderr = stderr.encode()

  def communicate( self, stdin=None ):
    self.stdin = stdin
    return ( self.stdout, self.stderr )

  def returncode( self ):
    return self.returncode


def test_lint( mocker ):
  popen = mocker.patch( 'subprocess.Popen' )

  m = Makefile( 'testdir', 'test_build' )

  popen.return_value = FakeProc( 0, '', '' )
  m.lint()
  popen.assert_called_with( [ '/usr/bin/make', 'BUILD_NAME=test_build', 'MCP=1', '-s', '-C', 'testdir', '-n' ], stderr=-1, stdout=-1 )

  popen.return_value = FakeProc( 2, '', '' )
  with pytest.raises( MakeException ):
    m.lint()
  popen.assert_called_with( [ '/usr/bin/make', 'BUILD_NAME=test_build', 'MCP=1', '-s', '-C', 'testdir', '-n' ], stderr=-1, stdout=-1 )

  popen.return_value = FakeProc( 1, '', '' )
  with pytest.raises( MakeException ):
    m.lint()


def test_version( mocker ):
  popen = mocker.patch( 'subprocess.Popen' )

  m = Makefile( 'testdir', 'test_build' )

  popen.return_value = FakeProc( 0, '', '' )
  with pytest.raises( MakeException ):
    m.version()

  popen.return_value = FakeProc( 0, '2.0', '' )
  assert m.version() == '2.0'

  popen.return_value = FakeProc( 2, '', '' )
  with pytest.raises( MakeException ):
    m.version()

  popen.return_value = FakeProc( 1, '', '' )
  with pytest.raises( MakeException ):
    m.version()


def test_autoBuilds( mocker ):
  popen = mocker.patch( 'subprocess.Popen' )

  m = Makefile( 'testdir', 'test_build' )

  popen.return_value = FakeProc( 0, '', '' )
  assert m.autoBuilds() == []

  popen.return_value = FakeProc( 0, 'testa', '' )
  assert m.autoBuilds() == [ 'testa' ]

  popen.return_value = FakeProc( 0, 'testa testb', '' )
  assert m.autoBuilds() == [ 'testa', 'testb' ]

  popen.return_value = FakeProc( 0, 'testa\ntestb', '' )
  assert m.autoBuilds() == [ 'testa', 'testb' ]

  popen.return_value = FakeProc( 0, 'testa testb\ntestc testd', '' )
  assert m.autoBuilds() == [ 'testa', 'testb', 'testc', 'testd' ]

  popen.return_value = FakeProc( 1, '', '' )
  with pytest.raises( MakeException ):
    m.autoBuilds()
