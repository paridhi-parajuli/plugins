// plugins/dataset-manager/src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DatasetManager } from './DatasetManager';

// Import Material UI's ThemeProvider and CssBaseline
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const pluginTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', 
    },
  },
});


export function DatasetManagerPanelComponent(): HTMLElement {
  const container = document.createElement('div');
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <ThemeProvider theme={pluginTheme}>
        <CssBaseline />
        <DatasetManager />
      </ThemeProvider>
    </React.StrictMode>
  );

  return container;
}