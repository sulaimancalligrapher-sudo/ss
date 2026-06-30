/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Search, Eye, EyeOff, Filter, CheckCircle, Clock, Volume2, Image as ImageIcon, Sparkles, AlertCircle, RefreshCw, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { StudentRow } from '../types';

interface DashboardProps {
  students: StudentRow[];
  additionalHeaders: string[];
  onCorrectImage: (student: StudentRow) => void;
  onCorrectAudio: (student: StudentRow) => void;
  onRefresh: () => void;
  isLive: boolean;
}

export default function Dashboard({
  students,
  additionalHeaders,
  onCorrectImage,
  onCorrectAudio,
  onRefresh,
  isLive
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'audio'>('all');
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  // Summary statistics
  const totalSubmissions = students.length;
  const correctedCount = students.filter(s => s.isSaved).length;
  const pendingCount = totalSubmissions - correctedCount;
  const imageCount = students.filter(s => s.imageUrl).length;
  const audioCount = students.filter(s => s.audioUrl).length;

  const toggleRowExpand = (rowNum: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowNum]: !prev[rowNum]
    }));
  };

  // Filter & Search logic
  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch =
      student.studentId.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      student.studentName.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      student.lessonNumber.toString().includes(searchTerm.trim());

    // Saved/Unsaved filter
    const matchesSaved = showSaved ? true : !student.isSaved;

    // Media type filter
    const matchesMedia =
      filterType === 'all' ? true :
      filterType === 'image' ? !!student.imageUrl :
      !!student.audioUrl;

    return matchesSearch && matchesSaved && matchesMedia;
  });

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-500 font-sans">إجمالي طلبات الطلاب</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-900 font-mono">{totalSubmissions}</span>
            <span className="text-xs text-gray-400 font-sans">تمرين</span>
          </div>
        </div>

        <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-emerald-700 font-sans flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            تم تصحيحها
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-950 font-mono">{correctedCount}</span>
            <span className="text-xs text-emerald-600 font-sans">مكتمل</span>
          </div>
        </div>

        <div className="bg-amber-50/40 border border-amber-100/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-amber-700 font-sans flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            بانتظار المدرس
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-amber-950 font-mono">{pendingCount}</span>
            <span className="text-xs text-amber-600 font-sans">معلق</span>
          </div>
        </div>

        <div className="bg-indigo-50/30 border border-indigo-100/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-indigo-700 font-sans flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
            تمارين الخط العربي
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-indigo-950 font-mono">{imageCount}</span>
            <span className="text-xs text-indigo-600 font-sans">صورة</span>
          </div>
        </div>

        <div className="bg-sky-50/30 border border-sky-100/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-xs font-bold text-sky-700 font-sans flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-sky-600" />
            تمارين التلاوة والصوت
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-sky-950 font-mono">{audioCount}</span>
            <span className="text-xs text-sky-600 font-sans">صوت</span>
          </div>
        </div>
      </div>

      {/* Control Actions & Filters */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="ابحث برقم الطالب، الاسم، أو الدرس..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-11 py-3 bg-gray-50/60 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:bg-white text-right font-sans transition-all text-sm text-gray-900"
            />
          </div>

          {/* Filtering Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Media dropdown */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-2 py-1 text-sm">
              <span className="text-xs font-bold text-gray-400 px-2 font-sans">النوع</span>
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  filterType === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                  filterType === 'image' ? 'bg-white text-indigo-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>صور</span>
              </button>
              <button
                onClick={() => setFilterType('audio')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                  filterType === 'audio' ? 'bg-white text-sky-600 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>صوتيات</span>
              </button>
            </div>

            {/* Toggle show saved */}
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all shadow-xs ${
                showSaved
                  ? 'border-indigo-100 bg-indigo-50/30 text-indigo-900'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
              }`}
            >
              {showSaved ? <Eye className="w-4 h-4 text-indigo-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              <span>{showSaved ? 'إخفاء المصححة' : 'إظهار التمارين المصححة'}</span>
            </button>

            {/* Live refresh */}
            <button
              onClick={onRefresh}
              title="تحديث البيانات"
              className="p-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600 rounded-xl transition active:scale-95 shadow-xs bg-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Students List Grid */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm font-bold">
                <th className="py-4 px-6 text-right font-sans">رقم الطالب</th>
                <th className="py-4 px-6 text-right font-sans">اسم الطالب</th>
                <th className="py-4 px-6 text-center font-sans">رقم الدرس</th>
                <th className="py-4 px-6 text-center font-sans">مرات الإرسال</th>
                <th className="py-4 px-6 text-center font-sans">الملف الأصلي</th>
                <th className="py-4 px-6 text-center font-sans">التقييم</th>
                <th className="py-4 px-6 text-center font-sans">تعديل التصحيح</th>
                <th className="py-4 px-6 text-center font-sans">بيانات إضافية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const hasImage = !!student.imageUrl;
                  const hasAudio = !!student.audioUrl;
                  const isExpanded = !!expandedRows[student.rowNumber];
                  
                  return (
                    <React.Fragment key={student.rowNumber}>
                      <tr className={`hover:bg-gray-50/50 transition-colors ${student.isSaved ? 'bg-emerald-50/10' : ''}`}>
                        <td className="py-4 px-6 font-mono text-gray-900 font-bold">{student.studentId}</td>
                        <td className="py-4 px-6 font-sans">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{student.studentName}</span>
                            <span className="text-xs text-gray-400 font-mono mt-0.5">{student.additionalU} &bull; {student.additionalV}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-mono text-gray-900 font-bold">الدرس {student.lessonNumber}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-700 font-mono">
                            {hasImage ? student.imageSubmissionCount : student.audioSubmissionCount} مَرَّة
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            {hasImage ? (
                              <button
                                onClick={() => onCorrectImage(student)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition hover:scale-105 active:scale-95 flex items-center gap-1.5"
                              >
                                <ImageIcon className="w-4 h-4" />
                                <span>سبورة الرسم</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => onCorrectAudio(student)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition hover:scale-105 active:scale-95 flex items-center gap-1.5"
                              >
                                <Volume2 className="w-4 h-4" />
                                <span>استماع وتصحيح</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {student.isSaved ? (
                            <div className="flex flex-col items-center justify-center">
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 justify-center">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تم التصحيح</span>
                              </span>
                              <span className="text-xs font-mono text-gray-400 mt-1">
                                {hasImage ? student.imageGrade : student.audioGrade}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                              معلق
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center">
                            {student.isSaved ? (
                              <button
                                onClick={() => hasImage ? onCorrectImage(student) : onCorrectAudio(student)}
                                className="px-3.5 py-1.5 border border-indigo-100 hover:border-indigo-200 bg-indigo-50/20 text-indigo-700 rounded-xl text-xs font-bold transition hover:bg-indigo-50"
                              >
                                تعديل الدرجات
                              </button>
                            ) : (
                              <span className="text-gray-300 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => toggleRowExpand(student.rowNumber)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Panel showing Column T to Y */}
                      {isExpanded && (
                        <tr className="bg-gray-50/60">
                          <td colSpan={8} className="py-4 px-8 border-t border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-xs text-gray-400 font-bold font-sans block mb-1">
                                  {additionalHeaders[0] || 'العمود T'}
                                </span>
                                <span className="text-sm font-bold text-gray-800 font-sans">{student.additionalT || 'غير محدد'}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-xs text-gray-400 font-bold font-sans block mb-1">
                                  {additionalHeaders[1] || 'العمود U'}
                                </span>
                                <span className="text-sm font-bold text-gray-800 font-sans">{student.additionalU || 'غير محدد'}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-xs text-gray-400 font-bold font-sans block mb-1">
                                  {additionalHeaders[2] || 'العمود V'}
                                </span>
                                <span className="text-sm font-bold text-gray-800 font-sans">{student.additionalV || 'غير محدد'}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-xs text-gray-400 font-bold font-sans block mb-1">
                                  {additionalHeaders[3] || 'العمود W'}
                                </span>
                                <span className="text-sm font-bold text-gray-800 font-sans">{student.additionalW || 'غير محدد'}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
                                <span className="text-xs text-gray-400 font-bold font-sans block mb-1">
                                  {additionalHeaders[4] || 'العمود X'}
                                </span>
                                <span className="text-sm font-bold text-gray-800 font-sans">{student.additionalX || 'غير محدد'}</span>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-2xs col-span-1 sm:col-span-2 md:col-span-1">
                                <span className="text-xs text-gray-400 font-bold font-sans block mb-1">
                                  {additionalHeaders[5] || 'العمود Y'}
                                </span>
                                <span className="text-sm font-bold text-gray-800 font-sans">{student.additionalY || 'غير محدد'}</span>
                              </div>
                            </div>
                            
                            {/* Correction Notes preview if exists */}
                            {student.isSaved && student.notes && (
                              <div className="bg-indigo-50/30 border border-indigo-100/40 rounded-xl p-4 mt-3">
                                <span className="text-xs font-bold text-indigo-700 block mb-1 font-sans">📝 ملاحظات المعلم المحفوظة:</span>
                                <p className="text-sm text-indigo-950 font-sans leading-relaxed">{student.notes}</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                      <div className="p-3 bg-gray-50 text-gray-400 rounded-2xl">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-gray-800 font-sans">لم يتم العثور على تمارين مطابقة</h4>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">
                        جرّب استخدام كلمات بحث أخرى أو قم بتغيير فلاتر التصفية في الأعلى لعرض التمارين المطلوبة.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
