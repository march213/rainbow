import React, { Fragment } from 'react';
import './fonts.css';
import './global.css';

import { DesignSystemProvider } from '../../Context';
import { Box } from '../../components/Box/Box';

export default ({ children, themeName }) => (
  <DesignSystemProvider colorMode={themeName}>
    <div id="root">
      <Box background="body">
        {children}
      </Box>
    </div>
  </DesignSystemProvider>
);
