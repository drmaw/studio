

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CameraOff } from 'lucide-react';
import jsQR from 'jsqr';

export function QrScannerDialog({ children, onScan }: { children: React.ReactNode, onScan: (data: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const cleanupCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, [cleanupCamera]);
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      cleanupCamera();
    }
  };
  
  const startCamera = useCallback(async () => {
    if (!isOpen || !navigator.mediaDevices) return;
    cleanupCamera();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasCameraPermission(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings.',
      });
    }
  }, [isOpen, cleanupCamera, toast]);
  
  useEffect(() => {
      if (isOpen) {
          startCamera();
      } else {
          cleanupCamera();
      }
  }, [isOpen, startCamera, cleanupCamera]);

  useEffect(() => {
    let animationFrameId: number;

    const scanQrCode = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (context) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code) {
            onScan(code.data);
            handleOpenChange(false);
            toast({
              title: "QR Code Scanned",
              description: `Health ID: ${code.data}`,
            });
            return;
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanQrCode);
    };

    if (isOpen && hasCameraPermission) {
      animationFrameId = requestAnimationFrame(scanQrCode);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, hasCameraPermission, onScan, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Scan Patient's Health ID</DialogTitle>
          <DialogDescription>
            Point the camera at the QR code on the patient's ID card.
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-square w-full bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {hasCameraPermission === true ? (
             <>
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <div className="absolute inset-0 border-8 border-white/50 rounded-lg" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 20% 100%, 20% 20%, 80% 20%, 80% 80%, 20% 80%, 20% 100%, 100% 100%, 100% 0%)' }} />
                <canvas ref={canvasRef} className="hidden" />
             </>
          ) : (
            <div className="text-center p-4">
                <CameraOff className="h-12 w-12 text-muted-foreground mx-auto" />
                <h3 className="mt-2 font-semibold">Camera Access Needed</h3>
                <p className="text-sm text-muted-foreground">To scan QR codes, please allow camera access.</p>
                {hasCameraPermission === false && (
                    <Alert variant="destructive" className="mt-4 text-left">
                        <AlertTitle>Permission Denied</AlertTitle>
                        <AlertDescription>
                            Camera access was denied. You'll need to enable it in your browser's site settings to use this feature.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
