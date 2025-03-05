import React, { useMemo,  useState } from 'react';
import Box from '@ux/box';
import Text from '@ux/text';  
import Head from '../../components/head';
import Card from '@ux/card';
import QuickSightEmbed from '../../components/quicksight/quicksight-embed';  // Fixed import path
import { BannerMessage } from '../../components/banner-message';


/* 
ec5da3b7-a5d8-4685-a334-6e14381daca9 -- Lighthouse Offer Dashboard
35ba3d06-ed89-499a-8d1b-5176205eee64 -- Contact Driver
e43656f2-ad59-454a-8825-5e7c0effb3ab - Intent Insights
*/

const QuickSightPage = () => {
  const [error, setError] = useState(null);
  const dashbaords= useMemo(() => [{
    name: 'Lighthouse Offer Dashboard',
    id: 'ec5da3b7-a5d8-4685-a334-6e14381daca9',
    description: 'A centralized hub for tracking and analyzing offer performance, the Lighthouse Offer Dashboard provides real-time insights into acceptance rates, customer engagement, and revenue impact. Designed for sales and marketing teams, it helps optimize offer strategies and improve conversion rates.'
  },{
    name: 'Contact Driver',
    id: '35ba3d06-ed89-499a-8d1b-5176205eee64',
    description: 'This dashboard streamlines driver communication by providing a comprehensive view of contact requests, response times, and resolution statuses. Fleet managers can monitor interactions and ensure seamless coordination between dispatch and drivers.'
  },{
    name: 'Intent Insights',
    id: 'e43656f2-ad59-454a-8825-5e7c0effb3ab',
    description: 'Unlock deeper customer behavior analytics with the Intent Insights dashboard, designed to track user engagement, purchasing signals, and conversion probabilities. Businesses can leverage this data to refine targeting strategies and improve customer acquisition efforts.'
  }]);

  return (
    <>
      <Head title="QuickSight" description="QuickSight Reporting GD Lighthouse" route="quicksight" />
      <Text.h1 text='QuickSight Reporting' as='heading' />
      {error && <Box gap='md' inlinePadding='sm' blockPadding='md'>
         <BannerMessage showMessage={true} message={error} userMessageType="error" handleCloseError={() => setError(null)} />
      </Box>} 
       {/* <Box gap='md' blockPadding='md' inlinePadding='md'> 
          <Box orientation="horizontal" gap="md">
              <SelectInput id='dashboard-select' label='Select Dashboard' options={dashbaords} onChange={(e) => setDashboardId(e)}>
              {dashbaords.map((d) => {
                return <option key={d.id} value={d.id}>{d.name}</option>;
              })}
            </SelectInput>
</Box>
          </Box> */}
        <Box orientation="vertical" gap="md">
          {dashbaords.map((d, i) => {
            return (
              <Box key={`${d}-${i}`} gap='sm' stretch inlinePadding='sm'>
              <Card key={d.id} className="quicksight-card" stretch space={{ inline: 'md', block: 'sm'}}>
                <Box stretch orientation='horizontal'>
                <Box>
                    <Text.h3 as='title' text={d.name} />
                    <Text.p as='paragraph' text={d.description} />
                  </Box>  
                  <Box stretch inlineAlignChildren='center' blockAlignChildren='center' >
                  <QuickSightEmbed dashboardId={d.id} />
                  </Box>
                </Box>
              </Card>
              </Box>
            );
          })}
        </Box>
    </>
  );
};

export default QuickSightPage;
