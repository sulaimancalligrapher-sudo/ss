/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Upload, Trash2, StopCircle, RefreshCw, Check, AlertTriangle } from 'lucide-react';

interface MediaCaptureProps {
  onCaptureImage: (base64: string) => void;
  onCaptureVideo: (base64: string) => void;
  savedImageBase64: string | null;
  savedVideoBase64: string | null;
}

export default function MediaCapture({
  onCaptureImage,
  onCaptureVideo,
  savedImageBase64,
  savedVideoBase64
}: MediaCaptureProps) {
  const [mode, setMode] = useState<'idle' | 'image' | 'video'>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [error, setError] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Stop camera when component unmounts or mode changes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [mode]);

  const startCamera = async (type: 'image' | 'video') => {
    setError('');
    stopCamera();
    setMode(type);

    try {
      const constraints = {
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: type === 'video' ? true : false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error opening camera:', err);
      setError('تعذر تشغيل الكاميرا. يرجى التأكد من إعطاء صلاحية الكاميرا للمتصفح.');
      setMode('idle');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Image capture logic
  const handleTakeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 800;
      canvas.height = videoRef.current.videoHeight || 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Horizontal flip for mirrored selfie camera view
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Output as jpeg base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onCaptureImage(dataUrl);
        stopCamera();
        setMode('idle');
      }
    }
  };

  // Video recording logic
  const handleStartRecording = () => {
    if (!stream) return;
    setRecordedChunks([]);
    setIsRecording(true);

    try {
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8,opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onCaptureVideo(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(10); // capture slice every 10ms
    } catch (err) {
      console.error('Failed to start recorder:', err);
      // Fallback mimeType
      try {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            setRecordedChunks(prev => [...prev, event.data]);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/mp4' });
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              onCaptureVideo(reader.result);
            }
          };
          reader.readAsDataURL(blob);
        };
        recorder.start(10);
      } catch (innerErr) {
        setError('تعذر تسجيل الفيديو بنوع الترميز المتوفر في هذا المتصفح.');
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopCamera();
      setMode('idle');
    }
  };

  // Device file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (type === 'image') {
            onCaptureImage(reader.result);
          } else {
            onCaptureVideo(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4" id="media-capture-panel">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800 font-sans">تسجيل وإرسال التصحيح الإضافي (بالفيديو أو الصورة)</h3>
        {mode !== 'idle' && (
          <button
            onClick={() => { stopCamera(); setMode('idle'); }}
            className="text-xs font-bold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
          >
            إلغاء الكاميرا
          </button>
        )}
      </div>

      {/* Camera Live Preview Window */}
      {mode !== 'idle' && (
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video max-w-lg mx-auto border border-gray-950">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-full object-cover transform -scale-x-100"
          />
          
          {/* Active record blinker */}
          {isRecording && (
            <div className="absolute top-4 right-4 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-white" />
              <span>جاري تسجيل الفيديو...</span>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-3 px-4">
            {mode === 'image' && (
              <button
                onClick={handleTakeSnapshot}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>التقاط لقطة شاشة</span>
              </button>
            )}

            {mode === 'video' && !isRecording && (
              <button
                onClick={handleStartRecording}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                <Video className="w-4 h-4" />
                <span>بدء التسجيل</span>
              </button>
            )}

            {mode === 'video' && isRecording && (
              <button
                onClick={handleStopRecording}
                className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5"
              >
                <StopCircle className="w-4 h-4 text-red-500 animate-pulse" />
                <span>إنهاء وحفظ التسجيل</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-amber-50 border border-amber-100 text-amber-900 text-xs p-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Previews and Source Controls */}
      {mode === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Additional Snapshot Column */}
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <span className="text-xs font-bold text-gray-500 block font-sans">1. صورة تصحيح إضافية أو يدوي</span>
            
            {savedImageBase64 ? (
              <div className="relative aspect-video max-w-xs mx-auto rounded-lg overflow-hidden border border-gray-200">
                <img src={savedImageBase64} alt="Captured" className="w-full h-full object-cover" />
                <button
                  onClick={() => onCaptureImage('')}
                  className="absolute top-2 left-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>جاهز للإرسال</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => startCamera('image')}
                  className="flex-1 py-2.5 border border-indigo-200 hover:border-indigo-300 bg-indigo-50/20 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>تصوير مباشر</span>
                </button>
                
                <label className="flex-1 py-2.5 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span>رفع صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'image')}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Corrective Video Column */}
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <span className="text-xs font-bold text-gray-500 block font-sans">2. فيديو شرح تصحيحي قصير للمهارة</span>

            {savedVideoBase64 ? (
              <div className="relative aspect-video max-w-xs mx-auto rounded-lg overflow-hidden border border-gray-200 bg-black">
                <video src={savedVideoBase64} controls className="w-full h-full object-cover" />
                <button
                  onClick={() => onCaptureVideo('')}
                  className="absolute top-2 left-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>فيديو جاهز</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  onClick={() => startCamera('video')}
                  className="flex-1 py-2.5 border border-red-200 hover:border-red-300 bg-red-50/20 text-red-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Video className="w-4 h-4" />
                  <span>تسجيل فيديو</span>
                </button>

                <label className="flex-1 py-2.5 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition flex items-center justify-center gap-1.5">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span>رفع فيديو</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e, 'video')}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
