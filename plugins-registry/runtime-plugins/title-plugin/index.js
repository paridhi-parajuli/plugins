export function TitlePlugin({ logoUrl, title, description }) {
  const container = document.createElement('div');

  container.style.marginTop = '16px';
  container.style.marginBottom = '16px';
  container.style.padding = '8px';

  const flexDiv = document.createElement('div');
  flexDiv.style.display = 'flex';
  flexDiv.style.alignItems = 'center';
  flexDiv.style.gap = '12px';
  flexDiv.style.fontFamily = 'Arial, sans-serif';
  flexDiv.style.padding = '8px 16px';
  flexDiv.style.userSelect = 'none';

  const img = document.createElement('img');
  img.src = logoUrl;
  img.style.height = '24px';

  const boldText = document.createElement('div');
  boldText.style.fontWeight = 'bold';
  boldText.style.fontSize = '1.1em';
  boldText.style.color = '#000';
  boldText.textContent = title;

  flexDiv.appendChild(img);
  //flexDiv.appendChild(normalText);
  flexDiv.appendChild(boldText);

  if (description) {
    const infoCircle = document.createElement('div');
    infoCircle.title = description;
    infoCircle.style.width = '18px';
    infoCircle.style.height = '18px';
    infoCircle.style.borderRadius = '50%';
    infoCircle.style.background = '#666';
    infoCircle.style.color = 'white';
    infoCircle.style.fontSize = '14px';
    infoCircle.style.display = 'flex';
    infoCircle.style.justifyContent = 'center';
    infoCircle.style.alignItems = 'center';
    infoCircle.style.cursor = 'default';
    infoCircle.textContent = 'i';
    flexDiv.appendChild(infoCircle);
  }

  container.appendChild(flexDiv);

  return container;
}
