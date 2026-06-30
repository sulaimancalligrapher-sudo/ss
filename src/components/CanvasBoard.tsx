/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Pen, Eraser, RotateCcw, RotateCw, ZoomIn, ZoomOut, ArrowLeft, Save, Sparkles, Check, FileText, AlertCircle, Trash2, Stamp, Type } from 'lucide-react';
import { StudentRow, PredefinedText, WatermarkSettings } from '../types';
import { defaultStickers } from '../utils/simulator';
import MediaCapture from './MediaCapture';

interface CanvasBoardProps {
  student: StudentRow;
  presets: PredefinedText[];
  watermark: WatermarkSettings;
  onBack: () => void;
  onSave: (payload: any) => Promise<void>;
}

interface DrawPath {
  points: { x: number; y: number; pressure: number }[];
  lineWidth: number;
  lineColor: string;
  isChisel: boolean;
  nibAngle: number;
}

interface StampItem {
  x: number;
  y: number;
  svg: string;
  size: number;
}

interface TextItem {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export default function CanvasBoard({
  student,
  presets,
  watermark,
  onBack,
  onSave
}: CanvasBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tools state
  const [currentTool, setCurrentTool] = useState<'draw' | 'chisel' | 'sticker' | 'text'>('draw');
  const [lineWidth, setLineWidth] = useState(12);
  const [nibAngle, setNibAngle] = useState(45);
  const [lineColor, setLineColor] = useState('#e74c3c'); // classic correction red
  const [selectedSticker, setSelectedSticker] = useState<string>('st1');
  const [stickerSize, setStickerSize] = useState(100);
  const [selectedPresetText, setSelectedPresetText] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [fontSize, setFontSize] = useState(30);

  // Canvas drawing state
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [stamps, setStamps] = useState<StampItem[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  
  // Undo/Redo stacks
  const [history, setHistory] = useState<{ type: 'path' | 'stamp' | 'text'; index: number }[]>([]);
  const [redoStack, setRedoStack] = useState<{ type: 'path' | 'stamp' | 'text'; item: any }[]>([]);

  // Capture outputs
  const [extraImage, setExtraImage] = useState<string | null>(student.additionalImageUrl || null);
  const [extraVideo, setExtraVideo] = useState<string | null>(student.videoUrl || null);
  const [grade, setGrade] = useState<string>(student.imageGrade || '');
  const [notes, setNotes] = useState<string>(student.notes || '');

  // Loading/Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active drawing refs
  const isDrawing = useRef(false);
  const currentPathPoints = useRef<{ x: number; y: number; pressure: number }[]>([]);
  const lastTouch = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);

  // Load student image
  useEffect(() => {
    if (student.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setOriginalImage(img);
        resetZoomAndPan(img);
      };
      img.src = student.imageUrl;
    }
  }, [student]);

  // Adjust canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && originalImage) {
      // Set fixed visual size based on original image dimensions
      canvas.width = originalImage.width;
      canvas.height = originalImage.height;
      redraw();
    }
  }, [originalImage, rotation, paths, stamps, texts, zoom, pan]);

  const resetZoomAndPan = (img: HTMLImageElement) => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scaleX = (container.clientWidth - 40) / img.width;
      const scaleY = (container.clientHeight - 40) / img.height;
      const initialZoom = Math.min(scaleX, scaleY, 1);
      setZoom(initialZoom);
      setPan({
        x: (container.clientWidth - img.width * initialZoom) / 2,
        y: (container.clientHeight - img.height * initialZoom) / 2
      });
    }
  };

  // Drawing segment rendering calculations
  const drawSegment = (ctx: CanvasRenderingContext2D, p0: any, p1: any, angleDeg: number, baseW: number, color: string) => {
    const ang = (angleDeg * Math.PI) / 180.0;
    const nibU = { x: Math.cos(ang), y: Math.sin(ang) };
    
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const steps = Math.max(1, Math.floor(dist / 1.5));
    ctx.fillStyle = color;
    
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = p0.x + dx * t;
      const y = p0.y + dy * t;
      const pr = p0.pressure * (1 - t) + p1.pressure * t;
      const w = baseW * pr;
      const half = w / 2;
      
      const left = { x: x + nibU.x * half, y: y + nibU.y * half };
      const right = { x: x - nibU.x * half, y: y - nibU.y * half };
      
      ctx.beginPath();
      ctx.arc(x, y, half, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Canvas Redraw Logic
  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw student work as base
    ctx.save();
    // Rotation logic
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(originalImage, -originalImage.width / 2, -originalImage.height / 2);
    } else {
      ctx.drawImage(originalImage, 0, 0);
    }
    ctx.restore();

    // 2. Draw brush correction paths
    paths.forEach(path => {
      if (path.points.length === 0) return;
      ctx.save();
      
      if (path.isChisel) {
        for (let i = 0; i < path.points.length - 1; i++) {
          drawSegment(ctx, path.points[i], path.points[i + 1], path.nibAngle, path.lineWidth, path.lineColor);
        }
      } else {
        ctx.beginPath();
        ctx.strokeStyle = path.lineColor;
        ctx.lineWidth = path.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(path.points[0].x, path.points[0].y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. Draw Stamp Badges
    stamps.forEach(stamp => {
      const img = new Image();
      // Load SVG markup safely
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(stamp.svg);
      ctx.drawImage(img, stamp.x - stamp.size / 2, stamp.y - stamp.size / 2, stamp.size, stamp.size);
    });

    // 4. Draw Feedback Text comments
    texts.forEach(textItem => {
      ctx.save();
      ctx.font = `bold ${textItem.fontSize}px 'Tajawal', sans-serif`;
      ctx.direction = 'rtl';
      
      const lines = textItem.text.split('\n');
      const lineHeight = textItem.fontSize * 1.3;
      
      // Compute width for background box
      let maxWidth = 0;
      lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxWidth) maxWidth = metrics.width;
      });
      
      // Draw background tag for high legibility
      const pad = 12;
      const boxWidth = maxWidth + pad * 2;
      const boxHeight = lines.length * lineHeight + pad * 2;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.strokeStyle = textItem.color;
      ctx.lineWidth = 2;
      
      // Draw rounded rect
      ctx.beginPath();
      const rx = textItem.x - boxWidth;
      const ry = textItem.y - textItem.fontSize - pad;
      ctx.roundRect ? ctx.roundRect(rx, ry, boxWidth, boxHeight, 12) : ctx.rect(rx, ry, boxWidth, boxHeight);
      ctx.fill();
      ctx.stroke();
      
      // Draw text content
      ctx.fillStyle = textItem.color;
      lines.forEach((line, idx) => {
        ctx.fillText(line, textItem.x - pad, textItem.y + idx * lineHeight);
      });
      
      ctx.restore();
    });
  };

  // Convert visual pointer coords to original image matrix coordinates
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Relative offset on the canvas viewport
    const xOnCanvasViewport = (clientX - rect.left) / zoom;
    const yOnCanvasViewport = (clientY - rect.top) / zoom;

    // Scale precisely relative to canvas resolution
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    return { x, y };
  };

  // Handle pointer down
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCanvasCoords(e);
    if (!coords) return;

    if (currentTool === 'sticker') {
      const activeSticker = defaultStickers.find(s => s.id === selectedSticker);
      if (activeSticker) {
        const newStamp: StampItem = {
          x: coords.x,
          y: coords.y,
          svg: activeSticker.svg,
          size: stickerSize
        };
        setStamps(prev => [...prev, newStamp]);
        setHistory(prev => [...prev, { type: 'stamp', index: stamps.length }]);
        setRedoStack([]);
        redraw();
      }
      return;
    }

    if (currentTool === 'text') {
      const activeText = customText || selectedPresetText;
      if (!activeText) return;
      
      const newText: TextItem = {
        x: coords.x,
        y: coords.y,
        text: activeText,
        fontSize: fontSize,
        fontFamily: 'Tajawal',
        color: lineColor
      };
      setTexts(prev => [...prev, newText]);
      setHistory(prev => [...prev, { type: 'text', index: texts.length }]);
      setRedoStack([]);
      setCustomText('');
      redraw();
      return;
    }

    // Standard drawing
    isDrawing.current = true;
    currentPathPoints.current = [{ x: coords.x, y: coords.y, pressure: 1 }];
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const coords = getCanvasCoords(e);
    if (!coords) return;

    currentPathPoints.current.push({ x: coords.x, y: coords.y, pressure: 1 });
    
    // Smooth rendering of active line
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        redraw();
        // Render current active line overlay
        ctx.save();
        if (currentTool === 'chisel') {
          for (let i = 0; i < currentPathPoints.current.length - 1; i++) {
            drawSegment(ctx, currentPathPoints.current[i], currentPathPoints.current[i + 1], nibAngle, lineWidth, lineColor);
          }
        } else {
          ctx.beginPath();
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(currentPathPoints.current[0].x, currentPathPoints.current[0].y);
          for (let i = 1; i < currentPathPoints.current.length; i++) {
            ctx.lineTo(currentPathPoints.current[i].x, currentPathPoints.current[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentPathPoints.current.length > 0) {
      const newPath: DrawPath = {
        points: [...currentPathPoints.current],
        lineWidth,
        lineColor,
        isChisel: currentTool === 'chisel',
        nibAngle
      };
      setPaths(prev => [...prev, newPath]);
      setHistory(prev => [...prev, { type: 'path', index: paths.length }]);
      setRedoStack([]);
    }
    currentPathPoints.current = [];
    redraw();
  };

  // Undo / Redo actions
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    if (lastAction.type === 'path') {
      const item = paths[lastAction.index];
      setRedoStack(prev => [...prev, { type: 'path', item }]);
      setPaths(prev => prev.filter((_, idx) => idx !== lastAction.index));
    } else if (lastAction.type === 'stamp') {
      const item = stamps[lastAction.index];
      setRedoStack(prev => [...prev, { type: 'stamp', item }]);
      setStamps(prev => prev.filter((_, idx) => idx !== lastAction.index));
    } else if (lastAction.type === 'text') {
      const item = texts[lastAction.index];
      setRedoStack(prev => [...prev, { type: 'text', item }]);
      setTexts(prev => prev.filter((_, idx) => idx !== lastAction.index));
    }
    redraw();
  };

  // Rotation Logic
  const handleRotate90 = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleClearAll = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع الخطوط والستيكرات المرسومة على السبورة؟')) {
      setPaths([]);
      setStamps([]);
      setTexts([]);
      setHistory([]);
      setRedoStack([]);
    }
  };

  // Watermark Render Overlay & Save Compilation
  const compileSavedImage = async (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas || !originalImage) {
        resolve('');
        return;
      }

      // We compile image exactly at standard rendering size
      const saveCanvas = document.createElement('canvas');
      saveCanvas.width = canvas.width;
      saveCanvas.height = canvas.height;
      const sCtx = saveCanvas.getContext('2d');
      if (!sCtx) {
        resolve('');
        return;
      }

      // 1. Draw base drawings from original canvas
      sCtx.drawImage(canvas, 0, 0);

      // 2. Render Watermark text prefix
      if (watermark.textPrefix) {
        sCtx.save();
        sCtx.font = `bold ${watermark.fontSize + 4}px 'Tajawal', sans-serif`;
        sCtx.direction = 'rtl';
        const dateStr = new Date().toISOString().split('T')[0];
        const textToDraw = `${watermark.textPrefix} &bull; طالب: ${student.studentName} &bull; درس: ${student.lessonNumber} &bull; تاريخ: ${dateStr}`;
        
        const pad = 12;
        const textWidth = sCtx.measureText(textToDraw).width;
        let wx = pad;
        let wy = saveCanvas.height - pad - watermark.fontSize;

        if (watermark.textPosition === 'top-left') {
          wx = pad; wy = pad + watermark.fontSize;
        } else if (watermark.textPosition === 'top-right') {
          wx = saveCanvas.width - pad - textWidth; wy = pad + watermark.fontSize;
        } else if (watermark.textPosition === 'bottom-right') {
          wx = saveCanvas.width - pad - textWidth; wy = saveCanvas.height - pad;
        }

        // Draw opaque background box
        sCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        sCtx.fillRect(wx - pad, wy - watermark.fontSize - pad, textWidth + pad * 2, watermark.fontSize + pad * 2);

        sCtx.fillStyle = '#111827';
        sCtx.fillText(textToDraw, wx, wy);
        sCtx.restore();
      }

      // 3. Render Logo watermark
      if (watermark.logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.onload = () => {
          sCtx.save();
          sCtx.globalAlpha = watermark.opacity;
          
          const lw = saveCanvas.width * watermark.sizeFactor;
          const lh = (logoImg.height * lw) / logoImg.width;
          
          let lx = 20;
          let ly = 20;

          if (watermark.logoPosition === 'top-right') {
            lx = saveCanvas.width - lw - 20; ly = 20;
          } else if (watermark.logoPosition === 'bottom-left') {
            lx = 20; ly = saveCanvas.height - lh - 20;
          } else if (watermark.logoPosition === 'bottom-right') {
            lx = saveCanvas.width - lw - 20; ly = saveCanvas.height - lh - 20;
          }

          sCtx.drawImage(logoImg, lx, ly, lw, lh);
          sCtx.restore();
          resolve(saveCanvas.toDataURL('image/jpeg', 0.9));
        };
        logoImg.onerror = () => {
          // Fallback if logo fails
          resolve(saveCanvas.toDataURL('image/jpeg', 0.9));
        };
        logoImg.src = watermark.logoUrl;
      } else {
        resolve(saveCanvas.toDataURL('image/jpeg', 0.9));
      }
    });
  };

  const handleSaveCorrection = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const watermarkedBase64 = await compileSavedImage();
      const payload = {
        canvasBase64: watermarkedBase64,
        imageBase64: extraImage,
        videoBase64: extraVideo,
        rowNumber: student.rowNumber,
        notes: notes,
        imageGrade: grade
      };

      await onSave(payload);
      setSaveSuccess(true);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      setSaveError(err.message || 'عذراً! حدث خطأ أثناء الاتصال وحفظ التصحيح.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="canvas-board-panel">
      {/* Top Header info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 border border-gray-100 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-gray-400 font-sans">تلميذ الفوج الأول &bull; {student.studentId}</span>
            <h2 className="text-lg font-bold text-gray-900 font-sans">{student.studentName}</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
          <div className="bg-gray-50 px-3 py-2 rounded-xl text-center">
            <span className="text-gray-400 block font-sans">رقم الدرس</span>
            <span className="text-gray-900 text-sm font-mono">{student.lessonNumber}</span>
          </div>
          <div className="bg-gray-50 px-3 py-2 rounded-xl text-center">
            <span className="text-gray-400 block font-sans">المادة / الخط</span>
            <span className="text-gray-900 text-sm font-sans">{student.additionalU}</span>
          </div>
          <div className="bg-gray-50 px-3 py-2 rounded-xl text-center">
            <span className="text-gray-400 block font-sans">عنوان التدريب</span>
            <span className="text-gray-900 text-sm font-sans">{student.additionalV}</span>
          </div>
        </div>
      </div>

      {/* Main Drawing Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Calligrapher Toolbox Sidebar */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-6 h-fit">
          <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3 font-sans">أدوات الخطاط والمعلم</h3>
          
          {/* Tool selectors */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrentTool('draw')}
              className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                currentTool === 'draw'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                  : 'border-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <Pen className="w-4 h-4" />
              <span>قلم تصحيح عادي</span>
            </button>
            <button
              onClick={() => setCurrentTool('chisel')}
              className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                currentTool === 'chisel'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                  : 'border-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <Pen className="w-4 h-4 transform rotate-45" />
              <span>قلم خطاط مشطوف</span>
            </button>
            <button
              onClick={() => setCurrentTool('sticker')}
              className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                currentTool === 'sticker'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                  : 'border-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <Stamp className="w-4 h-4" />
              <span>أختام تشجيعية</span>
            </button>
            <button
              onClick={() => setCurrentTool('text')}
              className={`p-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                currentTool === 'text'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950'
                  : 'border-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>إضافة ملاحظة نصية</span>
            </button>
          </div>

          {/* Sizing sliders & angle controllers */}
          {(currentTool === 'draw' || currentTool === 'chisel') && (
            <div className="space-y-4 pt-2 border-t border-gray-50">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>سمك خط القلم</span>
                  <span className="font-mono">{lineWidth} px</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="100"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {currentTool === 'chisel' && (
                <div className="space-y-1.5 animate-fade-in">
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>زاوية الشطفة</span>
                    <span className="font-mono">{nibAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={nibAngle}
                    onChange={(e) => setNibAngle(Number(e.target.value))}
                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>زاوية حادة</span>
                    <span>خط الرقعة المعتاد (45° - 75°)</span>
                    <span>زاوية مسطحة</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Color Palettes */}
          {(currentTool === 'draw' || currentTool === 'chisel' || currentTool === 'text') && (
            <div className="space-y-2 border-t border-gray-50 pt-3">
              <span className="text-xs font-bold text-gray-400 block font-sans">لون تصحيح الحبر</span>
              <div className="flex gap-2">
                {[
                  { hex: '#e74c3c', name: 'أحمر' },
                  { hex: '#27ae60', name: 'أخضر' },
                  { hex: '#2980b9', name: 'أزرق' },
                  { hex: '#1a1a1a', name: 'أسود' },
                  { hex: '#f39c12', name: 'ذهبي' }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setLineColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    className={`w-8 h-8 rounded-full transition-all flex items-center justify-center relative ${
                      lineColor === color.hex ? 'ring-4 ring-indigo-600/10 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {lineColor === color.hex && (
                      <span className="h-2.5 w-2.5 bg-white rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stickers menu */}
          {currentTool === 'sticker' && (
            <div className="space-y-4 border-t border-gray-50 pt-3 animate-fade-in">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>حجم ختم التشجيع</span>
                  <span className="font-mono">{stickerSize} px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="200"
                  value={stickerSize}
                  onChange={(e) => setStickerSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 block font-sans">اضغط على أحد الأختام ثم اضغط على السبورة لوضعه:</span>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-gray-50 rounded-xl">
                  {defaultStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => setSelectedSticker(sticker.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition hover:bg-gray-50 ${
                        selectedSticker === sticker.id ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-100'
                      }`}
                    >
                      <div className="w-12 h-12" dangerouslySetInnerHTML={{ __html: sticker.svg }} />
                      <span className="text-[10px] font-bold text-gray-700 mt-1">{sticker.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Text Preset Menu */}
          {currentTool === 'text' && (
            <div className="space-y-4 border-t border-gray-50 pt-3 animate-fade-in">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>حجم خط الملاحظة</span>
                  <span className="font-mono">{fontSize} px</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="80"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-400 block font-sans">اختر ملاحظة جاهزة أو اكتب ملاحظة مخصصة:</span>
                <select
                  value={selectedPresetText}
                  onChange={(e) => {
                    setSelectedPresetText(e.target.value);
                    setCustomText('');
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- اختر عبارة تقييم خطاط --</option>
                  {presets.map((preset, idx) => (
                    <option key={idx} value={preset.phrase}>
                      {preset.title}
                    </option>
                  ))}
                </select>

                <textarea
                  placeholder="أو اكتب هنا ملاحظة مخصصة..."
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    setSelectedPresetText('');
                  }}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                />

                <span className="text-[10px] text-indigo-600 font-bold block bg-indigo-50 p-2.5 rounded-lg">
                  💡 انقر على السبورة لوضع النص في المكان المناسب بعد اختياره.
                </span>
              </div>
            </div>
          )}

          {/* Quick Clear & Rotation Actions */}
          <div className="border-t border-gray-50 pt-4 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className={`flex-1 py-2 rounded-xl border border-gray-100 font-bold text-xs flex items-center justify-center gap-1 transition ${
                  history.length > 0 ? 'hover:bg-gray-50 text-gray-700' : 'opacity-40 cursor-not-allowed text-gray-400'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>تراجع</span>
              </button>
              <button
                onClick={handleRotate90}
                className="flex-1 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center justify-center gap-1 transition"
              >
                <RotateCw className="w-4 h-4" />
                <span>تدوير 90°</span>
              </button>
            </div>
            <button
              onClick={handleClearAll}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Eraser className="w-4 h-4" />
              <span>مسح السبورة بالكامل</span>
            </button>
          </div>

        </div>

        {/* Large Drawing Stage */}
        <div className="lg:col-span-3 flex flex-col space-y-4">
          <div
            ref={containerRef}
            className="bg-slate-100 border border-slate-200 rounded-2xl shadow-inner aspect-video overflow-auto flex items-center justify-center relative min-h-[400px] lg:min-h-[500px]"
          >
            {originalImage ? (
              <canvas
                ref={canvasRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
                className={`shadow-lg bg-white rounded-lg select-none cursor-crosshair max-w-full`}
                style={{
                  width: `${originalImage.width * zoom}px`,
                  height: `${originalImage.height * zoom}px`
                }}
              />
            ) : (
              <div className="text-center space-y-3 p-8">
                <div className="animate-spin border-4 border-indigo-600 border-t-transparent rounded-full h-10 w-10 mx-auto" />
                <p className="text-sm text-gray-500 font-sans">جاري تحميل صورة كراسة الطالب...</p>
              </div>
            )}

            {/* Float Overlay Zoom Controls */}
            {originalImage && (
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-100 p-1.5 rounded-2xl flex items-center gap-2 shadow">
                <button
                  onClick={() => setZoom(z => Math.max(z - 0.1, 0.1))}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition"
                  title="تصغير"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-gray-800 w-12 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(z + 0.1, 3))}
                  className="p-2 hover:bg-gray-50 rounded-xl text-gray-600 transition"
                  title="تكبير"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Web camera and Upload extra feedback */}
          <MediaCapture
            onCaptureImage={setExtraImage}
            onCaptureVideo={setExtraVideo}
            savedImageBase64={extraImage}
            savedVideoBase64={extraVideo}
          />

          {/* Note Input and Grade */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Grade input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 font-sans block">الدرجة أو مستوى التقييم (خط)</label>
              <input
                type="text"
                placeholder="مثلاً: 10/10 أو ممتاز"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:bg-white text-right"
              />
            </div>

            {/* Notes input */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-bold text-gray-500 font-sans block">التوجيه العام أو الملاحظات المكتوبة</label>
              <textarea
                placeholder="أدخل نصائح وتوجيهات للمعلم أو الطالب..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={1}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:bg-white text-right resize-none"
              />
            </div>

          </div>

          {/* Feedback response save alerts */}
          {saveError && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-red-950 text-sm block">حدث خطأ أثناء الحفظ المباشر</span>
                <p className="text-xs text-red-900 mt-1">{saveError}</p>
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-bold text-emerald-950 text-sm">تم حفظ التقييم والتصحيح ومزامنته مع الشيت بنجاح! جاري العودة...</span>
            </div>
          )}

          {/* Large Save Controls */}
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 text-sm"
            >
              <span>العودة للجدول</span>
            </button>
            <button
              onClick={handleSaveCorrection}
              disabled={isSaving || saveSuccess}
              className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-md hover:shadow-indigo-600/15 flex items-center justify-center gap-2 disabled:opacity-85 text-sm"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin border-2 border-white border-t-transparent rounded-full h-5 w-5" />
                  <span>جاري رفع وتصدير التصحيح إلى قوقل شيت وقوقل درايف...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>تصدير وحفظ التصحيح النهائي (تم)</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
