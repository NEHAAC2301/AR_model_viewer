import React, { useState, useMemo, useRef } from 'react';
import '@google/model-viewer';

export default function App() {
  const [imageFile, setImageFile] = useState(null);
  const [glbBlob, setGlbBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelScale, setModelScale] = useState('1 1 1');
  const modelRef = useRef(null);

  // Create URL for the GLB blob
  const modelUrl = useMemo(() => {
    if (!glbBlob) return null;
    return URL.createObjectURL(glbBlob);
  }, [glbBlob]);

  // Handle image upload and API call
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setError(null);
    setLoading(true);
    setGlbBlob(null);
    setModelScale('1 1 1');

    try {
      // Create FormData to send image to API
      const formData = new FormData();
      formData.append('file', file);

      // Call your FastAPI endpoint
      const response = await fetch('https://unovert-unengaged-edwardo.ngrok-free.dev/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      // Get the GLB file as a blob
      const blob = await response.blob();

      // Check if response is actually a GLB file
      if (blob.type === 'application/json') {
        const errorData = await blob.text();
        throw new Error(JSON.parse(errorData).error || 'Unknown error');
      }

      setGlbBlob(blob);
      console.log('✅ 3D model generated successfully');

    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fit the model when loaded
  const handleModelLoad = () => {
    const model = modelRef.current;
    if (!model) return;

    const { x, y, z } = model.getDimensions();
    const largestDimension = Math.max(x, y, z);
    const targetSize = 0.8;

    if (largestDimension > 0) {
      const scaleFactor = targetSize / largestDimension;
      setModelScale(`${scaleFactor} ${scaleFactor} ${scaleFactor}`);
      console.log(`Auto-scaled model from ${largestDimension}m to ${targetSize}m`);
    }
  };

  return (
    <div style={{ 
      height: '100vh', 
      background: '#000', 
      color: 'white', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>

      {/* Header with upload */}
      <div style={{ 
        padding: '20px', 
        background: '#222', 
        textAlign: 'center' 
      }}>
        <h3>Image to 3D AR Viewer</h3>

        <div style={{ marginTop: '10px' }}>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={loading}
            style={{ 
              color: 'white',
              padding: '10px',
              background: '#333',
              border: '1px solid #555',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          />
        </div>

        {/* Status Messages */}
        {loading && (
          <div style={{ 
            marginTop: '15px', 
            color: '#FFD700',
            fontSize: '14px' 
          }}>
            🔄 Converting image to 3D model...
          </div>
        )}

        {error && (
          <div style={{ 
            marginTop: '15px', 
            color: '#FF6B6B',
            fontSize: '14px',
            background: '#331111',
            padding: '10px',
            borderRadius: '5px'
          }}>
            ❌ Error: {error}
          </div>
        )}

        {imageFile && !loading && !error && glbBlob && (
          <div style={{ 
            marginTop: '15px', 
            color: '#4CAF50',
            fontSize: '14px' 
          }}>
            ✅ 3D model ready!
          </div>
        )}
      </div>

      {/* 3D Viewer Area */}
      <div style={{ flexGrow: 1, position: 'relative' }}>
        {loading ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            gap: '20px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '5px solid #333',
              borderTop: '5px solid #2196F3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{color: '#888'}}>Processing your image...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : modelUrl ? (
          <model-viewer
            ref={modelRef}
            src={modelUrl}
            scale={modelScale}
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
              cursor: 'pointer',
              zIndex: 100
            }}>
              Enter AR
            </button>
          </model-viewer>
        ) : (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            gap: '20px'
          }}>
            <div style={{
              fontSize: '64px',
              opacity: 0.3
            }}>📷</div>
            <p style={{color: '#888', fontSize: '18px'}}>Upload an image to generate 3D model</p>
            <p style={{color: '#666', fontSize: '14px'}}>Supports JPG, PNG, WebP</p>
          </div>
        )}
      </div>
    </div>
  );
}
