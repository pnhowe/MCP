import { createAuthThunk, createDetailListSlice } from './sliceFactory';
import { Project_Commit, Project_Project } from '../lib/MCP';

export const fetchCommitList = createAuthThunk( 'commits/fetchList', async ( projectName: string | void, mcp ) =>
{
  let filter;
  if ( projectName )
  {
    filter = new Project_Commit._ListFilter_project( new Project_Project( mcp, projectName ) );
  }
  else
  {
    filter = new Project_Commit._ListFilter_in_process();
  }
  const result = await mcp.Project_Commit_get_multi( { filter } );
  return Object.values( result );
} );

export const fetchCommit = createAuthThunk( 'commits/fetchOne', async ( id: string, mcp ) =>
{
  return mcp.Project_Commit_get( parseInt( id ) );
} );

const commitsSlice = createDetailListSlice( {
  name: 'commits',
  fetchList: fetchCommitList,
  fetchOne: fetchCommit,
} );

export const { invalidate: invalidateCommits } = commitsSlice.actions;
export default commitsSlice.reducer;
