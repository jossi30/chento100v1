import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * CameraCaptureModal Component
 * Allows users to take live photos using their device camera (desktop webcam or mobile front/rear camera)
 * with instant preview, camera switching, retake capability, and mobile native camera integration.
 */
export default function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  maxAllowed = 6,
  currentCount = 0,
}) {
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  const remainingSlots = Math.max(0, maxAllowed - currentCount);

  // Clean up all video tracks
  const cleanupStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      setStream(null);
    }
  }, [stream]);

  const startCamera = useCallback(async (mode) => {
    setIsLoadingCamera(true);
    setCameraError(null);
    cleanupStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsLoadingCamera(false);
      setCameraError(
        'Camera access is not supported in this browser. Please use the device photo selector or update your browser.'
      );
      return;
    }

    try {
      // First attempt with preferred facingMode and high resolution
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch (modeErr) {
        console.warn('Ideal facingMode constraint failed, falling back to basic video:', modeErr);
        // Fallback to any available video stream
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((playErr) => {
            console.warn('Video play error:', playErr);
          });
        };
      }
    } catch (err) {
      console.warn('Camera access notice:', err?.message || err);
      let message = 'Unable to access device camera.';
      const errStr = (err?.name || '') + ' ' + (err?.message || '');
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        errStr.toLowerCase().includes('permission denied') ||
        errStr.toLowerCase().includes('not allowed')
      ) {
        message =
          'Camera access was denied or restricted by your browser. You can allow camera access in your browser address bar/settings, or use the Device Camera button below to take a photo directly.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        message = 'No camera device found on this system. You can still choose or upload images from your device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        message = 'Camera is currently in use by another application or tab.';
      }
      setCameraError(message);
    } finally {
      setIsLoadingCamera(false);
    }
  }, [cleanupStream]);

  // Check if multiple cameras are available on the device
  useEffect(() => {
    if (!isOpen) return;

    const checkDevices = async () => {
      try {
        if (navigator.mediaDevices?.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter((d) => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        }
      } catch (err) {
        console.warn('Device enumeration not supported or permitted:', err);
      }
    };

    checkDevices();
  }, [isOpen]);

  // Start or restart camera stream when modal opens or facingMode changes
  useEffect(() => {
    if (!isOpen) {
      cleanupStream();
      setCapturedPhotoUrl(null);
      setCameraError(null);
      return;
    }

    startCamera(facingMode);

    return () => {
      cleanupStream();
    };
  }, [isOpen, facingMode, cleanupStream, startCamera]);

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  const handleCaptureShutter = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Trigger visual flash animation
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 200);

    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If using front camera ('user'), flip horizontally so it acts like a mirror
    if (facingMode === 'user') {
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhotoUrl(dataUrl);
  };

  const handleRetake = () => {
    setCapturedPhotoUrl(null);
  };

  // Convert captured dataUrl to a standard File object and submit
  const handleConfirmPhoto = async (keepShooting = false) => {
    if (!capturedPhotoUrl) return;

    setIsProcessing(true);
    try {
      // Convert data URL to Blob/File
      const res = await fetch(capturedPhotoUrl);
      const blob = await res.blob();
      const fileName = `camera_photo_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      await onCapture(file);

      if (keepShooting && remainingSlots > 1) {
        setCapturedPhotoUrl(null);
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Error saving captured photo:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Native device camera fallback input (triggers system camera app on Android/iOS)
  const handleNativeCameraTrigger = () => {
    nativeCameraInputRef.current?.click();
  };

  const handleNativeFileInput = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onCapture(files[0]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id='camera-capture-modal'
      className='fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn'
      onClick={onClose}
    >
      <div
        className='relative bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden Canvas for High-Resolution Capture */}
        <canvas ref={canvasRef} className='hidden' />

        {/* Hidden Native Camera File Input for Mobile Fallback */}
        <input
          ref={nativeCameraInputRef}
          type='file'
          accept='image/*'
          capture='environment'
          className='hidden'
          onChange={handleNativeFileInput}
        />

        {/* Top Header Bar */}
        <div className='flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90 text-white'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center'>
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z'
                />
                <circle cx='12' cy='13' r='3' strokeWidth='2' />
              </svg>
            </div>
            <div>
              <h3 className='font-bold text-sm sm:text-base text-slate-100 leading-tight'>
                Device Camera
              </h3>
              <p className='text-[11px] text-slate-400'>
                {remainingSlots} of {maxAllowed} photo slots available
              </p>
            </div>
          </div>

          <div className='flex items-center gap-1.5'>
            {/* Rule-of-thirds Grid Toggle */}
            {!capturedPhotoUrl && !cameraError && (
              <button
                type='button'
                onClick={() => setShowGrid(!showGrid)}
                title='Toggle Framing Grid'
                className={`p-2 rounded-lg text-xs transition ${
                  showGrid
                    ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 8h16M4 16h16M8 4v16M16 4v16' />
                </svg>
              </button>
            )}

            {/* Switch Camera Button (Front / Rear) */}
            {!capturedPhotoUrl && !cameraError && (
              <button
                type='button'
                onClick={handleToggleFacingMode}
                title={`Switch to ${facingMode === 'environment' ? 'Front' : 'Back'} Camera`}
                className='p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1 text-xs'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                <span className='hidden sm:inline text-[11px]'>
                  {facingMode === 'environment' ? 'Rear' : 'Front'}
                  {hasMultipleCameras && ' (Dual)'}
                </span>
              </button>
            )}

            {/* Close Modal */}
            <button
              type='button'
              onClick={onClose}
              className='p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition'
              aria-label='Close Camera'
            >
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewfinder / Preview Container */}
        <div className='relative w-full bg-black aspect-[4/3] sm:aspect-[16/10] overflow-hidden flex items-center justify-center'>
          {/* Shutter Flash Animation */}
          {isShutterFlashing && (
            <div className='absolute inset-0 bg-white z-30 opacity-90 transition-opacity duration-150' />
          )}

          {/* Captured Photo Preview Screen */}
          {capturedPhotoUrl ? (
            <div className='relative w-full h-full flex items-center justify-center bg-black'>
              <img
                src={capturedPhotoUrl}
                alt='Captured listing snapshot'
                className='w-full h-full object-contain'
              />
              <div className='absolute top-3 left-3 bg-emerald-600/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-md backdrop-blur-xs flex items-center gap-1.5'>
                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
                </svg>
                Photo Captured
              </div>
            </div>
          ) : cameraError ? (
            /* Error & Permission Denied Screen */
            <div className='p-6 text-center text-slate-300 max-w-md flex flex-col items-center gap-3'>
              <div className='w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center'>
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
                  />
                </svg>
              </div>
              <h4 className='text-base font-bold text-white'>Camera Permission Notice</h4>
              <p className='text-xs text-slate-300 leading-relaxed'>{cameraError}</p>
              <div className='flex flex-wrap items-center justify-center gap-2 pt-2'>
                <button
                  type='button'
                  onClick={handleNativeCameraTrigger}
                  className='px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer'
                >
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' />
                    <circle cx='12' cy='13' r='3' strokeWidth='2' />
                  </svg>
                  <span>Take Photo with Device Camera</span>
                </button>
                <button
                  type='button'
                  onClick={() => startCamera(facingMode)}
                  className='px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition border border-slate-700 cursor-pointer'
                >
                  Retry Live Feed
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Feed */
            <>
              {isLoadingCamera && (
                <div className='absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center gap-2 text-slate-300'>
                  <span className='w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin' />
                  <span className='text-xs font-medium'>Initializing camera feed...</span>
                </div>
              )}

              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${
                  facingMode === 'user' ? 'scale-x-[-1]' : ''
                }`}
              />

              {/* Viewfinder Rule-of-Thirds Grid */}
              {showGrid && !isLoadingCamera && (
                <div className='absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10'>
                  <div className='border-r border-b border-white/20' />
                  <div className='border-r border-b border-white/20' />
                  <div className='border-b border-white/20' />
                  <div className='border-r border-b border-white/20' />
                  <div className='border-r border-b border-white/20' />
                  <div className='border-b border-white/20' />
                  <div className='border-r border-white/20' />
                  <div className='border-r border-white/20' />
                  <div />
                </div>
              )}

              {/* Viewfinder Corner Framing Brackets */}
              <div className='absolute inset-4 pointer-events-none z-10'>
                <div className='absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-400/80' />
                <div className='absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-400/80' />
                <div className='absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-400/80' />
                <div className='absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-400/80' />
              </div>
            </>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className='p-4 bg-slate-900 border-t border-slate-800 text-white'>
          {capturedPhotoUrl ? (
            /* Action Buttons After Photo Snapped */
            <div className='flex flex-col sm:flex-row items-center justify-between gap-3'>
              <button
                type='button'
                onClick={handleRetake}
                disabled={isProcessing}
                className='w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                <span>Retake Photo</span>
              </button>

              <div className='flex items-center gap-2 w-full sm:w-auto'>
                {remainingSlots > 1 && (
                  <button
                    type='button'
                    onClick={() => handleConfirmPhoto(true)}
                    disabled={isProcessing}
                    className='flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer'
                  >
                    <span>Keep &amp; Take Another</span>
                  </button>
                )}

                <button
                  type='button'
                  onClick={() => handleConfirmPhoto(false)}
                  disabled={isProcessing}
                  className='flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer'
                >
                  {isProcessing ? (
                    <>
                      <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      <span>Optimizing...</span>
                    </>
                  ) : (
                    <>
                      <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M5 13l4 4L19 7' />
                      </svg>
                      <span>Use This Photo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : !cameraError ? (
            /* Live Shutter Controls */
            <div className='flex items-center justify-between gap-4'>
              {/* Left Action: Mobile Camera App Launcher */}
              <button
                type='button'
                onClick={handleNativeCameraTrigger}
                className='text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition'
                title='Open Native Device Camera'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z'
                  />
                </svg>
                <span className='hidden sm:inline'>Device Camera App</span>
              </button>

              {/* Center Shutter Button */}
              <div className='flex items-center justify-center flex-1'>
                <button
                  type='button'
                  onClick={handleCaptureShutter}
                  disabled={isLoadingCamera}
                  id='camera-shutter-button'
                  className='group relative w-16 h-16 rounded-full border-4 border-white/80 hover:border-emerald-400 p-1 flex items-center justify-center transition-all duration-150 transform active:scale-90 focus:outline-none cursor-pointer'
                  aria-label='Take Photo'
                >
                  <div className='w-full h-full rounded-full bg-white group-hover:bg-emerald-400 transition-colors duration-150 shadow-inner' />
                </button>
              </div>

              {/* Right Action: Flip Camera if multiple devices */}
              <button
                type='button'
                onClick={handleToggleFacingMode}
                className='text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-800 transition'
                title='Switch Camera'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                <span className='hidden sm:inline'>Flip</span>
              </button>
            </div>
          ) : (
            /* Close button when error */
            <div className='flex justify-end'>
              <button
                type='button'
                onClick={onClose}
                className='px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg'
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
