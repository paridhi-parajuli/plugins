export function LeftPanelPlugin() {
  const container = document.createElement('div');
  container.style.marginTop = '16px';

  const heading = document.createElement('h5');
  heading.textContent = 'Left Panel Plugin';
  container.appendChild(heading);

  const para = document.createElement('p');
  para.textContent = 'This content is injected by the left-panel-plugin!';
  container.appendChild(para);

  return container;
}
