import React, { useState, useMemo, useRef } from 'react';
import '@google/model-viewer';

export default function App() {
  const [file, setFile] = useState(null);
  const [modelScale, setModelScale] = useState('1 1 1'); // Default scale
  const modelRef = useRef(null);

  const modelUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  // --- NEW FEATURE: Auto-Fit Logic ---
  const handleModelLoad = () => {
    const model = modelRef.current;
    if (!model) return;

    // 1. Get the size of the model in meters
    const { x, y, z } = model.getDimensions();
    
    // 2. Find the largest dimension (width, height, or depth)
    const largestDimension = Math.max(x, y, z);
    
    // 3. Calculate a scale factor to make the largest side exactly 0.8 meters (80cm)
    // This is a perfect size for indoor AR (tables, floor)
    const targetSize = 0.8; 
    
    if (largestDimension > 0) {
      const scaleFactor = targetSize / largestDimension;
      // Apply this scale uniformly to X, Y, and Z
      setModelScale(`${scaleFactor} ${scaleFactor} ${scaleFactor}`);
      console.log(`Auto-scaled model from ${largestDimension}m to ${targetSize}m`);
    }
  };

  return (
    <div style={{ height: '100vh', background: '#000', color: 'white', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ padding: '20px', background: '#222', textAlign: 'center' }}>
        <h3>AR Viewer</h3>
        <input 
          type="file" 
          accept=".glb,.gltf" 
          onChange={(e) => {
            setFile(e.target.files[0]);
            setModelScale('1 1 1'); // Reset scale for new file
          }} 
          style={{ color: 'white' }} 
        />
      </div>

      <div style={{ flexGrow: 1, position: 'relative' }}>
        {modelUrl ? (
          <model-viewer
            ref={modelRef} 
            src={modelUrl}
            
            /* Apply the calculated auto-scale */
            scale={modelScale}
            
            /* Trigger the calculation when model loads */
            onLoad={handleModelLoad}

            ar
            ar-modes="webxr scene-viewer"
            ar-scale="auto"
            ar-placement="floor"
            
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style={{ width: '100%', height: '100%' }}
          >
            <button slot="ar-button" style={{
              position: 'absolute', 
              bottom: '100px', 
              left: '50%', 
              transform: 'translateX(-50%)',
              background: '#2196F3', 
              color: 'white', 
              border: 'none',
              padding: '16px 32px', 
              borderRadius: '50px', 
              fontSize: '18px', 
              fontWeight: 'bold',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              zIndex: 100
            }}>
              Enter AR
            </button>
          </model-viewer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <p style={{color: '#888'}}>Upload GLB to start</p>
          </div>
        )}
      </div>
    </div>
  );
}
