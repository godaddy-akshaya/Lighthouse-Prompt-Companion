import React from 'react';
import Box from '@ux/box';

export const TwoColumnLayout = ({ children }) => {
  return (
    <Box orientation='horizontal' gap='lg' blockPadding='lg' inlinePadding='lg'>
      {children}
    </Box>
  );
};

export default TwoColumnLayout;

