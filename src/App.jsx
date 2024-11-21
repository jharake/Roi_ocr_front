// src/App.jsx
import React, { useState } from 'react';
import OcrCropper from './components/OcrCropper';
import OcrUpload from './components/OcrUpload';
import OcrAuto from './components/OcrAuto';
import './App.css';


function App() {
    const [autoOcr, setAutoOcr] = useState(true);

    return (
        <div className="main">
            
            {autoOcr ? (
                <>
                <h1>OCR Manual</h1>
                    <OcrCropper />
                    <button onClick={() => setAutoOcr(false)}>Switch to Automatic OCR</button>
                </>
            ) : (
                <>
                <h1>OCR Automatic</h1>
                    <OcrAuto />
                    <button onClick={() => setAutoOcr(true)}>Switch to Manual OCR</button>
                </>
            )}
        </div>
    );
}

export default App;