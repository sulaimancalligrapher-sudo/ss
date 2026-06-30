/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Mic, Trash2, ArrowLeft, Save, Check, Volume2, Smile, AlertCircle, PlayCircle } from 'lucide-react';
import { StudentRow } from '../types';

interface AudioCorrectionProps {
  student: StudentRow;
  onBack: () => void;
  onSave: (payload: any) => Promise<void>;
}

export default function AudioCorrection({
  student,
  onBack,
  onSave
}: AudioCorrectionProps) {
  const [isPlayingStudent, setIsPlayingStudent] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(student.correctionAudioUrl || null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(student.correctionAudioUrl || null);
  const [grade, setGrade] = useState<string>(student.audioGrade || '');
  const [notes, setNotes] = useState<string>(student.notes || '');
  const [error, setError] = useState<string>('');
  
  // Save states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Audio refs
  const studentAudioRef = useRef<HTMLAudioElement | null>(null);
  const teacherAudioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Wave visualizer state
  const [waveBands, setWaveBands] = useState<number[]>(Array(16).fill(10));
  const visualizerInterval = useRef<any>(null);

  useEffect(() => {
    return () => {
      stopRecordingGracefully();
      if (visualizerInterval.current) clearInterval(visualizerInterval.current);
    };
  }, []);

  // Quick Emoji reactions to append to Notes
  const emojis = ['👍', '⭐', '👏', '🌸', '❤️', '🎤', '📖', '✨', '🏆', '💯'];
  const handleAddEmoji = (emoji: string) => {
    setNotes(prev => prev + ' ' + emoji);
  };

  const handlePlayStudent = () => {
    if (studentAudioRef.current) {
      if (isPlayingStudent) {
        studentAudioRef.current.pause();
        setIsPlayingStudent(false);
      } else {
        studentAudioRef.current.play();
        setIsPlayingStudent(true);
      }
    }
  };

  const handleStudentAudioEnded = () => {
    setIsPlayingStudent(false);
  };

  // Start microphone capture
  const handleStartRecording = async () => {
    setError('');
    chunksRef.current = [];
    setRecordedBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setIsRecording(true);

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setRecordedBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();

      // Mock voice wave animation
      visualizerInterval.current = setInterval(() => {
        setWaveBands(Array(24).fill(0).map(() => Math.floor(Math.random() * 45) + 5));
      }, 100);

    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      setError('تعذر الوصول إلى الميكروفون. يرجى تفعيل صلاحية الميكروفون للموقع.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopRecordingGracefully();
      if (visualizerInterval.current) {
        clearInterval(visualizerInterval.current);
        visualizerInterval.current = null;
      }
    }
  };

  const stopRecordingGracefully = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  const handleDeleteRecording = () => {
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordedBase64(null);
    setWaveBands(Array(16).fill(10));
  };

  const handleSaveAudioCorrection = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const payload = {
        audioBase64: recordedBase64,
        rowNumber: student.rowNumber,
        notes: notes,
        audioGrade: grade
      };

      await onSave(payload);
      setSaveSuccess(true);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'فشل حفظ وتسجيل التصحيح الصوتي.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="audio-correction-panel">
      
      {/* Upper Info Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 border border-gray-100 hover:bg-gray-50 rounded-xl text-gray-500 hover:text-gray-900 transition active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-xs font-bold text-gray-400 font-sans">تصحيح تلاوة وصوتيات &bull; {student.studentId}</span>
            <h2 className="text-lg font-bold text-gray-900 font-sans">{student.studentName}</h2>
          </div>
        </div>

        <div className="bg-sky-50 px-3 py-2 rounded-xl text-center text-xs font-bold text-sky-950">
          <span className="text-sky-600 block mb-0.5 font-sans">تسميع الدرس</span>
          <span className="text-sm font-mono">الدرس {student.lessonNumber}</span>
        </div>
      </div>

      {/* Split Audio Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Student Original Audio Player */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center justify-between space-y-6">
          <div className="space-y-2">
            <div className="p-4 bg-sky-50 text-sky-600 rounded-2xl w-fit mx-auto">
              <Volume2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 font-sans">تسميع الطالب الأصلي</h3>
            <p className="text-xs text-gray-400 font-sans">تلاوة وقراءة الطالب المرسلة للتصحيح والتقييم</p>
          </div>

          {student.audioUrl ? (
            <div className="w-full space-y-4">
              <audio
                ref={studentAudioRef}
                src={student.audioUrl}
                onEnded={handleStudentAudioEnded}
                className="hidden"
                controls
              />
              
              <button
                onClick={handlePlayStudent}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2 ${
                  isPlayingStudent
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/10'
                    : 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/10'
                }`}
              >
                {isPlayingStudent ? (
                  <>
                    <Pause className="w-5 h-5" />
                    <span>إيقاف مؤقت للتسميع</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>تشغيل تلاوة الطالب</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2.5 justify-center text-xs text-gray-400">
                <span>المستوى: {student.additionalU}</span>
                <span>&bull;</span>
                <span>المادة: {student.additionalV}</span>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 text-red-900 border border-red-100 p-4 rounded-xl text-xs font-bold leading-relaxed w-full">
              عذراً! لا يتوفر ملف تلاوة صوتي مسجل لهذا الدرس في جدول البيانات.
            </div>
          )}
        </div>

        {/* Teacher Feedback Audio Recorder */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center justify-between space-y-6">
          <div className="space-y-2">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
              <Mic className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-900 font-sans">تسجيل الرد الصوتي والتوجه</h3>
            <p className="text-xs text-gray-400 font-sans">سجل قراءتك التصحيحية أو تعليقك الصوتي التوجيهي للطالب</p>
          </div>

          {/* Wave animator */}
          {isRecording && (
            <div className="flex items-end justify-center gap-1 h-12 w-full px-8">
              {waveBands.map((height, i) => (
                <div
                  key={i}
                  style={{ height: `${height}%` }}
                  className="bg-indigo-600 w-1 rounded-full transition-all duration-100"
                />
              ))}
            </div>
          )}

          <div className="w-full space-y-4">
            {!recordedUrl ? (
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2 ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/10'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                }`}
              >
                {isRecording ? (
                  <>
                    <Square className="w-5 h-5" />
                    <span>إيقاف وحفظ التسجيل</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>ابدأ تسجيل صوتك الآن</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3 w-full animate-fade-in">
                <audio
                  ref={teacherAudioRef}
                  src={recordedUrl}
                  className="w-full"
                  controls
                />
                
                <button
                  onClick={handleDeleteRecording}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>إعادة تسجيل الصوت من جديد</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Grade and Feedback Notes Section */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-gray-800 border-b border-gray-50 pb-3 font-sans">التقييم والعبارات والرموز</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Grade input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 font-sans block">الدرجة أو مستوى التقييم (صوت)</label>
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
            <label className="text-xs font-bold text-gray-500 font-sans block">الملاحظات والتوجيهات المكتوبة</label>
            <input
              type="text"
              placeholder="أدخل توجيهات التجويد والمخارج المكتوبة..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:bg-white text-right"
            />
          </div>
        </div>

        {/* Emojis reaction visual tray */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-400 block font-sans">انقر لإضافة رمز تعبيري تشجيعي لبطاقة الطالب:</span>
          <div className="flex flex-wrap gap-2">
            {emojis.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleAddEmoji(emoji)}
                className="w-10 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl flex items-center justify-center text-lg transition active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Errors and Save Buttons */}
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-red-950 text-sm block">حدث خطأ أثناء الاتصال</span>
            <p className="text-xs text-red-900 mt-1">{error}</p>
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3 animate-pulse">
          <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold text-emerald-950 text-sm">تم إرسال وحفظ التقييم الصوتي بنجاح لمستند قوقل شيت! جاري العودة...</span>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition shadow-xs flex items-center gap-1.5 text-sm"
        >
          <span>العودة للجدول</span>
        </button>
        <button
          onClick={handleSaveAudioCorrection}
          disabled={isSaving || saveSuccess}
          className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition shadow-md hover:shadow-indigo-600/15 flex items-center justify-center gap-2 disabled:opacity-85 text-sm"
        >
          {isSaving ? (
            <>
              <div className="animate-spin border-2 border-white border-t-transparent rounded-full h-5 w-5" />
              <span>جاري رفع الصوت ومزامنة التقييم مع قوقل شيت...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>حفظ وإرسال التصحيح النهائي (تم)</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
