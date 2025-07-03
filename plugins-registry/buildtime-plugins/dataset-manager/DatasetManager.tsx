// frontend/src/build-plugins/dataset-manager/DatasetManager.tsx

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
  Card,
  Typography,
  Grid,
  Box,
  Chip,
  IconButton,
  Slider,    // Part of detail view
  Popover,   // Part of detail view
  CardContent // Part of detail view
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete'; 
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import OpacityIcon from '@mui/icons-material/Opacity';

import { IconLayer, BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { Matrix4 } from '@math.gl/core';

import { eventBus } from '../../eventBus'; 


interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  type: string;
  url: string;
}

interface DeckGLLayer extends Layer {
  datasetId?: string;
  datasetMetadata?: Dataset;
  name?: string;
  type?: string;
  opacity?: number;
}

const allAvailableDatasets: Dataset[] = [
  {
    id: 'omi-no2-2d',
    name: 'OMI-2D',
    description: 'Ozone Monitoring Instrument NO2 data',
    category: 'satellite',
    type: 'raster',
    url: '/path/to/thumbnail1.jpg'
  },
  {
    id: 'TROPESS_reanalysis_mon_emi_nox_anth',
    name: 'TROPESS',
    description: 'TROPESS reanalysis NOx emissions',
    category: 'satellite',
    type: 'netcdf-2d',
    url: '/path/to/thumbnail3.jpg'
  },
  {
    id: 'public.aqs_gases_metadata',
    name: 'AQS Stations',
    description: 'Air Quality System monitoring stations',
    category: 'insitu',
    type: 'feature',
    url: '/path/to/thumbnail1.jpg'
  },
  {
    id: 'calipso-point-cloud',
    name: 'CALIPSO',
    description: 'CALIPSO lidar point cloud data',
    category: 'Lidar',
    type: 'point-cloud',
    url: 'https://rsig-point-cloud.s3.us-west-2.amazonaws.com/ept-tileset/tileset.json'
  }
];

interface ActiveLayerDisplayCardProps {
  layer: DeckGLLayer;
  onOpacityChange: (layerId: string, newOpacity: number) => void;
  onRemove: (layerId: string) => void;
}

const ActiveLayerDisplayCard: React.FC<ActiveLayerDisplayCardProps> = ({ layer, onOpacityChange, onRemove }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const initialOpacity = (layer.opacity !== undefined && layer.opacity !== null ? layer.opacity : 1.0) * 100;
  const [localOpacity, setLocalOpacity] = useState(initialOpacity);

  const handleOpacityClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); 
    setAnchorEl(event.currentTarget);
  }, []);

  const handleOpacityClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSliderChange = useCallback((event: Event, newValue: number | number[]) => {
    const newVal = Array.isArray(newValue) ? newValue[0] : newValue;
    setLocalOpacity(newVal);
    onOpacityChange(layer.id, newVal);
  }, [layer.id, onOpacityChange]);

  const open = Boolean(anchorEl);

  const getStaticLegend = useCallback((type: string) => {
    switch (type) {
      case 'raster':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Box sx={{ flex: 1, height: 12, background: 'linear-gradient(to right, #2c7bb6, #abd9e9, #ffffbf, #fdae61, #d7191c)', borderRadius: 1 }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Low to High</Typography>
          </Box>
        );
      case 'feature':
        return null;
      case 'point-cloud':
        const legendItems = [
          { color: 'red', label: '0 - 500' },
          { color: 'green', label: '500 - 10,000' },
          { color: 'yellow', label: '10,000 - 60,000' },
          { color: 'blue', label: '> 60,000' },
        ];
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 0.2 }}>
            {legendItems.map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.1 }}>
                <Box sx={{ width: 12, height: 12, backgroundColor: item.color, borderRadius: '2px' }} />
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>{item.label}</Typography>
              </Box>
            ))}
          </Box>
        );
      case 'netcdf-2d':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Box sx={{ flex: 1, height: 12, background: 'linear-gradient(to right, #FFFFFF, #B22222)', borderRadius: 1, border: '1px solid #ccc' }} />
            <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Low to High</Typography>
          </Box>
        );
      default: return null;
    }
  }, []);

  const layerDisplayName = layer.name ||
                           (layer.type === 'netcdf-2d' && layer.id && layer.id.includes('lev-') ?
                             `Level ${layer.id.split('lev-')[1].split('-')[0]}` :
                             layer.id);

  return (
    <Card key={layer.id} variant="outlined" sx={{ mb: 1, bgcolor: 'background.paper' }}>
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary', cursor: 'grab' }} />
          <Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 'medium' }}>
            {layerDisplayName}
          </Typography>
          <IconButton size="small" onClick={handleOpacityClick} sx={{ p: 0.5, color: 'text.secondary' }}>
            <OpacityIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', minWidth: '35px' }}>
            {localOpacity}%
          </Typography>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(layer.id);
            }}
            sx={{ p: 0.5, color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ width: '100%', mt: 0.5 }}>
          {getStaticLegend(layer.type || '')}
        </Box>

        <Popover
          open={open} anchorEl={anchorEl} onClose={handleOpacityClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Box sx={{ p: 2, width: 200 }}>
            <Typography variant="body2" gutterBottom>Opacity: {localOpacity}%</Typography>
            <Slider value={localOpacity} onChange={handleSliderChange} aria-labelledby="opacity-slider" min={0} max={100} size="small" />
          </Box>
        </Popover>
      </CardContent>
    </Card>
  );
};


export function DatasetManager({ datasets }: { datasets: Dataset[] }) {
  if (!datasets) { return null; }
  const allDatasets = datasets;

  const [activeLayers, setActiveLayers] = useState<DeckGLLayer[]>([]);

  const sendLayersToMap = useCallback((layersToSend: DeckGLLayer[]) => {
    console.log("DEBUG: DatasetManager emitting layers to map:", layersToSend);
    window.eventBus.emit('all-active-layers-updated', layersToSend);
  }, []);

  useEffect(() => {
    sendLayersToMap(activeLayers);
  }, [activeLayers, sendLayersToMap]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'raster': return 'primary'; case 'vector': return 'secondary'; case 'point-cloud': return 'success';
      case 'netcdf': return 'error'; default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'raster': return '🛰️'; case 'vector': return '🗺️'; case 'point-cloud': return '☁️';
      case 'netcdf': return '📈'; default: return '📝';
    }
  };

  const getBackgroundColorForType = (type: string) => {
    switch (type) {
      case 'raster': return '#e3f2fd'; case 'vector': return '#f3e5f5'; case 'point-cloud': return '#e8f5e8';
      case 'netcdf': return '#ffe0b2'; default: return '#fafafa';
    }
  };

  const handleLayerOpacityChange = useCallback((layerId: string, newOpacity: number) => {
    setActiveLayers(prevLayers =>
      prevLayers.map(layer => {
        if (layer.id === layerId) {
          if (layer.constructor) {
            return new (layer.constructor as any)({
              ...layer.props,
              opacity: newOpacity / 100
            });
          }
          return { ...layer, opacity: newOpacity / 100 };
        }
        return layer;
      })
    );
  }, []);

  const handleLayerRemove = useCallback((layerId: string) => {
    setActiveLayers(prevLayers => {
      const updatedLayers = prevLayers.filter(layer => layer.id !== layerId);
      return updatedLayers;
    });
  }, []);


  const handleStationClick = async (stationCode: string) => {
    const baseUrl = "https://dev.openveda.cloud/api/features/collections/public.aqs_sites_gases/items";
    const fetchUrl = `${baseUrl}?station_code=${stationCode}`;
    try {
      const response = await fetch(fetchUrl);
      if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
      const stationData = await response.json();

      const relevantFeatures = stationData.features.filter((feature: any) =>
        feature.properties.datetime && feature.properties.value !== undefined &&
        feature.properties.value !== null && !isNaN(parseFloat(feature.properties.value))
      );
      if (relevantFeatures.length === 0) { eventBus.emit('station-chart-data-ready', null); return; }
      relevantFeatures.sort((a: any, b: any) => new Date(a.properties.datetime).getTime() - new Date(b.properties.datetime).getTime());

      const chartLabels = relevantFeatures.map((feature: any) => new Date(feature.properties.datetime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
      const chartData = relevantFeatures.map((feature: any) => parseFloat(feature.properties.value));

      const legend = relevantFeatures[0].properties.parameter || 'Value';
      const labelY = relevantFeatures[0].properties.units_of_measure || 'Units';
      const labelX = 'Date';
      const chartProps = { data: chartData, labels: chartLabels, legend: legend, labelX: labelX, labelY: labelY, color: "#42A5F5" };

      eventBus.emit('station-chart-data-ready', chartProps);
    } catch (err) {
      console.error('Error loading or processing station data:', err);
      eventBus.emit('station-chart-data-ready', null);
    }
  }

  const handleCardClick = async (dataset: Dataset) => {
    const datasetIdTrimmed = dataset.id.trim();
    const isActive = activeLayers.some(layer => layer.datasetId === datasetIdTrimmed);

    if (isActive) {
      setActiveLayers(prevLayers => prevLayers.filter(layer => layer.datasetId !== datasetIdTrimmed));
      return;
    }

    let newLayersToAdd: DeckGLLayer[] = [];

    if (dataset.type === 'feature') {
      try {
        const AQS_DATA_URL = `https://dev.openveda.cloud/api/features/collections/${dataset.id}/items`;
        const response = await fetch(AQS_DATA_URL);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const jsonData = await response.json();
        const processedData = jsonData.features.map((feature: any) => ({
          position: feature.geometry.coordinates, id: feature.id,
          name: feature.properties.local_site_name || feature.properties.city || 'Unknown Site',
          state: feature.properties.state, county: feature.properties.county, city: feature.properties.city,
          stationCode: feature.properties.station_code
        }));
        const iconSvg = `<svg fill="#2496ED" width="30px" height="30px" viewBox="-51.2 -51.2 614.40 614.40" xmlns="http://www.w3.org/2000/svg"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path></svg>`;
        const svgToDataURL = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

        const iconLayer: DeckGLLayer = new IconLayer({
          id: 'dynamic-icon-layer', 
          data: processedData,
          getIcon: (d: any) => ({ url: svgToDataURL(iconSvg), 
          width: 30, 
          height: 30, 
          anchorY: 30, 
          anchorX: 15 }),
          pickable: true, getPosition: (d: any) => d.position, getSize: 24, sizeScale: 1, sizeMinPixels: 16, sizeMaxPixels: 32,
          autoHighlight: true, highlightColor: [255, 255, 255, 100], getLineColor: [0, 0, 0, 255], getLineWidth: 2,
          getColor: [0, 150, 255, 200], onClick: ({ object }: { object: any }) => { handleStationClick(object['stationCode']); },
          getTooltip: ({ object }: { object: any }) => object && `Site: ${object.name}\nCity: ${object.city || 'N/A'}\nCounty: ${object.county || 'N/A'}\nState: ${object.state || 'N/A'}`
        });
        iconLayer.datasetId = datasetIdTrimmed; 
        iconLayer.datasetMetadata = dataset;
        iconLayer.name = dataset.name;
        iconLayer.type = dataset.type;
        newLayersToAdd.push(iconLayer);

      } catch (err) {
        console.error('Error loading dataset:', err); alert('Failed to load dataset. Please try again later.');
      }
    }
    else if (dataset.type === 'raster') {
      try {
        const STAC_COLLECTION_METADATA_URL = `https://dev.openveda.cloud/api/stac/collections/${dataset.id}`;
        const collectionMetadataResponse = await fetch(STAC_COLLECTION_METADATA_URL);
        if (!collectionMetadataResponse.ok) { throw new Error(`HTTP error! status: ${collectionMetadataResponse.status}`); }
        const collectionMetadata = await collectionMetadataResponse.json();

        let renderOptions = { assets: 'cog_default', colormap: 'plasma', rescale: '0,255', nodata: '-9999' };
        if (collectionMetadata.renders && collectionMetadata.renders.dashboard) {
          const dashboardRender = collectionMetadata.renders.dashboard;
          if (dashboardRender.assets && dashboardRender.assets.length > 0) { renderOptions.assets = dashboardRender.assets[0]; }
          if (dashboardRender.rescale && dashboardRender.rescale.length > 0 && dashboardRender.rescale[0].length === 2) { renderOptions.rescale = `${dashboardRender.rescale[0][0]},${dashboardRender.rescale[0][1]}`; }
          if (dashboardRender.colormap_name) { renderOptions.colormap = dashboardRender.colormap_name; }
        }

        const STAC_ITEMS_URL = `https://dev.openveda.cloud/api/stac/collections/${dataset.id}/items`;
        const itemsResponse = await fetch(STAC_ITEMS_URL);
        if (!itemsResponse.ok) { throw new Error(`HTTP error! status: ${itemsResponse.status}`); }
        const stacItemsData = await itemsResponse.json();
        if (!stacItemsData.features || stacItemsData.features.length === 0) { console.warn('No raster features.'); alert('No raster data available.'); return; }
        const feature = stacItemsData.features[0];

        const baseUrl = 'https://dev.openveda.cloud/api/raster';
        const collectionId = dataset.id.trim();
        const itemId = feature.id;
        const finalAssets = renderOptions.assets || 'cog_default'; const finalColormap = renderOptions.colormap || 'plasma';
        const finalRescale = renderOptions.rescale || '0,255'; const finalNodata = renderOptions.nodata || '-9999';
        const tileUrlTemplate = `${baseUrl}/collections/${collectionId}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x?item=${itemId}&assets=${finalAssets}&bidx=1&colormap_name=${finalColormap}&rescale=${finalRescale}&nodata=${finalNodata}`;

        if (!tileUrlTemplate || typeof tileUrlTemplate !== 'string' || tileUrlTemplate.trim() === '') { console.error(`ERROR: Invalid tileUrlTemplate.`); alert('Failed to generate map layer.'); return; }
        const timestamp = Date.now();
        const singleTileLayer: DeckGLLayer = new TileLayer({
          id: `raster-tile-layer-${dataset.id}-${feature.id}-${timestamp}`, data: tileUrlTemplate, tileSize: 256, minZoom: 0, maxZoom: 20,
          renderSubLayers: (props: any) => {
            const { tile, data: imageData } = props;
            if (!tile || !tile.bbox || typeof tile.bbox.west === 'undefined') { console.error("ERROR: tile.bbox is undefined."); return null; }
            if (!imageData) { return null; }
            const bounds = [tile.bbox.west, tile.bbox.south, tile.bbox.east, tile.bbox.north];
            return new BitmapLayer(props, {
              data: null, image: imageData, bounds: bounds, desaturate: 0, opacity: 0.85, id: `bitmap-layer-${props.id}`,
            });
          }
        });
        singleTileLayer.datasetId = datasetIdTrimmed; 
        singleTileLayer.datasetMetadata = dataset;
        singleTileLayer.name = dataset.name;
        singleTileLayer.type = dataset.type;
        newLayersToAdd.push(singleTileLayer);

      } catch (err) {
        console.error('Error loading raster dataset:', err); alert('Failed to load raster dataset. Please try again later.');
      }
    }
    else if (dataset.type === 'netcdf-2d') {
      const conceptId = 'C2837626477-GES_DISC'; const variable = 'o3'; const datetime = '2014-06-01T00:00:00Z';
      const varValues = { 'lev': [500, 1000] }; const levValues = varValues?.lev || [];

      if (!varValues || Object.keys(varValues).length === 0) { console.warn('NetCDF: varValues is empty.'); alert('No NetCDF levels defined.'); return; }
      const BOUNDS = [-125.0, 24.5, -66.5, 49.5];
      const baseUrl = 'https://v4jec6i5c0.execute-api.us-west-2.amazonaws.com/tiles/WebMercatorQuad/{z}/{x}/{y}';
      const baseParams = {
        concept_id: conceptId, variable: variable, rescale: '20,70', backend: 'xarray', sel_method: 'nearest', colormap_name: 'reds',
      };
      const tileUrls = [];
      for (const [dimensionKey, dimensionValues] of Object.entries(varValues)) {
        for (const value of dimensionValues) {
          const params = new URLSearchParams(baseParams as Record<string, string>); params.append('sel', `${dimensionKey}=${value}`);
          const isoTime = new Date(datetime).toISOString(); params.append('sel', `time=${isoTime}`);
          const dayStart = new Date(datetime); const dayEnd = new Date(dayStart); dayEnd.setUTCHours(23, 59, 59, 999);
          params.set('datetime', `${dayStart.toISOString()}/${dayEnd.toISOString()}`);
          tileUrls.push(`${baseUrl}?${params.toString()}`);
        }
      }

      tileUrls.forEach((tileUrl, index) => {
        const lev = levValues[index];
        if (lev === undefined) { console.warn(`Skipping NetCDF layer for index ${index}: level value is undefined.`); return; }
        const zOffset = lev * 1000;
        const layerId = `netcdf-2d-layer-${dataset.id}-lev-${lev}-${Date.now()}`;
        const netcdfLayer: DeckGLLayer = new TileLayer({
          id: layerId, data: tileUrl, minZoom: 0, maxZoom: 19, tileSize: 256, visible: true, pickable: true, opacity: 1.0,
          datasetId: dataset.id.trim(), 
          datasetMetadata: dataset,
          renderSubLayers: (props: any) => {
            const { tile, data: imageData } = props;
            if (!tile || !tile.bbox || typeof tile.bbox.west === 'undefined') { console.error("ERROR: NetCDF tile.bbox is undefined."); return null; }
            const { west, south, east, north } = tile.bbox;
            if (east < BOUNDS[0] || west > BOUNDS[2] || north < BOUNDS[1] || south > BOUNDS[3]) { return null; }
            return new BitmapLayer({
              ...props, opacity: 1.0, data: null, image: imageData, bounds: [west, south, east, north], modelMatrix: new Matrix4().translate([0, 0, zOffset])
            });
          },
          onClick: (info: any) => {
            eventBus.emit('netcdf.tile.clicked', { // <<<<< MERGE: Consistent eventBus.emit >>>>>
              conceptId, datetime, variable, lev: lev, tile: info.tile, coordinate: info.coordinate, info
            });
          },
          onTileLoad: (tile: any) => console.log(`NetCDF tile loaded for lev=${lev}:`, tile),
          onTileError: (error: any) => console.error(`NetCDF tile load error for lev=${lev}:`, error)
        });
        netcdfLayer.datasetId = datasetIdTrimmed; 
        netcdfLayer.datasetMetadata = dataset;
        netcdfLayer.name = `Level ${lev}`;
        netcdfLayer.type = dataset.type;
        newLayersToAdd.push(netcdfLayer);
      });
    }
    else if (dataset.type === 'point-cloud') {
      const pointCloudLayer: DeckGLLayer = {
        type: 'point-cloud', dataset, id: `point-cloud-layer-${dataset.id}-${Date.now()}`,
        datasetId: dataset.id.trim(), 
        datasetMetadata: dataset
      };
      pointCloudLayer.name = dataset.name;
      pointCloudLayer.type = dataset.type;
      newLayersToAdd.push(pointCloudLayer);
    }
    else {
      console.warn(`Unsupported dataset type: ${dataset.type}`); alert(`Unsupported dataset type: ${dataset.type}`);
    }

    setActiveLayers(prevLayers => [...prevLayers, ...newLayersToAdd]);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', p: 2, overflowY: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
        Datasets
      </Typography>

      <Grid container spacing={2}>
        {allDatasets.map((dataset) => {
          const isActive = activeLayers.some(layer => layer.datasetId === dataset.id.trim()); 
          const datasetActiveLayers = activeLayers.filter(layer => layer.datasetId === dataset.id.trim()); 

          return (
            <Grid item xs={12} key={dataset.id}>
              <Card
                sx={{
                  border: '1px solid',
                  borderColor: isActive ? 'primary.main' : 'divider', // Highlight if active
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease-in-out',
                }}
              >
                {/* Top section of the card (Dataset Summary) */}
                <Box
                  onClick={() => handleCardClick(dataset)}
                  sx={{
                    display: 'flex', alignItems: 'center', p: 1.5, flexGrow: 1, minHeight: 0,
                  }}
                >
                  <Box sx={{
                    height: 50, width: 50, minWidth: 50,
                    backgroundColor: getBackgroundColorForType(dataset.type),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', borderRadius: 1, mr: 1.5
                  }}>
                    {getTypeIcon(dataset.type)}
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'nowrap' }}>
                      <Typography variant="subtitle1" component="h3"
                        sx={{ fontWeight: 600, lineHeight: 1.3, flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {dataset.name}
                      </Typography>
                      <Chip label={dataset.type} size="small" color={getTypeColor(dataset.type)} sx={{ ml: 1, height: 20, fontSize: '0.6875rem', flexShrink: 0 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ fontSize: '0.8rem', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis'}}
                    >
                      {dataset.description}
                      </Typography>
                    </Box>
                  </Box>

                {/* Expanded Layer Details (if dataset is active) */}
                {isActive && (
                  <Box
                    onClick={(e) => e.stopPropagation()} 
                    sx={{ borderTop: 1, borderColor: 'divider', p: 1.5, pt: 1, bgcolor: 'background.default' }}
                  >
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}>
                      Active Layers: {datasetActiveLayers.length}
                    </Typography>
                    {datasetActiveLayers.map((layer: DeckGLLayer) => (
                      <ActiveLayerDisplayCard
                        key={layer.id}
                        layer={layer}
                        onOpacityChange={handleLayerOpacityChange}
                        onRemove={handleLayerRemove}
                      />
                    ))}
                    {datasetActiveLayers.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                            <Chip
                                label="Deactivate All"
                                size="small"
                                onClick={() => setActiveLayers(prevLayers => prevLayers.filter(l => l.datasetId !== dataset.id.trim()))} 
                                onDelete={() => setActiveLayers(prevLayers => prevLayers.filter(l => l.datasetId !== dataset.id.trim()))} 
                                deleteIcon={<CloseIcon />}
                                sx={{ cursor: 'pointer' }}
                            />
                        </Box>
                    )}
                  </Box>
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}