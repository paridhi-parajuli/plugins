let detailsDiv = null;

export function MapClickDetailsPlugin() {
  if (!detailsDiv) {
    detailsDiv = document.createElement('div');
    detailsDiv.style.marginTop = '16px';
    detailsDiv.style.background = '#fff3e0';
    detailsDiv.style.padding = '8px';
    detailsDiv.style.borderRadius = '6px';

    const heading = document.createElement('h5');
    heading.textContent = 'Map Click Details';
    detailsDiv.appendChild(heading);

    const para = document.createElement('p');
    para.textContent = 'Click on the map to see details here.';
    para.id = 'map-click-details-text';
    detailsDiv.appendChild(para);

    // Listen for map clicks
    if (window.eventBus && typeof window.eventBus.on === 'function') {
      window.eventBus.on('map.clicked', (data) => {
        console.log(data)
        para.textContent = `Clicked at: ${data.event.coordinate}`;
      });
    }
  }
  return detailsDiv;
}
