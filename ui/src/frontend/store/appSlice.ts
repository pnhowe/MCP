import { createSlice } from '@reduxjs/toolkit';

interface AppState {
  authenticated: boolean;
}

const appSlice = createSlice( {
  name: 'app',
  initialState: { authenticated: false } as AppState,
  reducers: {
    setAuthenticated: ( state, action ) => { state.authenticated = action.payload; },
  },
} );

export const { setAuthenticated } = appSlice.actions;
export default appSlice.reducer;
