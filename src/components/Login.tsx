/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Lock, MapPin, Tablet, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { Teacher } from '../types';
import { DatabaseConnector } from '../utils/simulator';

interface LoginProps {
  onLoginSuccess: (username: string) => void;
  schoolName: string;
  logoUrl: string;
}

export default function Login({ onLoginSuccess, schoolName, logoUrl }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredDevicesInfo, setRegisteredDevicesInfo] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Attempt to gather GPS coordinates gracefully on mount
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          console.log('Location access declined by user');
        }
      );
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('الرجاء كتابة اسم المستخدم وكلمة المرور بالكامل.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // 1. Fetch teachers to validate passwords (simulator or GAS)
      const teachers = await DatabaseConnector.request<any[]>('getUsers');
      const matchedTeacher = teachers.find(
        (t) => t.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!matchedTeacher) {
        throw new Error('اسم المستخدم هذا غير موجود في النظام.');
      }

      if (matchedTeacher.password !== password) {
        throw new Error('كلمة المرور المدخلة غير صحيحة.');
      }

      if (matchedTeacher.status === 'لا') {
        throw new Error('تم منع دخول هذا الحساب بواسطة إدارة المدرسة.');
      }

      // 2. Generate/fetch deviceId
      let deviceId = localStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = 'device_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
        localStorage.setItem('deviceId', deviceId);
      }

      // 3. Resolve Location mock string
      let locationString = 'المنطقة التعليمية الوسطى';
      if (coords) {
        locationString = `إحداثيات (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
      }

      // 4. Log the device registration on backend
      const loginResult = await DatabaseConnector.request<{ success: boolean; message?: string }>(
        'loginUser',
        'POST',
        { username: matchedTeacher.username, deviceId, location: locationString }
      );

      if (loginResult.success) {
        localStorage.setItem('loggedInUser', matchedTeacher.username);
        onLoginSuccess(matchedTeacher.username);
      } else {
        throw new Error(loginResult.message || 'فشلت عملية التحقق من الجهاز.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في عملية تسجيل الدخول.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 py-12" id="login-container">
      <div className="w-full max-w-md bg-white border border-gray-100 shadow-xl rounded-3xl overflow-hidden p-8 space-y-6 relative">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Sparkles className="w-24 h-24 text-indigo-600" />
        </div>
        
        {/* School Logo & Title */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img
              src={logoUrl || 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&q=80'}
              alt="Logo"
              className="w-20 h-20 rounded-2xl object-cover shadow-sm ring-4 ring-indigo-50"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-sans tracking-tight">{schoolName || 'بوابة تصحيح الدروس'}</h1>
            <p className="text-xs text-gray-500 mt-1">بوابة الدخول الموحدة للمعلمين والخطاطين المعتمدين</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-900 text-sm p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 block">اسم المستخدم أو المعلم</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="sulaiman"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-4 pr-11 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-right font-sans transition-all text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 block">كلمة المرور الخاصة بالمدرس</label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-11 py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-right font-mono transition-all text-gray-900"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg hover:shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 ${
                isLoading ? 'opacity-85 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin border-2 border-white border-t-transparent rounded-full h-5 w-5" />
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <span>دخول البوابة التعليمية</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info and Tips */}
        <div className="border-t border-gray-100 pt-5 space-y-3">
          <div className="flex items-center gap-2.5 text-xs text-gray-500 justify-center">
            <Tablet className="w-4 h-4 text-indigo-500" />
            <span>تسجيل الدخول يربط حسابك بالجهاز تلقائياً لحماية سرية التصحيح</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-gray-500 justify-center">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <span>{coords ? 'تم تحديد الموقع الجغرافي بنجاح للتسجيل في الشيت' : 'يرجى السماح بالوصول للموقع لتسجيل الحضور'}</span>
          </div>
        </div>

        {/* Demo credentials tip */}
        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/40 text-center">
          <div className="text-xs font-bold text-indigo-950 flex items-center justify-center gap-1.5 mb-1">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            بيانات تجريبية سريعة للمحاكي:
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed font-sans">
            اسم المعلم: <span className="font-bold font-mono">sulaiman</span> &bull; كلمة المرور: <span className="font-bold font-mono">123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
