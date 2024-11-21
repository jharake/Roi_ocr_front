import React, { useState, useRef } from "react";
import axios from "axios";
import { getCroppedImgBlob } from "../utils/cropImage.js";

const MAX_WIDTH = 1000; 
const MIN_BOX_SIZE = 5; 

function OcrCropper() {
  const [image, setImage] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxIndex, setSelectedBoxIndex] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [imgElement, setImgElement] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [scale, setScale] = useState(1);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImgElement(img);
          let imgWidth = img.width;
          let imgHeight = img.height;
          let scaleFactor = 1;

          if (imgWidth > MAX_WIDTH) {
            scaleFactor = MAX_WIDTH / imgWidth;
            imgWidth = MAX_WIDTH;
            imgHeight = imgHeight * scaleFactor;
          }

          setScale(scaleFactor);
          const canvas = canvasRef.current;
          canvas.width = imgWidth;
          canvas.height = imgHeight;
          drawImageOnCanvas(img, scaleFactor);
        };
        img.src = event.target.result;
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawImageOnCanvas = (img, scaleFactor) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    setStartPoint({
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentPoint = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageOnCanvas(imgElement, scale); 
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    boxes.forEach((box) => {
      ctx.strokeRect(box.x * scale, box.y * scale, box.width * scale, box.height * scale); 
    });
    ctx.strokeRect(
      startPoint.x * scale,
      startPoint.y * scale,
      (currentPoint.x - startPoint.x) * scale,
      (currentPoint.y - startPoint.y) * scale
    ); 
  };

  const handleMouseUp = (e) => {
    setIsDrawing(false);
    const rect = canvasRef.current.getBoundingClientRect();
    const endPoint = {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
    const newBox = {
      x: startPoint.x,
      y: startPoint.y,
      width: endPoint.x - startPoint.x,
      height: endPoint.y - startPoint.y,
    };

    // Check if box above thresh
    if (Math.abs(newBox.width) >= MIN_BOX_SIZE && Math.abs(newBox.height) >= MIN_BOX_SIZE) {
      setBoxes([...boxes, newBox]);
      drawBoxes([...boxes, newBox]);
    }
  };

  const drawBoxes = (boxes) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    drawImageOnCanvas(imgElement, scale); 
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    boxes.forEach((box, index) => {
      ctx.strokeRect(box.x * scale, box.y * scale, box.width * scale, box.height * scale);
      if (index === selectedBoxIndex) {
        ctx.strokeStyle = "blue"; 
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x * scale, box.y * scale, box.width * scale, box.height * scale);
        ctx.strokeStyle = "red"; 
        ctx.lineWidth = 2;
      }
    });
  };

  const handleBoxClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    const clickedBoxIndex = boxes.findIndex(
      (box) =>
        clickX >= box.x &&
        clickX <= box.x + box.width &&
        clickY >= box.y &&
        clickY <= box.y + box.height
    );

    if (clickedBoxIndex !== -1) {
      setSelectedBoxIndex(clickedBoxIndex);
    } else {
      setSelectedBoxIndex(null);
    }
  };

  const handleDeleteBox = () => {
    if (selectedBoxIndex !== null) {
      const newBoxes = boxes.filter((_, index) => index !== selectedBoxIndex);
      setBoxes(newBoxes);
      setSelectedBoxIndex(null);
      drawBoxes(newBoxes);
    }
  };

  const handleOcr = async () => {
    if (boxes.length === 0) {
      alert("Please select at least one region for OCR.");
      return;
    }

    const croppedBlobs = [];
    for (const box of boxes) {
      const croppedImageBlob = await getCroppedImgBlob(
        imgElement,
        box.x,
        box.y,
        box.width,
        box.height
      );
      croppedBlobs.push(croppedImageBlob);
    }


    const formData = new FormData();
    croppedBlobs.forEach((blob, index) => {
      formData.append(
        `imageFiles[${index}]`,
        blob,
        `croppedImage_${index}.png`
      );
    });

    try {
      const response = await axios.post(
        "https://localhost:7009/api/ocr/ocr-image-batch",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setOcrText(response.data.text.join("\n\n"));
      console.log("OCR result:", response.data.text);
    } catch (error) {
      console.error("OCR failed", error);
      setOcrText("Error performing OCR");
    }
  };

  return (
    <div>
      <input type="file" onChange={handleImageChange} />
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleBoxClick}
        style={{ border: "1px solid black" }}
      ></canvas>
      <button onClick={handleOcr}>Run OCR</button>
      <button onClick={handleDeleteBox} disabled={selectedBoxIndex === null}>
        Delete Selected Box
      </button>
      {boxes.length > 0 && (
        <div>
          <h3>Detected Regions:</h3>
          {boxes.map((box, index) => (
            <p key={index}>
              Box {index + 1}: x={box.x}, y={box.y}, width={box.width}, height=
              {box.height}
            </p>
          ))}
        </div>
      )}
      {ocrText && (
        <div>
          <h3>OCR Result:</h3>
          <pre style={{ fontSize: "2em" }}>{ocrText}</pre>
        </div>
      )}
    </div>
  );
}

export default OcrCropper;