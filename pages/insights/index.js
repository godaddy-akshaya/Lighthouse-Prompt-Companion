import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Box from '@ux/box';
import Text from '@ux/text';  
import Head from '../../components/head';
import QuickSightEmbed from '../../components/quicksight/quicksight-embed'; 
import { BannerMessage } from '../../components/banner-message';

const InsightsPage = () => {
  const [error, setError] = useState(null);
  const router = useRouter();
  const { dashboardId } = router.query;
  const { title } = router.query;

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
          <Box stretch>
            {dashboardId && 
              <QuickSightEmbed dashboardId={dashboardId} />
              }                  
            </Box>
      </Box>
    </>
  );
};

export default InsightsPage;
