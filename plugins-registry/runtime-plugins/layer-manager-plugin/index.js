export function LeftPanelPlugin() {
  const container = document.createElement('div');
  container.style.marginTop = '16px';

  const heading = document.createElement('h5');
  heading.textContent = 'Layer Manager Plugin';
  container.appendChild(heading);

  const para = document.createElement('p');
  para.textContent = 'This content is injected by the layer-,manager-plugin!';
  container.appendChild(para);

  return container;
}
