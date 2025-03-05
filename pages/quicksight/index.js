import React, { useEffect, useState } from 'react';

import Box from '@ux/box';
import Text from '@ux/text';  // Capitalized
import Head from '../../components/head';
import Card from '@ux/card';
import Spinner from '@ux/spinner';
import SelectInput from '@ux/select-input';  
import QuickSightEmbed from '../../components/quicksight/quicksight-embed';  // Fixed import path
import { BannerMessage } from '../../components/banner-message';
const getEmbedUrl$ = async (id) => {
  const response = await fetch('/api/quicksight/embed?id=' + id);
  const data = await response.json();
  return data;
};

/* 
ec5da3b7-a5d8-4685-a334-6e14381daca9 -- Lighthouse Offer Dashboard
35ba3d06-ed89-499a-8d1b-5176205eee64 -- Contact Driver
e43656f2-ad59-454a-8825-5e7c0effb3ab - Intent Insights
*/

const QuickSightPage = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardId, setDashboardId] = useState();
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const [error, setError] = useState(null);
  const [dashbaords, setDashboards] = useState([{
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
  useEffect(() => {
    console.log('QuickSightPage mounted');
    const fetchDashboardUrl = async () => {
      setLoading(true);
      try {
        const data = await getEmbedUrl$(dashboardId); 
        console.log('Dashboard URL:', data?.EmbedUrl || '');
        if (data?.EmbedUrl) {
          setDashboardUrl(data?.EmbedUrl || '');
        } else {
          setError('No dashboard URL found');
        }
      } catch (error) {
        console.error('Error fetching dashboard URL:', error);
      } finally {
        setLoading(false);
      }
    };

    if (dashboardId) {
      fetchDashboardUrl();
    }
  }, [dashboardId]);  // Added dependency

  return (
    <>
      <Head title="QuickSight" description="QuickSight Reporting GD Lighthouse" route="search" />
      {error && <Box gap='md' inlinePadding='sm' blockPadding='md'>
         <BannerMessage showMessage={true} message={error} userMessageType="error" handleCloseError={() => setError(null)} />
      </Box>} 
       <Box gap='md' blockPadding='md' inlinePadding='md'> 
          <Box orientation="horizontal" gap="md">
              <SelectInput id='dashboard-select' label='Select Dashboard' options={dashbaords} onChange={(e) => setDashboardId(e)}>
              {dashbaords.map((d) => {
                return <option key={d.id} value={d.id}>{d.name}</option>;
              })}
            </SelectInput>
</Box>
          </Box>
        <Box orientation="vertical" gap="md">
          {dashbaords.map((d) => {
            return (
              <Box gap='sm' stretch inlinePadding='sm'>
              <Card key={d.id} className="quicksight-card" stretch space={{ inline: 'md', block: 'sm'}}>
                <Box stretch orientation='horizontal'>
                <Box>
                    <Text.h3 as='title' text={d.name} />
                    <Text.p as='paragraph' text={d.description} />
                  </Box>  
                  <Box stretch inlineAlignChildren='center' blockAlignChildren='center' >
                    <Text.label as='label' text='QS PLACEHOLDER' />
                  </Box>
                </Box>
              </Card>
              </Box>
            );
          })}
        </Box>
        <Card id="quicksight-card" className="quicksight-card">
          {loading && <Spinner size="lg" />}  {/* Fixed variable */}
          {dashboardId && dashboardUrl && (
            <QuickSightEmbed dashboardId={dashboardId} dashboardUrl={dashboardUrl} />
          )}
        </Card>
    </>
  );
};

export default QuickSightPage;
