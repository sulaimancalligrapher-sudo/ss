/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Settings, Wifi, WifiOff, FileCode, Check, Copy, HelpCircle } from 'lucide-react';
import { ConnectionConfig } from '../types';
import { getConnectionConfig, saveConnectionConfig, DatabaseConnector } from '../utils/simulator';
import { GAS_CODE_INSTRUCTIONS, GOOGLE_APPS_SCRIPT_CODE } from '../utils/gasCode';

interface SettingsPanelProps {
  onConfigChanged: () => void;
}

export default function SettingsPanel({ onConfigChanged }: SettingsPanelProps) {
  const [config, setConfig] = useState<ConnectionConfig>({ gasUrl: '', useSimulator: true });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [copiedInstructions, setCopiedInstructions] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setConfig(getConnectionConfig());
  }, []);

  const handleSave = (updatedConfig: ConnectionConfig) => {
    setConfig(updatedConfig);
    saveConnectionConfig(updatedConfig);
    onConfigChanged();
  };

  const handleTestConnection = async () => {
    if (!config.gasUrl) {
      setTestStatus('error');
      setTestMessage('الرجاء إدخال رابط Google Apps Script أولاً.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('جاري اختبار الاتصال بالشيت الخاص بك...');

    try {
      // Test by requesting getAdditionalHeaders
      const url = new URL(config.gasUrl);
      url.searchParams.append('action', 'getAdditionalHeaders');
      
      const response = await fetch(url.toString(), { method: 'GET', mode: 'cors' });
      if (!response.ok) throw new Error('استجابة غير صالحة من السيرفر');
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setTestStatus('success');
        setTestMessage('تم الاتصال بنجاح! تم العثور على أوراق الشيت والربط يعمل بشكل ممتاز.');
      } else {
        throw new Error('الرابط صحيح ولكن البيانات المسترجعة ليست بالهيكل المتوقع.');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`فشل الاتصال: ${err.message}. يرجى التأكد من نشر الكود البرمجي كـ Web App بصلاحية وصول "Anyone".`);
    }
  };

  const copyToClipboard = (text: string, type: 'instructions' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'instructions') {
      setCopiedInstructions(true);
      setTimeout(() => setCopiedInstructions(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-4xl mx-auto my-6" id="settings-panel">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-sans">إعدادات الاتصال والربط</h2>
          <p className="text-sm text-gray-500">اربط لوحة التحكم بجدول بيانات قوقل شيت (Google Sheets) الخاص بك مباشرة مجاناً</p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => handleSave({ ...config, useSimulator: true })}
          className={`flex items-center gap-4 p-4 rounded-xl border text-right transition-all ${
            config.useSimulator
              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-600/10'
              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
          }`}
        >
          <div className={`p-3 rounded-lg ${config.useSimulator ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            <WifiOff className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base">وضع المحاكي المحلي (تجربة أوفلاين)</div>
            <div className="text-xs text-gray-500 mt-0.5">تصفح لوحة التحكم وصحح عينات الدروس باستخدام قواعد بيانات تجريبية محفوظة بمتصفحك</div>
          </div>
        </button>

        <button
          onClick={() => handleSave({ ...config, useSimulator: false })}
          className={`flex items-center gap-4 p-4 rounded-xl border text-right transition-all ${
            !config.useSimulator
              ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-600/10'
              : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
          }`}
        >
          <div className={`p-3 rounded-lg ${!config.useSimulator ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base">ربط قوقل شيت المباشر (أونلاين)</div>
            <div className="text-xs text-gray-500 mt-0.5">توصيل التطبيق بقواعد بيانات طلابك الفعلية المخزنة في قوقل شيت وقوقل درايف</div>
          </div>
        </button>
      </div>

      {/* GAS Url Form */}
      {!config.useSimulator && (
        <div className="space-y-4 p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl mb-6">
          <label className="block text-sm font-bold text-emerald-950">رابط موقع قوقل ويب لتطبيقات الهاتف (Google Apps Script Web App URL)</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="url"
              dir="ltr"
              value={config.gasUrl}
              onChange={(e) => handleSave({ ...config, gasUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
            />
            <button
              onClick={handleTestConnection}
              className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-sm hover:shadow active:scale-95 flex items-center justify-center gap-2"
            >
              <Wifi className="w-4 h-4" />
              <span>اختبار الاتصال</span>
            </button>
          </div>

          {/* Test connection report */}
          {testStatus !== 'idle' && (
            <div className={`p-3.5 rounded-lg text-sm flex items-center gap-3 ${
              testStatus === 'testing' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
              testStatus === 'success' ? 'bg-emerald-100 text-emerald-950 border border-emerald-200' :
              'bg-red-50 text-red-950 border border-red-200'
            }`}>
              <div className="animate-pulse h-2.5 w-2.5 rounded-full bg-current" />
              <span>{testMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Code and Instructions Accordion */}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4 font-sans">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          دليل التثبيت والربط المجاني (خطوة بخطوة)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Instructions Box */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-indigo-500" />
                  خطوات العمل في قوقل درايف
                </span>
                <button
                  onClick={() => copyToClipboard(GAS_CODE_INSTRUCTIONS, 'instructions')}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-500 hover:text-slate-800 transition flex items-center gap-1"
                >
                  {copiedInstructions ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span className="text-xs">{copiedInstructions ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed text-right overflow-y-auto max-h-72">
                {GAS_CODE_INSTRUCTIONS}
              </pre>
            </div>
          </div>

          {/* Apps Script Code Box */}
          <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 flex flex-col justify-between text-left">
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5 font-sans">
                  <FileCode className="w-4 h-4 text-emerald-500" />
                  الكود البرمجي (Code.gs)
                </span>
                <button
                  onClick={() => copyToClipboard(GOOGLE_APPS_SCRIPT_CODE, 'code')}
                  className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span className="text-xs">{copiedCode ? 'تم نسخ الكود' : 'نسخ الكود'}</span>
                </button>
              </div>
              <pre dir="ltr" className="text-xs text-emerald-400/90 whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto max-h-72 text-left bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                {GOOGLE_APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
