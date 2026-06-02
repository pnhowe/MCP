import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AsyncThunk } from '@reduxjs/toolkit';
import type { MCP } from '../lib/MCP';
import { invalidateAll } from './appSlice';

export function createAuthThunk<Returned, ThunkArg = void>(
  typePrefix: string,
  payloadCreator: ( arg: ThunkArg, mcp: MCP ) => Promise<Returned>
)
{
  return createAsyncThunk<Returned, ThunkArg, { extra: MCP }>(
    typePrefix,
    ( arg, thunkAPI ) => payloadCreator( arg, thunkAPI.extra ),
    {
      condition: ( _arg, { getState } ) =>
        ( getState() as { app: { authenticated: boolean } } ).app.authenticated,
    }
  );
}


interface DetailListState<L, D> {
  list: L[] | null;
  detail: D | null;
  loading: boolean;
  error: string | null;
}

type AuthThunk<T, A> = AsyncThunk<T, A, { extra: MCP }>;

export function createDetailListSlice<L, D>( config: {
  name: string;
  fetchList: AuthThunk<L[], any>;
  fetchOne: AuthThunk<D, any>;
} )
{
  return createSlice( {
    name: config.name,
    initialState: { list: null, detail: null, loading: false, error: null } as DetailListState<L, D>,
    reducers: {
      invalidate: ( state ) => { state.list = null; state.detail = null as D | null; },
    },
    extraReducers: ( builder ) =>
    {
      builder
        .addCase( config.fetchList.pending, ( state ) => { state.loading = true; state.error = null; } )
        .addCase( config.fetchList.fulfilled, ( state, action ) => { state.loading = false; state.list = action.payload; } )
        .addCase( config.fetchList.rejected, ( state, action ) => { state.loading = false; state.error = action.error?.message ?? 'Error loading data'; } )
        .addCase( config.fetchOne.pending, ( state ) => { state.loading = true; state.error = null; } )
        .addCase( config.fetchOne.fulfilled, ( state, action ) => { state.loading = false; state.detail = action.payload; } )
        .addCase( config.fetchOne.rejected, ( state, action ) => { state.loading = false; state.error = action.error?.message ?? 'Error loading data'; } )
        .addCase( invalidateAll, ( state ) => { state.list = null; state.detail = null as D | null; state.loading = false; state.error = null; } );
    },
  } );
}
