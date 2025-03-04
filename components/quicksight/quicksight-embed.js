import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';
import Box from '@ux/box';
import Card from '@ux/card';

const QuickSightEmbed = ({ dashboardUrl, dashboardId }) => {
  const dashboardRef = useRef(null);
  const [embeddedDashboard, setEmbeddedDashboard] = useState(null);
  const [embeddingContext, setEmbeddingContext] = useState(null);

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
      height: '750px',
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
  }, [embeddingContext, embedDashboard]);

  // Navigate to dashboard when embedded dashboard instance changes
  useEffect(() => {
    if (embeddedDashboard && dashboardId) {
      embeddedDashboard.navigateToDashboard(dashboardId, {});
    }
  }, [embeddedDashboard, dashboardId]);

  return (
    <Card stretch id='test-2' space={{ block: 'md', inline: 'md' }}>
      <Box>
        <div id='dashboard-container' ref={dashboardRef}></div>
      </Box>
    </Card>
  );
};

export default QuickSightEmbed;


