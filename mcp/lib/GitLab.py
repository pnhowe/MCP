import os
import logging

from gitlab import Gitlab
from gitlab.exceptions import GitlabAuthenticationError, GitlabGetError, GitlabCreateError

from mcp.lib.SCM import SCM, SCMException


class GitLabException( SCMException ):
  pass


class GitLab( SCM ):
  def __init__( self, host, proxy, private_token, project ):
    if proxy is not None:
      proxy_save = (  os.getenv( 'http_proxy' ), os.getenv( 'https_proxy' ) )
      os.environ[ 'http_proxy' ] = proxy
      os.environ[ 'https_proxy' ] = proxy
    else:
      proxy_save = None

    self.conn = Gitlab( host, private_token=private_token )

    self.conn.headers[ 'User-Agent' ] = 'MCP'

    try:
      self.conn.auth()
    except GitlabAuthenticationError:
      raise GitLabException( 'Unable to Login to gitlab' )

    if proxy_save is not None:
      os.environ[ 'http_proxy' ] = proxy_save[0]
      os.environ[ 'https_proxy' ] = proxy_save[1]

    self.project = project
    self._glProject = None

  @property
  def _project( self ):
    if self._glProject is not None:
      return self._glProject

    try:
      self._glProject = self.conn.projects.get( self.project )  # raises GitlabGetError
    except GitlabGetError:
      return None
    return self._glProject

  def _getCommit( self, commit_hash ):
    try:
      return self._project.commits.get( commit_hash )
    except GitlabGetError:
      return None

  def _getMergeRequest( self, id ):
    try:
      return self._project.mergerequests.get( id )
    except GitlabGetError:
      return None

  def postCommitComment( self, commit_hash, comment ):
    commit = self._getCommit( commit_hash )
    if commit is None:
      logging.warning( 'Unable get Commit "{0}" of project "{1}"'.format( commit_hash, self.project ) )
      return

    data = {}
    data[ 'note' ] = comment
    try:
      commit.comments.create( data )
    except GitlabCreateError as e:
      raise GitLabException( 'Error creating commit comment: "{0}"'.format( e ) )

  def postCommitStatus( self, commit_hash, branch, state, description=None, coverage=None, target_url=None ):
    if state == 'failure':
      state = 'failed'
    if state == 'error':
      state = 'canceled'

    if state not in ( 'pending', 'running', 'success', 'failed', 'canceled' ):
      raise GitLabException( 'Invalid state' )

    commit = self._getCommit( commit_hash )
    if commit is None:
      logging.warning( 'Unable get Commit "{0}" of project "{1}"'.format( commit_hash, self.project ) )

    # work arround for bug
    # https://gitlab.com/gitlab-org/gitlab/-/issues/16491
    mr = self._getMergeRequest( self.branchToMerge( branch ) )
    commit = self.conn.projects.get( mr.attributes[ 'source_project_id' ] ).commits.get( commit_hash )
    # end work arround
    #   the "normal" commit sould be the one above
    #   and remove branch from the paramater list

    data = {}
    data[ 'state' ] = state
    data[ 'context' ] = 'MCP Tests'
    if description is not None:
      data[ 'description' ] = description
    if coverage is not None:
      data[ 'coverage' ] = coverage
    if target_url is not None:
      data[ 'target_url' ] = target_url

    try:
      commit.statuses.create( data )
    except GitlabCreateError as e:
      raise GitLabException( 'Error creating commit status: "{0}"'.format( e ) )

  def postMergeComment( self, id, comment ):
    mr = self._getMergeRequest( id )
    if mr is None:
      logging.warning( 'Unable get MR "{0}" of group "{1}"'.format( id, self.project ) )
      return

    data = {}
    data[ 'body' ] = comment
    try:
      mr.notes.create( data )
    except GitlabCreateError as e:
      raise GitLabException( 'Error creating MR notes: "{0}"'.format( e ) )

  def getMergeList( self ):
    return [ i.get_id() for i in self._project.mergerequests.list( state='opened' ) if not i.attributes[ 'work_in_progress' ] ]

  def branchToMerge( self, branch_name ):
    if branch_name.startswith( '_MR' ):
      return int( branch_name[ 3: ] )

    return None

  def mergeToBranch( self, merge ):
    return '_MR{0}'.format( merge )

  def mergeToRef( self, merge ):
    return 'refs/merge-requests/{0}/head'.format( merge )
