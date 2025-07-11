export default function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  return new Promise((resolve) => {
    const image = new window.Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      // --- Rotation logic
      if (rotation) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
          image,
          pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
          -pixelCrop.width / 2, -pixelCrop.height / 2, pixelCrop.width, pixelCrop.height
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          image,
          pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
          0, 0, pixelCrop.width, pixelCrop.height
        );
      }
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'cropped.jpeg', { type: 'image/jpeg' });
          resolve(file);
        } else {
          resolve(null);
        }
      }, 'image/jpeg');
    };
    image.onerror = () => resolve(null);
  });
}
