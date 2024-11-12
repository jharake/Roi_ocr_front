// src/components/OcrUpload.jsx
import React, { useState } from 'react';
import axios from 'axios';

function OcrUpload() {
    const [file, setFile] = useState(null);
    const [ocrText, setOcrText] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleOcr = async () => {
        const formData = new FormData();
        formData.append("imageFile", file);

        try {
            const response = await axios.post("https://localhost:7009/api/ocr/ocr-image", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setOcrText(response.data.text);
        } catch (error) {
            console.error("OCR failed", error);
            setOcrText("Error performing OCR");
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleOcr}>Get OCR Text</button>
            {ocrText && (
                <div>
                    <h3>OCR Result:</h3>
                    <p>{ocrText}</p>
                </div>
            )}
        </div>
    );
}

export default OcrUpload;
