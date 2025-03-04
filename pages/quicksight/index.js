import React, { useEffect, useState } from 'react';

import Box from '@ux/box';
import Text from '@ux/text';  // Capitalized
import Head from '../../components/head';
import Card from '@ux/card';
import Spinner from '@ux/spinner';
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
  const [dashboardId, setDashboardId] = useState('ec5da3b7-a5d8-4685-a334-6e14381daca9');
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const [error, setError] = useState(null);

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
      <Box>
        <Text.h3 text="QuickSight" as="title" />
      </Box>
      <Box gap='md' blockPadding='md' inlinePadding='md'>
        {error && <BannerMessage showMessage={true} message={error} userMessageType="error" handleCloseError={() => setError(null)} />}
        <Card id="quicksight-card" className="quicksight-card">
          {loading && <Spinner size="lg" />}  {/* Fixed variable */}
          {dashboardId && dashboardUrl && (
            <QuickSightEmbed dashboardId={dashboardId} dashboardUrl={dashboardUrl} />
          )}
        </Card>
      </Box>
    </>
  );
};

export default QuickSightPage;
