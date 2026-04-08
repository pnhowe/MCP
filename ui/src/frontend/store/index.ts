import { configureStore } from '@reduxjs/toolkit';
import { MCP } from '../lib/MCP';
import appReducer from './appSlice';
import projectsReducer from './projectsSlice';
import commitsReducer from './commitsSlice';
import buildJobsReducer from './buildJobsSlice';
import queueItemsReducer from './queueItemsSlice';
import buildsReducer from './buildsSlice';
import promotionsReducer from './promotionsSlice';

declare global {
  interface Window { API_BASE_URI: string; }
}

export const mcp = new MCP( window.API_BASE_URI );

export const store = configureStore( {
  reducer: {
    app: appReducer,
    projects: projectsReducer,
    commits: commitsReducer,
    buildJobs: buildJobsReducer,
    queueItems: queueItemsReducer,
    builds: buildsReducer,
    promotions: promotionsReducer,
  },
  middleware: ( getDefaultMiddleware ) =>
    getDefaultMiddleware( {
      thunk: { extraArgument: mcp },
      serializableCheck: false,
    } ),
} );

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
