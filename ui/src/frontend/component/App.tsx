import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  AppBar, Box, Button, CssBaseline, Dialog, DialogActions,
  DialogContent, DialogTitle, Drawer, IconButton, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, TextField, Toolbar, Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import PublicIcon from '@mui/icons-material/Public';
import HelpIcon from '@mui/icons-material/Help';
import SyncIcon from '@mui/icons-material/Sync';
import UpdateIcon from '@mui/icons-material/Update';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { BrowserRouter as Router, Routes, Route, Link as RouterLink, useParams } from 'react-router-dom';
import { mcp, store } from '../store';
import type { AppDispatch } from '../store';
import { setAuthenticated, showServerError, invalidateAll } from '../store/appSlice';
import Home from './Home';
import Project from './Project';
import GlobalView from './GlobalView';
import ServerError from './ServerError';

const DRAWER_WIDTH = 220;

const navItems = [
  { to: '/', icon: <HomeIcon />, label: 'Home' },
  { to: '/projects', icon: <FolderIcon />, label: 'Projects' },
  { to: '/global', icon: <PublicIcon />, label: 'Global' },
  { to: '/help', icon: <HelpIcon />, label: 'Help' },
];

function DetailRoute( { Comp, ...extraProps }: { Comp: React.ElementType; [key: string]: unknown } )
{
  const { id } = useParams<{ id: string }>();
  return <Comp id={ id } { ...extraProps } />;
}

const App: React.FC = () =>
{
  const dispatch = useDispatch<AppDispatch>();
  const [loginVisible, setLoginVisible] = useState( false );
  const [username, setUsername] = useState( '' );
  const [password, setPassword] = useState( '' );
  const [leftDrawerVisible, setLeftDrawerVisible] = useState( true );
  const [autoUpdate, setAutoUpdate] = useState( false );
  const [loggedInUser, setLoggedInUser] = useState<string | null>( null );
  const [logoutMenuAnchor, setLogoutMenuAnchor] = useState<HTMLElement | null>( null );
  const timerRef = useRef<any>( null );

  useEffect( () =>
  {
    mcp.setServerErrorHandler( ( msg, trace ) =>
    {
      store.dispatch( showServerError( { msg, trace } ) );
    } );
    const savedId = localStorage.getItem( 'auth-id' );
    const savedToken = localStorage.getItem( 'auth-token' );
    if ( savedId && savedToken )
    {
      mcp.setHeader( 'Auth-Id', savedId );
      mcp.setHeader( 'Auth-Token', savedToken );
      dispatch( setAuthenticated( true ) );
      setLoggedInUser( savedId );
    }
    return () => { clearInterval( timerRef.current ); };
  }, [] ); // eslint-disable-line react-hooks/exhaustive-deps

  const doUpdate = () => { dispatch( invalidateAll() ); };

  const doLogin = () =>
  {
    mcp.Auth_User_call_login( username, password )
      .then( ( token: string ) =>
        {
          mcp.setHeader( 'Auth-Id', username );
          mcp.setHeader( 'Auth-Token', token );
          localStorage.setItem( 'auth-id', username );
          localStorage.setItem( 'auth-token', token );
          dispatch( setAuthenticated( true ) );
          setLoginVisible( false );
          setPassword( '' );
          setLoggedInUser( username );
          doUpdate();
        },
        ( err: any ) =>
        {
          alert( 'Error logging in: "' + ( err?.msg ?? err ) + '"' );
        } );
  };

  const toggleAutoUpdate = () =>
  {
    const next = !autoUpdate;
    if ( next )
    {
      timerRef.current = setInterval( () => doUpdate(), 30000 );
    }
    else
    {
      clearInterval( timerRef.current );
    }
    setAutoUpdate( next );
  };

  const doLogout = () =>
  {
    clearInterval( timerRef.current );
    mcp.Auth_User_call_logout().catch( () => {} );
    mcp.clearHeader( 'Auth-Id' );
    mcp.clearHeader( 'Auth-Token' );
    localStorage.removeItem( 'auth-id' );
    localStorage.removeItem( 'auth-token' );
    dispatch( setAuthenticated( false ) );
    setLoggedInUser( null );
    setLogoutMenuAnchor( null );
    setAutoUpdate( false );
    doUpdate();
  };

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <ServerError />

        <Dialog open={ loginVisible } onClose={ () => setLoginVisible( false ) }>
          <DialogTitle>Login</DialogTitle>
          <DialogContent>
            <TextField
              type="text"
              label="Username"
              name="username"
              value={ username }
              onChange={ ( e ) => setUsername( e.target.value ) }
              fullWidth
              margin="dense"
            />
            <TextField
              type="password"
              label="Password"
              name="password"
              value={ password }
              onChange={ ( e ) => setPassword( e.target.value ) }
              fullWidth
              margin="dense"
              onKeyDown={ ( e ) => e.key === 'Enter' && doLogin() }
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={ () => setLoginVisible( false ) }>Close</Button>
            <Button onClick={ doLogin } variant="contained">Login</Button>
          </DialogActions>
        </Dialog>

        <AppBar position="fixed" sx={{ zIndex: ( theme ) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton color="inherit" edge="start" onClick={ () => setLeftDrawerVisible( !leftDrawerVisible ) } sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ mr: 2 }}>MCP</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton color={ autoUpdate ? 'secondary' : 'inherit' } onClick={ toggleAutoUpdate } title="Auto Update">
              <UpdateIcon />
            </IconButton>
            <IconButton color="inherit" onClick={ doUpdate } title="Refresh">
              <SyncIcon />
            </IconButton>
            { loggedInUser
              ? <>
                  <Button
                    color="inherit"
                    onClick={ ( e ) => setLogoutMenuAnchor( e.currentTarget ) }
                    startIcon={ <AccountCircleIcon /> }
                  >
                    { loggedInUser }
                  </Button>
                  <Menu
                    anchorEl={ logoutMenuAnchor }
                    open={ Boolean( logoutMenuAnchor ) }
                    onClose={ () => setLogoutMenuAnchor( null ) }
                  >
                    <MenuItem onClick={ doLogout }>Logout</MenuItem>
                  </Menu>
                </>
              : <IconButton color="inherit" onClick={ () => setLoginVisible( true ) } title="Login">
                  <AccountCircleIcon />
                </IconButton>
            }
          </Toolbar>
        </AppBar>

        <Drawer
          variant="persistent"
          open={ leftDrawerVisible }
          sx={{
            width: leftDrawerVisible ? DRAWER_WIDTH : 0,
            flexShrink: 0,
            transition: 'width 0.2s',
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          <Toolbar />
          <List dense>
            { navItems.map( ( item ) => (
              <ListItem key={ item.to } disablePadding>
                <ListItemButton component={ RouterLink } to={ item.to }>
                  <ListItemIcon>{ item.icon }</ListItemIcon>
                  <ListItemText primary={ item.label } />
                </ListItemButton>
              </ListItem>
            ) ) }
          </List>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: 2,
          }}
        >
          <Toolbar />
          <Routes>
            <Route path="/" element={ <Home /> } />
            <Route path="/projects" element={ <Project /> } />
            <Route path="/project/:id" element={ <DetailRoute Comp={ Project } /> } />
            <Route path="/global" element={ <GlobalView /> } />
            <Route path="/help" element={
              <Box>
                <Typography variant="h5" gutterBottom>Help</Typography>
                <Typography variant="body1">MCP — build and test orchestration system.</Typography>
              </Box>
            } />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

export default App;
