import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createEmbeddingContext } from 'amazon-quicksight-embedding-sdk';
import Card from '@ux/card';

const QuickSightEmbed = ({ dashboardId, dashboardUrl }) => {
  const dashboardRef = useRef(null);
  const [embeddedDashboard, setEmbeddedDashboard] = useState(null);
  const [embeddingContext, setEmbeddingContext] = useState(null);

  // Create embedding context only if not already created
  const createContext = useCallback(async () => {
 //   if (embeddingContext) return; // Avoid redundant calls

    try {
      const context = await createEmbeddingContext();
      setEmbeddingContext(context);
    } catch (error) {
      console.error('Error creating embedding context:', error);
    }
  }, [embeddingContext]);

  // Embed the QuickSight dashboard
  const embedDashboard = useCallback(async () => {
    if (!embeddingContext || !dashboardRef.current) return;

    const options = {
      url: dashboardUrl,
      container: dashboardRef.current,
      height: '800px',
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

  // Initialize embedding context only when dashboardUrl changes
  useEffect(() => {
    if (dashboardUrl && !embeddingContext) {
      createContext();
    }
  }, [dashboardUrl, createContext]);

  // Embed dashboard when embedding context is ready
  useEffect(() => {
    if (embeddingContext) {
      embedDashboard();
    }
  }, [embeddingContext, embedDashboard]); // Remove embeddedDashboard to prevent unnecessary re-renders

  // Navigate to dashboard when embedded dashboard instance is ready
  useEffect(() => {
    if (embeddedDashboard && dashboardId) {
      embeddedDashboard.navigateToDashboard(dashboardId, {});
    }
  }, [embeddedDashboard, dashboardId]);

  return (
    <Card stretch id={`${dashboardId}-card`} space={{ block: 'md', inline: 'md' }}>
      {dashboardUrl && 

        <div id={dashboardId} ref={dashboardRef}></div>
      
      }
    </Card>
  );
};

export default QuickSightEmbed;
