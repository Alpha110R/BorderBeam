import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, VideoOff, AlertCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CameraStreamModal({ isOpen, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);

  const startCamera = async () => {
    setError(null);
    setIsCameraLoading(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (err.name === "NotAllowedError") {
          setError("Camera access was denied. Please allow camera access in your browser settings.");
        } else if (err.name === "NotFoundError") {
          setError("No camera found. Please ensure a camera is connected and enabled.");
        } else {
          setError(`Error accessing camera: ${err.message}`);
        }
      } finally {
        setIsCameraLoading(false);
      }
    } else {
      setError("Your browser does not support camera access (getUserMedia API).");
      setIsCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleModalOpenChange = (open) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleModalOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center text-lg">
            <Camera className="w-5 h-5 mr-2 text-blue-600" />
            Live Camera Stream
          </DialogTitle>
          <DialogClose asChild>
             <Button variant="ghost" size="icon" className="absolute right-4 top-3">
                <X className="h-5 w-5" />
             </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {isCameraLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50">
              <Camera className="w-12 h-12 mb-2 animate-pulse" />
              <p>Starting camera...</p>
            </div>
          )}
          {!isCameraLoading && error && (
            <div className="p-6 w-full">
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className={`w-full h-full object-cover ${error || isCameraLoading ? 'hidden' : ''}`}
            style={{ transform: 'scaleX(-1)' }} // Mirror the video for a more natural webcam feel
          />
          {!isCameraLoading && !error && !streamRef.current && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <VideoOff className="w-12 h-12 mb-2" />
                <p>Camera not streaming</p>
             </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}