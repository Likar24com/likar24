"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area, Point } from "react-easy-crop";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob | null) => void;
  onCancel: () => void;
}

// Функція для обрізки зображення
async function getCroppedImg(
  imageSrc: string,
  croppedAreaPixels: Area,
  rotation = 0
): Promise<Blob | null> {
  // Зчитати зображення
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Обчислити розмір canvas
  const safeArea = Math.max(image.width, image.height) * 2;
  canvas.width = safeArea;
  canvas.height = safeArea;

  // Переносимо центр, крутимо
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(
    image,
    (safeArea - image.width) / 2,
    (safeArea - image.height) / 2
  );

  // Обрізати
  const data = ctx.getImageData(
    croppedAreaPixels.x + (safeArea - image.width) / 2,
    croppedAreaPixels.y + (safeArea - image.height) / 2,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  // Записати результат в новий canvas
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = croppedAreaPixels.width;
  cropCanvas.height = croppedAreaPixels.height;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) return null;
  cropCtx.putImageData(data, 0, 0);

  // В Blob
  return new Promise((resolve) => {
    cropCanvas.toBlob((file) => resolve(file), "image/jpeg");
  });
}

// Для завантаження зображення
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });
}

export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Обрізка
  const handleCrop = useCallback(async () => {
    if (!croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
      onCropComplete(croppedImage);
    } catch {
      onCropComplete(null);
    }
  }, [croppedAreaPixels, image, rotation, onCropComplete]);

  // Зум
  const handleZoomChange = (value: number) => {
    setZoom(Math.max(1, Math.min(value, 3)));
  };

  // Поворот
  const handleRotationChange = (value: number) => {
    setRotation(((value % 360) + 360) % 360);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white rounded-3xl shadow-2xl p-6 w-[90vw] max-w-md relative">
        <h2 className="text-xl font-bold text-center mb-4">Обрізати фото</h2>
        <div className="w-full aspect-square bg-gray-100 rounded-2xl overflow-hidden mb-4 relative">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            showGrid={false}
            cropShape="rect"
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
          />
        </div>
        {/* Зум */}
        <div className="flex items-center gap-2 mb-3">
          <span className="w-16 text-gray-700">Зум</span>
          <button
            type="button"
            className="rounded-full border w-8 h-8 flex items-center justify-center font-bold text-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => handleZoomChange(zoom - 0.1)}
          >−</button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => handleZoomChange(Number(e.target.value))}
            className="flex-1 accent-green-600"
          />
          <button
            type="button"
            className="rounded-full border w-8 h-8 flex items-center justify-center font-bold text-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => handleZoomChange(zoom + 0.1)}
          >+</button>
        </div>
        {/* Поворот */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-16 text-gray-700">Поворот</span>
          <button
            type="button"
            className="rounded-full border w-8 h-8 flex items-center justify-center font-bold text-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => handleRotationChange(rotation - 5)}
          >−</button>
          <input
            type="range"
            min={0}
            max={359}
            step={1}
            value={rotation}
            onChange={e => handleRotationChange(Number(e.target.value))}
            className="flex-1 accent-green-600"
          />
          <button
            type="button"
            className="rounded-full border w-8 h-8 flex items-center justify-center font-bold text-lg bg-gray-100 hover:bg-gray-200"
            onClick={() => handleRotationChange(rotation + 5)}
          >+</button>
        </div>
        {/* Кнопки */}
        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 rounded-xl bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold"
          >
            Відмінити
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="px-6 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-semibold"
          >
            Обрізати та зберегти
          </button>
        </div>
      </div>
    </div>
  );
}
