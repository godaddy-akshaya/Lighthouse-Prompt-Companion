import React, { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import Box from '@ux/box';
import Text from '@ux/text';  
import Spinner from '@ux/spinner';
import Head from '../../components/head';
import QuickSightEmbed from '../../components/quicksight/quicksight-embed'; 
import { BannerMessage } from '../../components/banner-message';

const getEmbedUrl$ = async (id) => {
  const response = await fetch('/api/quicksight/embed?id=' + id);
  const data = await response.json();
  return data;
};

const InsightsPage = () => {
  const [error, setError] = useState(null);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const { dashboardId } = router.query;
  const { title } = router.query;
 
  const fetchDashboardUrl = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEmbedUrl$(dashboardId);
      if (data?.EmbedUrl) {
        setDashboardUrl(data.EmbedUrl);
      } else {
        throw new Error('No dashboard found');
      }
    } catch (error) {
      console.error('Error fetching dashboard URL:', error);
      setError(error.message || 'Error fetching dashboard URL');
    } finally {
      setIsLoading(false);
    }});
    useEffect(() => {
      if (dashboardId) {
        fetchDashboardUrl();
      }
    }, [dashboardId]);
  return (
    <>
      <Head title="Lighthouse Insights" description="GD Lighthouse Reporting" route="insights" />
      <Text.h1 text='QuickSight Reporting' as='heading' />
        <Box orientation="vertical" gap="md">
           {error && <Box gap='md' inlinePadding='sm' blockPadding='md'>
                <BannerMessage showMessage={true} message={error} userMessageType="error" handleCloseError={() => setError(null)} />
            </Box> 
          }     
          {title && <Text.h3 text={title} as='title' />} 
          {isLoading && <Spinner size='lg' />}
          <Box stretch>
            {dashboardId && dashboardUrl &&
              <QuickSightEmbed dashboardId={dashboardId} dashboardUrl={dashboardUrl} />
              }                  
            </Box>
      </Box>
    </>
  );
};

export default InsightsPage;
