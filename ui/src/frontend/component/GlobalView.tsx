import React from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import BuildJobList from './BuildJobList';
import QueueItemList from './QueueItemList';
import PromotionList from './PromotionList';
import CommitList from './CommitList';

interface LocalState {
  tab: number;
}

class GlobalView extends React.Component<{}, LocalState>
{
  state: LocalState = { tab: 0 };

  render()
  {
    return (
      <Box>
        <Typography variant="h5" gutterBottom>Global</Typography>
        <Tabs value={ this.state.tab } onChange={ ( _, v ) => this.setState( { tab: v } ) } sx={{ mb: 2 }}>
          <Tab label="Build Jobs" />
          <Tab label="Queue" />
          <Tab label="Promotions" />
          <Tab label="Commits (In Progress)" />
        </Tabs>
        { this.state.tab === 0 && <BuildJobList showProject /> }
        { this.state.tab === 1 && <QueueItemList /> }
        { this.state.tab === 2 && <PromotionList /> }
        { this.state.tab === 3 && <CommitList /> }
      </Box>
    );
  }
}

export default GlobalView;
