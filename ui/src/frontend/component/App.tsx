import React from 'react';
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
import { BrowserRouter as Router, Route, Link as RouterLink } from 'react-router-dom';
import { mcp, store } from '../store';
import { setAuthenticated } from '../store/appSlice';
import { invalidateProjects } from '../store/projectsSlice';
import { invalidateCommits } from '../store/commitsSlice';
import { invalidateBuildJobs } from '../store/buildJobsSlice';
import { invalidateQueueItems } from '../store/queueItemsSlice';
import { invalidateBuilds } from '../store/buildsSlice';
import { invalidatePromotions } from '../store/promotionsSlice';
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

interface AppState {
  loginVisible: boolean;
  username: string;
  password: string;
  leftDrawerVisible: boolean;
  autoUpdate: boolean;
  loggedInUser: string | null;
  logoutMenuAnchor: HTMLElement | null;
}

class App extends React.Component<{}, AppState>
{
  state: AppState = {
    loginVisible: false,
    username: '',
    password: '',
    leftDrawerVisible: true,
    autoUpdate: false,
    loggedInUser: null,
    logoutMenuAnchor: null,
  };

  timerID: any;
  serverErrorRef: React.RefObject<ServerError>;

  constructor( props: {} )
  {
    super( props );
    this.serverErrorRef = React.createRef();
  }

  menuClick = () =>
  {
    this.setState( { leftDrawerVisible: !this.state.leftDrawerVisible } );
  };

  showLogin = () =>
  {
    this.setState( { loginVisible: true } );
  };

  closeLogin = () =>
  {
    this.setState( { loginVisible: false } );
  };

  doLogin = () =>
  {
    mcp.Auth_User_call_login( this.state.username, this.state.password )
      .then( ( token: string ) =>
        {
          mcp.setHeader( 'Auth-Id', this.state.username );
          mcp.setHeader( 'Auth-Token', token );
          localStorage.setItem( 'auth-id', this.state.username );
          localStorage.setItem( 'auth-token', token );
          store.dispatch( setAuthenticated( true ) );
          this.setState( { loginVisible: false, password: '', loggedInUser: this.state.username } );
          this.doUpdate();
        },
        ( err: any ) =>
        {
          alert( 'Error logging in: "' + ( err?.msg ?? err ) + '"' );
        } );
  };

  doUpdate = () =>
  {
    store.dispatch( invalidateProjects() );
    store.dispatch( invalidateCommits() );
    store.dispatch( invalidateBuildJobs() );
    store.dispatch( invalidateQueueItems() );
    store.dispatch( invalidateBuilds() );
    store.dispatch( invalidatePromotions() );
  };

  toggleAutoUpdate = () =>
  {
    const state = !this.state.autoUpdate;
    if ( state )
    {
      this.timerID = setInterval( () => this.doUpdate(), 30000 );
    }
    else
    {
      clearInterval( this.timerID );
    }
    this.setState( { autoUpdate: state } );
  };

  showLogoutMenu = ( e: React.MouseEvent<HTMLElement> ) =>
  {
    this.setState( { logoutMenuAnchor: e.currentTarget } );
  };

  closeLogoutMenu = () =>
  {
    this.setState( { logoutMenuAnchor: null } );
  };

  doLogout = () =>
  {
    clearInterval( this.timerID );
    mcp.Auth_User_call_logout().catch( () => {} );
    mcp.clearHeader( 'Auth-Id' );
    mcp.clearHeader( 'Auth-Token' );
    localStorage.removeItem( 'auth-id' );
    localStorage.removeItem( 'auth-token' );
    store.dispatch( setAuthenticated( false ) );
    this.setState( { loggedInUser: null, logoutMenuAnchor: null, autoUpdate: false } );
    this.doUpdate();
  };

  componentDidMount()
  {
    mcp.setServerErrorHandler( ( msg, trace ) =>
    {
      this.serverErrorRef.current?.show( msg, trace );
    } );
    const savedId = localStorage.getItem( 'auth-id' );
    const savedToken = localStorage.getItem( 'auth-token' );
    if ( savedId && savedToken )
    {
      mcp.setHeader( 'Auth-Id', savedId );
      mcp.setHeader( 'Auth-Token', savedToken );
      store.dispatch( setAuthenticated( true ) );
      this.setState( { loggedInUser: savedId } );
    }
  }

  componentWillUnmount()
  {
    clearInterval( this.timerID );
  }

  render()
  {
    return (
<Router>
  <Box sx={{ display: 'flex' }}>
    <CssBaseline />
    <ServerError ref={ this.serverErrorRef } />

    <Dialog open={ this.state.loginVisible } onClose={ this.closeLogin }>
      <DialogTitle>Login</DialogTitle>
      <DialogContent>
        <TextField
          type="text"
          label="Username"
          name="username"
          value={ this.state.username }
          onChange={ (e) => this.setState( { username: e.target.value } ) }
          fullWidth
          margin="dense"
        />
        <TextField
          type="password"
          label="Password"
          name="password"
          value={ this.state.password }
          onChange={ (e) => this.setState( { password: e.target.value } ) }
          fullWidth
          margin="dense"
          onKeyDown={ (e) => e.key === 'Enter' && this.doLogin() }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={ this.closeLogin }>Close</Button>
        <Button onClick={ this.doLogin } variant="contained">Login</Button>
      </DialogActions>
    </Dialog>

    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={ this.menuClick } sx={{ mr: 1 }}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ mr: 2 }}>MCP</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton color={ this.state.autoUpdate ? 'secondary' : 'inherit' } onClick={ this.toggleAutoUpdate } title="Auto Update">
          <UpdateIcon />
        </IconButton>
        <IconButton color="inherit" onClick={ this.doUpdate } title="Refresh">
          <SyncIcon />
        </IconButton>
        { this.state.loggedInUser
          ? <>
              <Button
                color="inherit"
                onClick={ this.showLogoutMenu }
                startIcon={ <AccountCircleIcon /> }
              >
                { this.state.loggedInUser }
              </Button>
              <Menu
                anchorEl={ this.state.logoutMenuAnchor }
                open={ Boolean( this.state.logoutMenuAnchor ) }
                onClose={ this.closeLogoutMenu }
              >
                <MenuItem onClick={ this.doLogout }>Logout</MenuItem>
              </Menu>
            </>
          : <IconButton color="inherit" onClick={ this.showLogin } title="Login">
              <AccountCircleIcon />
            </IconButton>
        }
      </Toolbar>
    </AppBar>

    <Drawer
      variant="persistent"
      open={ this.state.leftDrawerVisible }
      sx={{
        width: this.state.leftDrawerVisible ? DRAWER_WIDTH : 0,
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
      <Route exact={ true } path="/" component={ Home } />
      <Route exact={ true } path="/projects" render={ () => <Project /> } />
      <Route path="/project/:id" render={ ( { match } ) => <Project id={ match.params.id } /> } />
      <Route exact={ true } path="/global" component={ GlobalView } />
      <Route exact={ true } path="/help" render={ () => (
        <Box>
          <Typography variant="h5" gutterBottom>Help</Typography>
          <Typography variant="body1">MCP — build and test orchestration system.</Typography>
        </Box>
      ) } />
    </Box>
  </Box>
</Router>
    );
  }
}

export default App;
