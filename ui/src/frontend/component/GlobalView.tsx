import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import BuildJobList from './BuildJobList';
import QueueItemList from './QueueItemList';
import PromotionList from './PromotionList';
import CommitList from './CommitList';

const GlobalView: React.FC = () =>
{
  const [tab, setTab] = useState( 0 );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Global</Typography>
      <Tabs value={ tab } onChange={ ( _, v ) => setTab( v ) } sx={{ mb: 2 }}>
        <Tab label="Build Jobs" />
        <Tab label="Queue" />
        <Tab label="Promotions" />
        <Tab label="Commits (In Progress)" />
      </Tabs>
      { tab === 0 && <BuildJobList showProject /> }
      { tab === 1 && <QueueItemList /> }
      { tab === 2 && <PromotionList /> }
      { tab === 3 && <CommitList /> }
    </Box>
  );
};

export default GlobalView;
