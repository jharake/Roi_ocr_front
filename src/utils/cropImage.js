// utils/cropImage.js

export const getCroppedImgBlob = (image, x, y, width, height) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;
  
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
  
      // back to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject("Failed to crop image");
        }
      }, "image/png");
    });
  };
  