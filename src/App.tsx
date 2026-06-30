/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DatabaseConnector } from './utils/simulator';
import { StudentRow, Teacher, PredefinedText, WatermarkSettings, AppProfile, AppContact } from './types';
import { LogOut, Wifi, WifiOff, LayoutDashboard, Settings, HelpCircle, GraduationCap, Facebook, Instagram, Youtube, Compass } from 'lucide-react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CanvasBoard from './components/CanvasBoard';
import AudioCorrection from './components/AudioCorrection';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'canvas' | 'audio' | 'settings'>('login');
  const [loggedInUser, setLoggedInUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('جاري تحميل المنصة التعليمية...');
  
  // Sheet Data state
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [additionalHeaders, setAdditionalHeaders] = useState<string[]>([]);
  const [presets, setPresets] = useState<PredefinedText[]>([]);
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Calligraphy_seal.svg',
    opacity: 0.6,
    sizeFactor: 0.15,
    logoPosition: 'top-left',
    textPrefix: 'مدرسة الخط العربي',
    fontSize: 16,
    textPosition: 'bottom-right'
  });
  const [profile, setProfile] = useState<AppProfile>({
    logoUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&q=80',
    name: 'أكاديمية سليمان لتعليم الخط العربي والقرآن',
    description: 'المنصة المتكاملة لتصحيح التمارين والدروس الفنية والقرآنية بالصوت والصورة'
  });
  const [contact, setContact] = useState<AppContact>({
    facebook: 'https://facebook.com',
    instagram: 'https://instagram.com',
    youtube: 'https://youtube.com',
    line: ''
  });

  const [activeStudent, setActiveStudent] = useState<StudentRow | null>(null);
  const [isLiveConnection, setIsLiveConnection] = useState(false);

  // Sync state with local config
  useEffect(() => {
    const checkLiveState = () => {
      const configStr = localStorage.getItem('gas_connection_config');
      if (configStr) {
        const config = JSON.parse(configStr);
        setIsLiveConnection(!config.useSimulator && !!config.gasUrl);
      }
    };

    checkLiveState();
    window.addEventListener('storage', checkLiveState);
    return () => window.removeEventListener('storage', checkLiveState);
  }, []);

  // Check login session & fetch metadata
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        // Fetch global settings
        const additionalHeadersData = await DatabaseConnector.request<string[]>('getAdditionalHeaders');
        const presetsData = await DatabaseConnector.request<PredefinedText[]>('getPredefinedTexts');
        const watermarkData = await DatabaseConnector.request<WatermarkSettings>('getWatermarkSettings');
        const layoutData = await DatabaseConnector.request<any>('getData');

        if (additionalHeadersData) setAdditionalHeaders(additionalHeadersData);
        if (presetsData) setPresets(presetsData);
        if (watermarkData) setWatermark(watermarkData);

        if (layoutData && layoutData.profile && layoutData.profile.length >= 2) {
          setProfile({
            logoUrl: layoutData.profile[0]?.[1] || profile.logoUrl,
            name: layoutData.profile[0]?.[2] || profile.name,
            description: layoutData.profile[1]?.[1] || profile.description
          });
        }

        if (layoutData && layoutData.contact && layoutData.contact.length > 0) {
          setContact({
            facebook: layoutData.contact[0]?.[0] || contact.facebook,
            instagram: layoutData.contact[0]?.[1] || contact.instagram,
            youtube: layoutData.contact[0]?.[2] || contact.youtube,
            line: layoutData.contact[0]?.[3] || contact.line
          });
        }

        // Check login
        const savedUser = localStorage.getItem('loggedInUser');
        if (savedUser) {
          setLoggedInUser(savedUser);
          setCurrentView('dashboard');
          await loadStudentsList();
        } else {
          setCurrentView('login');
        }
      } catch (err) {
        console.error('App init failed:', err);
        // Fallback session on local error
        const savedUser = localStorage.getItem('loggedInUser');
        if (savedUser) {
          setLoggedInUser(savedUser);
          setCurrentView('dashboard');
          loadStudentsList();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, [isLiveConnection]);

  const loadStudentsList = async () => {
    setLoadingMessage('جاري تحديث قائمة الدروس من قوقل شيت...');
    try {
      const studentData = await DatabaseConnector.request<StudentRow[]>('getTableData');
      if (studentData) {
        setStudents(studentData);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadStudentsList();
    setIsLoading(false);
  };

  const handleLoginSuccess = async (username: string) => {
    setLoggedInUser(username);
    setIsLoading(true);
    await loadStudentsList();
    setCurrentView('dashboard');
    setIsLoading(false);
  };

  const handleLogout = () => {
    if (window.confirm('هل تريد تسجيل الخروج من البوابة التعليمية؟')) {
      localStorage.removeItem('loggedInUser');
      setLoggedInUser('');
      setCurrentView('login');
    }
  };

  const handleCorrectImageAction = (student: StudentRow) => {
    setActiveStudent(student);
    setCurrentView('canvas');
  };

  const handleCorrectAudioAction = (student: StudentRow) => {
    setActiveStudent(student);
    setCurrentView('audio');
  };

  // Generalized Save Callback
  const handleSaveCorrectionPayload = async (payload: any) => {
    const result = await DatabaseConnector.request<any>('saveAllMedia', 'POST', payload);
    await loadStudentsList(); // refresh table
    return result;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col justify-between font-sans selection:bg-indigo-600/10" dir="rtl">
      
      {/* Visual loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-white/90 flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="animate-spin border-4 border-indigo-600 border-t-transparent rounded-full h-12 w-12" />
            <GraduationCap className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto" />
          </div>
          <p className="text-sm font-bold text-gray-800 font-sans">{loadingMessage}</p>
        </div>
      )}

      {/* Main Portal Header */}
      {currentView !== 'login' && (
        <header className="bg-white border-b border-gray-100 shadow-xs sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              
              {/* School branding */}
              <div className="flex items-center gap-3">
                <img
                  src={profile.logoUrl}
                  alt="School Logo"
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-gray-50"
                />
                <div>
                  <h1 className="text-sm font-bold text-gray-900 font-sans tracking-tight">{profile.name}</h1>
                  <span className="text-[10px] text-gray-400 font-sans block mt-0.5">{profile.description}</span>
                </div>
              </div>

              {/* Central Nav Menu */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    currentView === 'dashboard' || currentView === 'canvas' || currentView === 'audio'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>اللوحة الرئيسية للدروس</span>
                </button>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    currentView === 'settings'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>إعدادات ربط قوقل شيت</span>
                </button>
              </div>

              {/* Left Actions (User details, live status, logout) */}
              <div className="flex items-center gap-3">
                {/* Live connection check badge */}
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  isLiveConnection
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/60'
                    : 'bg-amber-50 text-amber-700 border border-amber-100/60'
                }`}>
                  {isLiveConnection ? (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      <span>اتصال الشيت نشط أونلاين</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>وضع المحاكي المحلي</span>
                    </>
                  )}
                </div>

                {/* Teacher Profile Display */}
                <div className="flex items-center gap-2 border-r border-gray-100 pr-3 mr-1">
                  <div className="text-left hidden sm:block">
                    <span className="text-[10px] text-gray-400 block font-sans">مرحباً بالمعلم</span>
                    <span className="text-xs font-bold text-gray-900 font-sans">{loggedInUser}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="تسجيل الخروج"
                    className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-xl transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </header>
      )}

      {/* Main Core Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'login' && (
          <Login
            onLoginSuccess={handleLoginSuccess}
            schoolName={profile.name}
            logoUrl={profile.logoUrl}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            students={students}
            additionalHeaders={additionalHeaders}
            onCorrectImage={handleCorrectImageAction}
            onCorrectAudio={handleCorrectAudioAction}
            onRefresh={handleRefresh}
            isLive={isLiveConnection}
          />
        )}

        {currentView === 'canvas' && activeStudent && (
          <CanvasBoard
            student={activeStudent}
            presets={presets}
            watermark={watermark}
            onBack={() => { setActiveStudent(null); setCurrentView('dashboard'); }}
            onSave={handleSaveCorrectionPayload}
          />
        )}

        {currentView === 'audio' && activeStudent && (
          <AudioCorrection
            student={activeStudent}
            onBack={() => { setActiveStudent(null); setCurrentView('dashboard'); }}
            onSave={handleSaveCorrectionPayload}
          />
        )}

        {currentView === 'settings' && (
          <SettingsPanel
            onConfigChanged={() => {
              // Trigger state refresh
              setIsLiveConnection(prevState => !prevState);
            }}
          />
        )}
      </main>

      {/* Beautiful Contact social footer */}
      {currentView !== 'login' && (
        <footer className="bg-white border-t border-gray-100 py-6 mt-12 text-center text-xs text-gray-400 space-y-4">
          <div className="flex items-center justify-center gap-6">
            {contact.facebook && (
              <a
                href={contact.facebook}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                title="فيسبوك"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {contact.instagram && (
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-gray-50 text-gray-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition"
                title="إنستغرام"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
            {contact.youtube && (
              <a
                href={contact.youtube}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-gray-50 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                title="يوتيوب"
              >
                <Youtube className="w-4 h-4" />
              </a>
            )}
            {contact.line && (
              <a
                href={`https://line.me/R/ti/p/${contact.line}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 bg-gray-50 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition flex items-center gap-1 font-bold"
                title="لاين"
              >
                <Compass className="w-4 h-4" />
                <span>Line ID: {contact.line}</span>
              </a>
            )}
          </div>
          <div>
            <p className="font-sans leading-relaxed">جميع الحقوق محفوظة &copy; {new Date().getFullYear()} &bull; {profile.name}</p>
            <span className="text-[10px] text-gray-300 font-sans block mt-1">تطوير وبناء احترافي متكامل مخصص لخدمة معلمي وخطاطي وطلاب الأكاديمية</span>
          </div>
        </footer>
      )}
    </div>
  );
}

