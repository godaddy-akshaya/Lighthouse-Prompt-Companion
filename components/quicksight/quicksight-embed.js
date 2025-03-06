import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';
import Box from '@ux/box';
import Card from '@ux/card';
import Text from '@ux/text';
import Spinner from '@ux/spinner';

const getEmbedUrl$ = async (id) => {
  const response = await fetch('/api/quicksight/embed?id=' + id);
  const data = await response.json();
  return data;
};

const QuickSightEmbed = ({ dashboardId }) => {
  const dashboardRef = useRef(null);
  const [embeddedDashboard, setEmbeddedDashboard] = useState(null);
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const [embeddingContext, setEmbeddingContext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create embedding context
  const createContext = async () => {
    try {
      const context = await createEmbeddingContext();
      setEmbeddingContext(context);
    } catch (error) {
      console.error('Error creating embedding context:', error);
    }
  };

  // Embed the QuickSight dashboard
  const embedDashboard = useCallback(async () => {
    if (!embeddingContext || !dashboardRef.current) return;

    const options = {
      url: dashboardUrl,
      container: dashboardRef.current,
      height: '15px',
      width: '100%'
    };

    const contentOptions = {
      locale: 'en-US',
      toolbarOptions: {
        export: false,
        undoRedo: false,
        reset: false
      },
      attributionOptions: {
        overlayContent: false
      }
    };

    try {
      const newEmbeddedDashboard = await embeddingContext.embedDashboard(options, contentOptions);
      setEmbeddedDashboard(newEmbeddedDashboard);
    } catch (error) {
      console.error('Error embedding dashboard:', error);
    }
  }, [embeddingContext, dashboardUrl]);

  // Initialize embedding context when dashboard URL changes
  useEffect(() => {
    if (dashboardUrl) {
      createContext();
    }
  }, [dashboardUrl]);

  // Embed dashboard when embedding context is ready
  useEffect(() => {
    if (embeddingContext) {
      embedDashboard();
    }
  }, [embeddingContext, embedDashboard, embeddedDashboard]);


    const fetchDashboardUrl = useCallback(async () => {
      setLoading(true);
      try {
        const data = await getEmbedUrl$(dashboardId);
        console.log('Dashboard URL:', data?.EmbedUrl);
        if (data?.EmbedUrl) {
          setDashboardUrl(data.EmbedUrl);
        } else {
          throw new Error('No dashboard URL found');
        }
      } catch (error) {
        console.error('Error fetching dashboard URL:', error);
        setError(error.message || 'Error fetching dashboard URL');
      } finally {
        setLoading(false);
      }
    }, [dashboardId]);
    
    useEffect(() => {
      if (dashboardId) {
        fetchDashboardUrl();
      }
    }, [dashboardId, fetchDashboardUrl]);  

  // Navigate to dashboard when embedded dashboard instance changes
  useEffect(() => {
    if (embeddedDashboard && dashboardId) {
      embeddedDashboard.navigateToDashboard(dashboardId, {});
    }
  }, [embeddedDashboard, dashboardId]);

  return (
    <Card stretch id={`${dashboardId}-card`} space={{ block: 'md', inline: 'md' }}>
      {error && <Box inlinePadding='sm' blockPadding='md'>
       <Text.label as='label' text={error} />
      </Box>}
      {loading && <Spinner size='sm' />}
      {dashboardUrl && 
      <Box>
        <div id={dashboardId} ref={dashboardRef}></div>
      </Box>
  }
    </Card>
  );
};

export default QuickSightEmbed;


