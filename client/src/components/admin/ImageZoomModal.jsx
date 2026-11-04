import React, { useState } from 'react';
import { FaTimes, FaSearchPlus, FaSearchMinus, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

export default function ImageZoomModal({ isOpen, images = [], initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || !images.length) return null;

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setZoomLevel(1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  };

  const zoomIn = (e) => {
    e.stopPropagation();
    setZoomLevel((z) => Math.min(z + 0.5, 3));
  };

  const zoomOut = (e) => {
    e.stopPropagation();
    setZoomLevel((z) => Math.max(z - 0.5, 1));
  };

  return (
    <div
      className='fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none'
      onClick={onClose}
    >
      {/* Top Header Controls */}
      <div className='w-full max-w-5xl flex items-center justify-between text-white text-xs py-2'>
        <div className='flex items-center gap-2'>
          <span className='font-bold text-amber-400'>Photo {currentIndex + 1} of {images.length}</span>
          <span className='text-slate-400'>• Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>

        <div className='flex items-center gap-2'>
          <button
            onClick={zoomOut}
            disabled={zoomLevel <= 1}
            className='p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition cursor-pointer'
            title='Zoom Out'
          >
            <FaSearchMinus />
          </button>
          <button
            onClick={zoomIn}
            disabled={zoomLevel >= 3}
            className='p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-xl transition cursor-pointer'
            title='Zoom In'
          >
            <FaSearchPlus />
          </button>
          <button
            onClick={onClose}
            className='p-2 bg-white/15 hover:bg-white/25 rounded-xl transition cursor-pointer ml-3'
            title='Close (ESC)'
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className='relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-2'
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage}
          alt={`Photo ${currentIndex + 1}`}
          style={{ transform: `scale(${zoomLevel})` }}
          className='max-h-[75vh] max-w-full object-contain transition-transform duration-200 rounded-xl shadow-2xl'
        />

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className='absolute left-2 p-3.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition cursor-pointer shadow-lg'
              title='Previous image'
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={handleNext}
              className='absolute right-2 p-3.5 bg-black/60 hover:bg-black/90 text-white rounded-full transition cursor-pointer shadow-lg'
              title='Next image'
            >
              <FaArrowRight />
            </button>
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className='w-full max-w-2xl flex items-center justify-center gap-2 overflow-x-auto py-2'
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setZoomLevel(1);
              }}
              className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                i === currentIndex ? 'border-amber-400 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt='' className='w-full h-full object-cover' />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
