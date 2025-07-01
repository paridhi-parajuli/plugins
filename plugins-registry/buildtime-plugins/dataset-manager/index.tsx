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

type Dataset = {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  url: string;
};

type DatasetManagerConfig = {
  datasets: Dataset[];
};

export function DatasetManagerPanelComponent(config: DatasetManagerConfig): HTMLElement {
  const container = document.createElement('div');
  const root = createRoot(container);
  console.log(config)
  root.render(
    <React.StrictMode>
      <ThemeProvider theme={pluginTheme}>
        <CssBaseline />
        <DatasetManager datasets={config.datasets || []}/>
      </ThemeProvider>
    </React.StrictMode>
  );

  return container;
}