import React from 'react';
import {
  Card,
  Typography,
  Grid,
  Box,
  Chip
} from '@mui/material';

import {IconLayer} from '@deck.gl/layers';


const allAvailableDatasets = [
  {
    id: 'public.aqs_gases_metadata',
    name: 'AQS Stations',
    description: 'Air Quality System monitoring stations',
    type: 'feature',
    url: 'https://example.com/modis_chlorophyll.tif'
  },
  {
    id: 'dataset2',
    name: 'Another dataset',
    description: 'Description for another daraset',
    type: 'vector',
    url: 'https://example.com/argo_floats.geojson'
  },
  {
    id: 'omi-no2-2d',
    name: 'OMI-2D',
    description: 'Ozone Monitoring Instrument NO2 data',
    type: 'raster',
    url: '/path/to/thumbnail1.jpg'
  },
];

export function DatasetManager() {
  const allDatasets = allAvailableDatasets;
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'raster':
      return 'primary';
      case 'vector':
      return 'secondary';
      case 'point-cloud':
      return 'success';
      case 'netcdf':
      return 'error';
      default:
      return 'default';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'raster':
      return '🛰️';
      case 'vector':
      return '🗺️';
      case 'point-cloud':
      return '☁️';
      case 'netcdf':
      return '📈';
      default:
      return '📝';
    }
  };
  
  const getBackgroundColorForType = (type: string) => {
    switch (type) {
      case 'raster':
      return '#e3f2fd';
      case 'vector':
      return '#f3e5f5';
      case 'point-cloud':
      return '#e8f5e8';
      case 'netcdf':
      return '#ffe0b2';
      default:
      return '#fafafa';
    }
  };
  
  const handleCardClick = async (dataset) => {
    try {
      const AQS_DATA_URL = `https://dev.openveda.cloud/api/features/collections/${dataset.id}/items`;
      const response = await fetch(AQS_DATA_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      const processedData = jsonData.features.map((feature: any) => ({
        position: feature.geometry.coordinates,
        id: feature.id,
        name: feature.properties.local_site_name || feature.properties.city || 'Unknown Site',
        state: feature.properties.state,
        county: feature.properties.county,
        city: feature.properties.city,
        stationCode: feature.properties.station_code
      }));
      
      const iconLayer = new IconLayer({
        id: 'dynamic-icon-layer',
        data: processedData,
        iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
        iconMapping: {
          marker: { x: 0, y: 0, width: 128, height: 128, mask: true }
        },
        pickable: true,
        getIcon: () => 'marker',
        getSize: () => 10,
        getColor: [0, 150, 255, 200],
        getPosition: d => d.position,
        sizeScale: 2,
        getTooltip: ({ object }) =>
          object && `Site: ${object.name}\nCity: ${object.city || 'N/A'}\nCounty: ${object.county || 'N/A'}\nState: ${object.state || 'N/A'}`
      });
      window.eventBus.emit('dataset-clicked',iconLayer);
      
    } catch (err) {
      console.error('Error loading dataset:', err);
      alert('Failed to load dataset. Please try again later.');
    }
    
  }
  
  return (
    <Box sx={{ width: '100%', height: '100%', p: 2, overflowY: 'auto' }}>
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
    Datasets.....
    </Typography>
    
    <Grid container spacing={2}>
    {allDatasets.map((dataset) => (
      <Grid item xs={12} key={dataset.id}> 
      <Card
      onClick={() => handleCardClick(dataset)}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        width: '100%', 
        overflow: 'hidden',
      }}
      >
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        p: 1.5,
        flexGrow: 1,
        minHeight: 0,
      }}>
      <Box sx={{
        height: 50,
        width: 50,
        minWidth: 50,
        backgroundColor: getBackgroundColorForType(dataset.type),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        borderRadius: 1,
        mr: 1.5
      }}>
      {getTypeIcon(dataset.type)}
      </Box>
      
      <Box sx={{
        flexGrow: 1,
        minWidth: 0,
        overflow: 'hidden',
      }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 0.5,
        flexWrap: 'nowrap',
      }}>
      <Typography
      variant="subtitle1"
      component="h3"
      sx={{
        fontWeight: 600,
        lineHeight: 1.3,
        flexGrow: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      >
      {dataset.name}
      </Typography>
      <Chip
      label={dataset.type}
      size="small"
      color={getTypeColor(dataset.type)}
      sx={{ ml: 1, height: 20, fontSize: '0.6875rem', flexShrink: 0 }}
      />
      </Box>
      <Typography
      variant="body2"
      color="text.secondary"
      sx={{
        fontSize: '0.8rem',
        lineHeight: 1.2,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
      >
      {dataset.description}
      </Typography>
      </Box>
      </Box>
      </Card>
      </Grid>
    ))}
    </Grid>
    </Box>
  );
}