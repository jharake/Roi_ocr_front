import React, { useState } from 'react';
import axios from 'axios';

function OcrAuto() {
    const [file, setFile] = useState(null);
    const [uploadResult, setUploadResult] = useState({});
    const [imagePreview, setImagePreview] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setImagePreview(URL.createObjectURL(selectedFile));
    };

    const handleUpload = async () => {
        if (!file) {
            alert("Please select a file first.");
            return;
        }

        const formData = new FormData();
        formData.append("imageFile", file);

        try {
            const response = await axios.post("https://localhost:7009/api/ocr/classify-and-extract-rois", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setUploadResult(response.data.roIs);
        } catch (error) {
            console.error("File upload failed", error);
            setUploadResult({ error: "Error uploading file" });
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            {imagePreview && (
                <div>
                    <h3>Image Preview:</h3>
                    <img src={imagePreview} alt="Selected" style={{ maxWidth: '100%', height: 'auto' }} />
                </div>
            )}
            <button onClick={handleUpload}>Extract Info</button>
            {Object.keys(uploadResult).length > 0 && (
                <div>
                    <h3>OCR Results:</h3>
                    {Object.entries(uploadResult).map(([key, value]) => (
                        <div key={key}>
                            <h4>{key}</h4>
                            <p>{value.text}</p>
                            <img src={`data:image/png;base64,${value.imageBase}`} alt={key} style={{ maxWidth: '100%', height: 'auto' }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default OcrAuto;