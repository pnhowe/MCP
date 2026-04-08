import { createSlice, createAsyncThunk, AsyncThunkConfig } from '@reduxjs/toolkit';
import type { AsyncThunk } from '@reduxjs/toolkit';
import type { MCP } from '../lib/MCP';

export function createAuthThunk<Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: ( arg: ThunkArg, mcp: MCP ) => Promise<Returned>
)
{
  return createAsyncThunk<Returned, ThunkArg, { extra: MCP }>(
    typePrefix,
    ( arg, thunkAPI ) => payloadCreator( arg, thunkAPI.extra ),
    {
      condition: ( _arg, { getState }: { getState: () => any } ) =>
        ( getState() as any ).app.authenticated as boolean,
    }
  );
}


interface DetailListState<L, D> {
  list: L[] | null;
  detail: D | null;
  loading: boolean;
  error: string | null;
}

export function createDetailListSlice<L, D>( config: {
  name: string;
  fetchList: AsyncThunk<L[], void | string, AsyncThunkConfig>;
  fetchOne: AsyncThunk<D, string, AsyncThunkConfig>;
} )
{
  return createSlice( {
    name: config.name,
    initialState: { list: null, detail: null, loading: false, error: null } as DetailListState<L, D>,
    reducers: {
      invalidate: ( state ) => { state.list = null; state.detail = null; },
    },
    extraReducers: ( builder ) =>
    {
      builder
        .addCase( config.fetchList.pending, ( state ) => { state.loading = true; state.error = null; } )
        .addCase( config.fetchList.fulfilled, ( state, action ) => { state.loading = false; state.list = action.payload as any; } )
        .addCase( config.fetchList.rejected, ( state, action ) => { state.loading = false; state.error = ( action.error as any ).message ?? 'Error loading data'; } )
        .addCase( config.fetchOne.pending, ( state ) => { state.loading = true; state.error = null; } )
        .addCase( config.fetchOne.fulfilled, ( state, action ) => { state.loading = false; state.detail = action.payload as any; } )
        .addCase( config.fetchOne.rejected, ( state, action ) => { state.loading = false; state.error = ( action.error as any ).message ?? 'Error loading data'; } );
    },
  } );
}
