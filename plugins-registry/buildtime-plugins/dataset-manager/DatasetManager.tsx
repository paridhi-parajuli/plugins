import React from 'react';
import {
  Card,
  Typography,
  Grid,
  Box,
  Chip
} from '@mui/material';
import { Matrix4 } from '@math.gl/core';
import {IconLayer} from '@deck.gl/layers';
import { Tile3DLayer, TileLayer } from '@deck.gl/geo-layers';
import {BitmapLayer} from '@deck.gl/layers';


export function DatasetManager({ datasets }) {
  if (!datasets) {
    return null;
  }
  const allDatasets = datasets;

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
  
  const handleStationClick = async (stationCode) => {
    const baseUrl = "https://dev.openveda.cloud/api/features/collections/public.aqs_sites_gases/items";
    const fetchUrl = `${baseUrl}?station_code=${stationCode}`;
    try {
        const response = await fetch(fetchUrl);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stationData = await response.json();
        console.log("Raw Station Data fetched:", stationData);

        // --- Start Data Processing for Line Chart ---

        // Filter out features that might not have a value or datetime
        // and ensure 'value' can be parsed as a number.
        const relevantFeatures = stationData.features.filter(feature =>
            feature.properties.datetime &&
            feature.properties.value !== undefined &&
            feature.properties.value !== null &&
            !isNaN(parseFloat(feature.properties.value)) // Ensure 'value' is a valid number string
        );

        if (relevantFeatures.length === 0) {
            console.warn("No valid data points found for this station to plot.", stationCode);
            // Emit null to clear any previously displayed chart
            window.eventBus.emit('station-chart-data-ready', null);
            return;
        }

        // Sort by datetime to ensure the line chart is chronological
        relevantFeatures.sort((a, b) => new Date(a.properties.datetime).getTime() - new Date(b.properties.datetime).getTime());

        // Extract labels (time) and data (value)
        const chartLabels = relevantFeatures.map(feature => {
            const date = new Date(feature.properties.datetime);
            // Format to a readable date string, e.g., "Jan 1, 2017"
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        });

        const chartData = relevantFeatures.map(feature =>
            parseFloat(feature.properties.value) // Convert value string to a number
        );

        // Extract legend and Y-axis label from the first relevant feature
        // (assuming parameter and units are consistent for a given station's data set)
        const legend = relevantFeatures[0].properties.parameter || 'Value';
        const labelY = relevantFeatures[0].properties.units_of_measure || 'Units';
        const labelX = 'Date'; // Consistent X-axis label

        // Assemble the props object for the LineChart component
        const chartProps = {
            data: chartData,
            labels: chartLabels,
            legend: legend,
            labelX: labelX,
            labelY: labelY,
            color: "#42A5F5" // A default color for the line chart (can be customized)
        };

        console.log("Prepared Chart Props for LineChart:", chartProps);

        // Emit the processed data for the CentralPanel to pick up
        window.eventBus.emit('station-chart-data-ready', chartProps);
        console.log("Station Chart Data Ready event emitted");

    } catch (err) {
        console.error('Error loading or processing station data:', err);
        // On error, emit null to clear the chart
        window.eventBus.emit('station-chart-data-ready', null);
    }
  }

  const handleCardClick = async (dataset) => {
    if (dataset.type === 'feature') {
      // AQS feature dataset logic
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

        const iconSvg = `<svg fill="#2496ED" width="30px" height="30px" viewBox="-51.2 -51.2 614.40 614.40" xmlns="http://www.w3.org/2000/svg"><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"></path></svg>`;
        const svgToDataURL = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

        const iconLayer = new IconLayer({
          id: 'dynamic-icon-layer',
          data: processedData,
          getIcon: d => ({ url: svgToDataURL(iconSvg), width: 30, height: 30, anchorY: 30, anchorX: 15 }),
          pickable: true,
          getPosition: d => d.position,
          getSize: 24,
          sizeScale: 1,
          sizeMinPixels: 16,
          sizeMaxPixels: 32,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 100],
          getLineColor: [0, 0, 0, 255],
          getLineWidth: 2,
          getColor: [0, 150, 255, 200],
          onClick: ({ object }) => {
            handleStationClick(object['stationCode']);
          },
          getTooltip: ({ object }) =>
            object && `Site: ${object.name}\nCity: ${object.city || 'N/A'}\nCounty: ${object.county || 'N/A'}\nState: ${object.state || 'N/A'}`
        });
        (iconLayer as any).datasetId = dataset.id;
        window.eventBus.emit('dataset-clicked-batch', [iconLayer]);

      } catch (err) {
        console.error('Error loading dataset:', err);
        alert('Failed to load dataset. Please try again later.');
      }
    }
    else if (dataset.type === 'raster') {
        try {
          const STAC_COLLECTION_METADATA_URL = `https://dev.openveda.cloud/api/stac/collections/${dataset.id}`;
          const collectionMetadataResponse = await fetch(STAC_COLLECTION_METADATA_URL);

          if (!collectionMetadataResponse.ok) {
            throw new Error(`Failed to fetch STAC collection metadata for ${dataset.id}: ${collectionMetadataResponse.status}`);
          }
          const collectionMetadata = await collectionMetadataResponse.json();
          console.log("STAC Collection Metadata fetched:", collectionMetadata);

          let renderOptions = {
              assets: 'cog_default',
              colormap: 'plasma',
              rescale: '0,255',
              nodata: '-9999'
          };

          if (collectionMetadata.renders && collectionMetadata.renders.dashboard) {
              const dashboardRender = collectionMetadata.renders.dashboard;

              if (dashboardRender.assets && dashboardRender.assets.length > 0) {
                  renderOptions.assets = dashboardRender.assets[0];
              }
              if (dashboardRender.rescale && dashboardRender.rescale.length > 0 && dashboardRender.rescale[0].length === 2) {
                  renderOptions.rescale = `${dashboardRender.rescale[0][0]},${dashboardRender.rescale[0][1]}`;
              }
              if (dashboardRender.colormap_name) {
                  renderOptions.colormap = dashboardRender.colormap_name;
              }
          }

          const STAC_ITEMS_URL = `https://dev.openveda.cloud/api/stac/collections/${dataset.id}/items`;
          const itemsResponse = await fetch(STAC_ITEMS_URL);
          if (!itemsResponse.ok) {
            throw new Error(`Failed to fetch STAC items for raster: ${itemsResponse.status}`);
          }

          const stacItemsData = await itemsResponse.json();

          if (!stacItemsData.features || stacItemsData.features.length === 0) {
            console.warn('No raster features (items) found in collection.');
            alert('No raster data available for this dataset.');
            return;
          }

          const feature = stacItemsData.features[0]; // Get only the first feature

          const baseUrl = 'https://dev.openveda.cloud/api/raster';
          const collectionId = dataset.id;
          const itemId = feature.id;

          const finalAssets = renderOptions.assets || 'cog_default';
          const finalColormap = renderOptions.colormap || 'plasma';
          const finalRescale = renderOptions.rescale || '0,255';
          const finalNodata = renderOptions.nodata || '-9999';

          const tileUrlTemplate = `${baseUrl}/collections/${collectionId}/tiles/WebMercatorQuad/{z}/{x}/{y}@1x` +
            `?item=${itemId}` +
            `&assets=${finalAssets}` +
            `&bidx=1` +
            `&colormap_name=${finalColormap}` +
            `&rescale=${finalRescale}` +
            `&nodata=${finalNodata}`;

          console.log("DEBUG: Generated Tile URL Template for the first feature:", tileUrlTemplate);

          if (!tileUrlTemplate || typeof tileUrlTemplate !== 'string' || tileUrlTemplate.trim() === '') {
            console.error(`ERROR: Invalid or empty tileUrlTemplate generated for feature ${feature.id}. Skipping layer creation.`);
            alert('Failed to generate map layer due to invalid URL.');
            return; // Exit if the URL for the first feature is invalid
          }

          const timestamp = Date.now();
          const singleTileLayer = new TileLayer({ // Variable renamed to reflect single layer
            id: `raster-tile-layer-${dataset.id}-${feature.id}-${timestamp}`,
            data: tileUrlTemplate,
            tileSize: 256,
            minZoom: 0,
            maxZoom: 20,
            renderSubLayers: props => {
              const {
                tile, 
                data: imageData,
              } = props;

              if (!imageData) {
                return null;
              }
              const bounds = [tile.bbox.west, tile.bbox.south, tile.bbox.east, tile.bbox.north];
              return new BitmapLayer(props, {
                data: null,
                image: imageData,
                bounds: bounds,
                desaturate: 0,
                opacity: 0.85,
                id: `bitmap-layer-${props.id}`,
              });
            }
          });
          (singleTileLayer as any).datasetId = dataset.id;
          window.eventBus.emit('dataset-clicked-batch', [singleTileLayer]);
          console.log("Emitted single raster layer:", singleTileLayer);

        } catch (err) {
          console.error('Error loading raster dataset:', err);
          alert('Failed to load raster dataset. Please try again later.');
        }
    }
    else if (dataset.type === 'netcdf-2d') {
      console.log(`[NetCDF Dataset] Processing NetCDF data for: ${dataset.id}`);

        const conceptId = 'C2837626477-GES_DISC'; // From baseParams in provided function
        const variable = 'o3'; // From baseParams in provided function
        const datetime = '2014-06-01T00:00:00Z'; // Hardcoded datetime for now

        const varValues = { 'lev': [500, 1000] };
        const levValues = varValues?.lev || [];

        if (!varValues || Object.keys(varValues).length === 0) {
          console.warn('NetCDF: varValues is empty, no layers to create.');
          alert('No NetCDF levels defined for this dataset.');
          return;
        }

        const layersToAdd = [];
        const BOUNDS = [-125.0, 24.5, -66.5, 49.5];

        // --- INLINED buildNetCDF2DTileUrl logic START ---
        const baseUrl = 'https://v4jec6i5c0.execute-api.us-west-2.amazonaws.com/tiles/WebMercatorQuad/{z}/{x}/{y}';
        
        const baseParams = {
          concept_id: conceptId,
          variable: variable,
          rescale: '20,70',
          backend: 'xarray',
          sel_method: 'nearest',
          colormap_name: 'reds',
        };

        const tileUrls = [];

        for (const [dimensionKey, dimensionValues] of Object.entries(varValues)) {
          for (const value of dimensionValues) {
            const params = new URLSearchParams(baseParams);
            params.append('sel', `${dimensionKey}=${value}`);
            const isoTime = new Date(datetime).toISOString();
            params.append('sel', `time=${isoTime}`);
            const dayStart = new Date(datetime);
            const dayEnd = new Date(dayStart);
            dayEnd.setUTCHours(23, 59, 59, 999);
            params.set('datetime', `${dayStart.toISOString()}/${dayEnd.toISOString()}`);
            tileUrls.push(`${baseUrl}?${params.toString()}`);
          }
        }

        tileUrls.forEach((tileUrl, index) => {
          const lev = levValues[index];

          if (lev === undefined) {
            console.warn(`Skipping NetCDF layer for index ${index}: level value is undefined.`);
            return;
          }

          const zOffset = lev * 1000;
          // Use the `lev` in the layer `id` for unique identification and debugging
          const layerId = `netcdf-2d-layer-${dataset.id}-lev-${lev}-${Date.now()}`; 

          const netcdfLayer = new TileLayer({
            id: layerId, // Unique ID for Deck.gl's layer management
            data: tileUrl,
            minZoom: 0,
            maxZoom: 19,
            tileSize: 256,
            visible: true,
            pickable: true,
            opacity: 1.0,
            datasetId: dataset.id,
            renderSubLayers: props => {
              const { tile, data: imageData } = props;
              if (!tile || !tile.bbox || typeof tile.bbox.west === 'undefined') {
                  console.error("ERROR: NetCDF tile.bbox is undefined. Skipping render.", props);
                  return null;
              }
              const { west, south, east, north } = tile.bbox;

              if (
                east < BOUNDS[0] || west > BOUNDS[2] ||
                north < BOUNDS[1] || south > BOUNDS[3]
              ) {
                return null;
              }

              return new BitmapLayer({
                ...props,
                opacity: 1.0,
                data: null,
                image: imageData,
                bounds: [west, south, east, north],
                modelMatrix: new Matrix4().translate([0, 0, zOffset])
              });
            },

            onClick: (info) => {
              eventBus.emit('netcdf.tile.clicked', {
                  conceptId,
                  datetime,
                  variable,
                  lev: lev,
                  tile: info.tile,
                  coordinate: info.coordinate,
                  info
              });
              console.log(`NetCDF tile clicked: Layer ID=${layerId}, Level=${lev}, Coords=${info.coordinate}`);
            },
            onTileLoad: (tile) => console.log(`NetCDF tile loaded for lev=${lev}:`, tile),
            onTileError: (error) => console.error(`NetCDF tile load error for lev=${lev}:`, error)
          });

          layersToAdd.push(netcdfLayer);
        });

        if (layersToAdd.length === 0) {
          alert('No valid NetCDF tile layers could be created for this dataset.');
          return;
        }

        eventBus.emit('dataset-clicked-batch', layersToAdd);
        console.log("Emitted NetCDF layers via imported eventBus:", layersToAdd);
    }
    else if (dataset.type === 'point-cloud') {
      // 🚧 TODO: Handle point-cloud (e.g., using deck.gl PointCloudLayer or custom tileset loader)
      console.log(`[Point Cloud] TODO: Load and render point cloud from ${dataset.url}`);
      window.eventBus.emit('dataset-clicked', {
        type: 'point-cloud',
        dataset,
      });

    } 
    else {
      console.warn(`Unsupported dataset type: ${dataset.type}`);
      alert(`Unsupported dataset type: ${dataset.type}`);
    }
  };
  return (
    <Box sx={{ width: '100%', height: '100%', p: 2, overflowY: 'auto' }}>
    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
    Datasets.
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