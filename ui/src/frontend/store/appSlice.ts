import { createSlice } from '@reduxjs/toolkit';

interface AppState {
  authenticated: boolean;
  serverError: { msg: string; trace: string } | null;
}

const appSlice = createSlice( {
  name: 'app',
  initialState: { authenticated: false, serverError: null } as AppState,
  reducers: {
    setAuthenticated: ( state, action ) => { state.authenticated = action.payload; },
    showServerError: ( state, action: { payload: { msg: string; trace: string } } ) => { state.serverError = action.payload; },
    clearServerError: ( state ) => { state.serverError = null; },
    invalidateAll: () => {},
  },
} );

export const { setAuthenticated, showServerError, clearServerError, invalidateAll } = appSlice.actions;
export default appSlice.reducer;
