import React from 'react';
import { createRoot } from 'react-dom/client';
import FireRecorder from './FireRecorder';

export function FireRecorderPanel() {
  const container = document.createElement('div');
  createRoot(container).render(<FireRecorder canvasId="deckgl-overlay" />);
  return container;
}
