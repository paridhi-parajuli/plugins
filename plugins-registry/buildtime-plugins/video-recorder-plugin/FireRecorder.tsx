import React, { useState, useRef, useCallback } from 'react';
import WebMWriter from 'webm-writer';

export default function FireRecorder() {
  const [recording, setRecording] = useState(false);
  const writerRef = useRef<WebMWriter | null>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const intervalRef = useRef<number | null>(null);
  const canvasId = 'deckgl-overlay';
  console.log("i am loaded")

  const captureFrame = useCallback(() => {
    const mapCanvas = document.querySelector('canvas.mapboxgl-canvas') as HTMLCanvasElement | null;
    const deckCanvas = document.getElementById(canvasId) as HTMLCanvasElement | null;

    if (!mapCanvas || !deckCanvas) {
      console.log('Missing canvases');
      return;
    }

    const width = mapCanvas.width;
    const height = mapCanvas.height;

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    const ctx = c.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(mapCanvas, 0, 0, width, height);
    ctx.drawImage(deckCanvas, 0, 0, width, height);

    if (writerRef.current) {
      writerRef.current.addFrame(c);
      framesRef.current.push(c);
      console.log('Frame captured:', framesRef.current.length);
    }
  }, []);

  const startRecording = () => {
    writerRef.current = new WebMWriter({
      quality: 0.95,
      frameRate: 1,
      transparent: false
    });
    framesRef.current = [];
    setRecording(true);

    intervalRef.current = window.setInterval(() => {
      captureFrame();
    }, 2000); //every 2s
  };

  const stopRecording = async () => {
    setRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!writerRef.current) return;

    const blob = await writerRef.current.complete();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    writerRef.current = null;
    framesRef.current = [];
  };

  return (
    <div
      style={{
        padding: '8px',
        marginTop: '16px',
        borderRadius: '6px',
        marginLeft: 'auto',
        position: 'absolute',
        right: '0',
      }}
    >
    {/* Animation and button focus style */}
    <style>{`
      @keyframes blinker {
        100% { opacity: 0; }
      }
      button:focus {
        outline: none;
      }
    `}</style>
  
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '5px' }}>
        <button
          style={{
            backgroundColor: 'white', // override black background
            borderRadius: '4px',
            padding: '6px 10px',
            cursor: 'pointer',
            color:'Black',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '16px',
          }}
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? 'Stop' : '🎥'}
          {recording && (
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'red',
                animation: 'blinker 1s linear infinite',
              }}
            />
          )}
        </button>
      </div>
    </div>
  );
  
}
