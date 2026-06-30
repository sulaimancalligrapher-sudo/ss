/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentRow, Teacher, PredefinedText, WatermarkSettings, AppProfile, AppContact, ConnectionConfig } from '../types';

// Robust calligraphy paper mock backgrounds (SVG)
const calliMockSVG1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="%23fcfbf7"/>
  <!-- Lined calligraphy guide lines -->
  <line x1="50" y1="150" x2="750" y2="150" stroke="%23dddddd" stroke-width="1" stroke-dasharray="5,5"/>
  <line x1="50" y1="180" x2="750" y2="180" stroke="%23e8b0b0" stroke-width="1.5"/>
  <line x1="50" y1="210" x2="750" y2="210" stroke="%23dddddd" stroke-width="1" stroke-dasharray="5,5"/>
  
  <line x1="50" y1="300" x2="750" y2="300" stroke="%23dddddd" stroke-width="1" stroke-dasharray="5,5"/>
  <line x1="50" y1="330" x2="750" y2="330" stroke="%23e8b0b0" stroke-width="1.5"/>
  <line x1="50" y1="360" x2="750" y2="360" stroke="%23dddddd" stroke-width="1" stroke-dasharray="5,5"/>
  
  <line x1="50" y1="450" x2="750" y2="450" stroke="%23dddddd" stroke-width="1" stroke-dasharray="5,5"/>
  <line x1="50" y1="480" x2="750" y2="480" stroke="%23e8b0b0" stroke-width="1.5"/>
  <line x1="50" y1="510" x2="750" y2="510" stroke="%23dddddd" stroke-width="1" stroke-dasharray="5,5"/>
  
  <!-- Arabic Calligraphy handwriting exercise mock ("رقعة") -->
  <path d="M 680,175 Q 650,178 620,170 Q 590,165 570,180" fill="none" stroke="%232c3e50" stroke-width="4" stroke-linecap="round"/>
  <path d="M 550,175 L 530,175 M 540,170 L 540,180" fill="none" stroke="%232c3e50" stroke-width="3" stroke-linecap="round"/>
  <path d="M 480,182 Q 440,175 410,180 Q 380,185 360,175 Q 330,160 300,180" fill="none" stroke="%232c3e50" stroke-width="4.5" stroke-linecap="round"/>
  <!-- Diacritics -->
  <path d="M 450,160 L 460,165" fill="none" stroke="%23e74c3c" stroke-width="2.5"/>
  <path d="M 400,195 Q 405,198 410,195" fill="none" stroke="%23e74c3c" stroke-width="2.5"/>
  
  <text x="750" y="50" font-family="'Tajawal', sans-serif" font-size="18" fill="%23888888" text-anchor="end" dir="rtl">تمرين خط الرقعة - درس البسملة</text>
</svg>`;

const calliMockSVG2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="%23fdfcf9"/>
  <!-- Lined calligraphy guide lines -->
  <line x1="50" y1="150" x2="750" y2="150" stroke="%23cccccc" stroke-width="1"/>
  <line x1="50" y1="190" x2="750" y2="190" stroke="%233a86c8" stroke-width="1" stroke-opacity="0.3"/>
  <line x1="50" y1="230" x2="750" y2="230" stroke="%23cccccc" stroke-width="1"/>
  
  <line x1="50" y1="350" x2="750" y2="350" stroke="%23cccccc" stroke-width="1"/>
  <line x1="50" y1="390" x2="750" y2="390" stroke="%233a86c8" stroke-width="1" stroke-opacity="0.3"/>
  <line x1="50" y1="430" x2="750" y2="430" stroke="%23cccccc" stroke-width="1"/>
  
  <!-- Calligraphy strokes (Nasakh mockup) -->
  <path d="M 650,380 Q 620,380 590,395 Q 560,410 520,385" fill="none" stroke="%231a1a1a" stroke-width="5" stroke-linecap="round"/>
  <path d="M 500,385 L 470,400 Q 440,415 410,380" fill="none" stroke="%231a1a1a" stroke-width="5" stroke-linecap="round"/>
  
  <text x="750" y="50" font-family="'Tajawal', sans-serif" font-size="18" fill="%23888888" text-anchor="end" dir="rtl">كتابة الحروف المتصلة - خط النسخ</text>
</svg>`;

const calliMockSVG3 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="%23faf8f5"/>
  <line x1="50" y1="200" x2="750" y2="200" stroke="%23dddddd" stroke-width="1"/>
  <line x1="50" y1="240" x2="750" y2="240" stroke="%23e8b0b0" stroke-width="1.5"/>
  <line x1="50" y1="280" x2="750" y2="280" stroke="%23dddddd" stroke-width="1"/>

  <path d="M 600,230 Q 560,250 510,235" fill="none" stroke="%232c3e50" stroke-width="4"/>
  <path d="M 480,240 Q 440,210 400,245" fill="none" stroke="%232c3e50" stroke-width="4.5"/>
  
  <text x="750" y="60" font-family="'Tajawal', sans-serif" font-size="18" fill="%23888888" text-anchor="end" dir="rtl">تطبيق خط الديواني - كتابة الكلمات</text>
</svg>`;

// Default mock assets for stickers
export const defaultStickers = [
  { id: 'st1', name: 'ممتاز', svg: `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#2ecc71" stroke="#27ae60" stroke-width="4"/>
    <text x="50" y="58" font-family="'Tajawal', sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">ممتاز ⭐</text>
  </svg>` },
  { id: 'st2', name: 'رائع', svg: `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#9b59b6" stroke="#8e44ad" stroke-width="4"/>
    <text x="50" y="58" font-family="'Tajawal', sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">رائع 💖</text>
  </svg>` },
  { id: 'st3', name: 'خطاط واعد', svg: `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#f1c40f" stroke="#f39c12" stroke-width="4"/>
    <text x="50" y="58" font-family="'Tajawal', sans-serif" font-size="16" font-weight="bold" fill="#2c3e50" text-anchor="middle">خطاط واعد ✍️</text>
  </svg>` },
  { id: 'st4', name: 'أعد المحاولة', svg: `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#e74c3c" stroke="#c0392b" stroke-width="4"/>
    <text x="50" y="58" font-family="'Tajawal', sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">أعد المحاولة 🔄</text>
  </svg>` },
  { id: 'st5', name: 'مبدع', svg: `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36" fill="#e67e22" stroke="#d35400" stroke-width="3"/>
    <text x="50" y="55" font-family="'Tajawal', sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">مبدع ✨</text>
  </svg>` },
];

// Mock database values
const MOCK_TEACHERS: Teacher[] = [
  {
    username: 'sulaiman',
    password: '123',
    status: 'نعم',
    allowedDevices: 3,
    devices: [
      { deviceId: 'dev_mock_1', location: 'الرياض، المملكة العربية السعودية' }
    ]
  },
  {
    username: 'khaled',
    password: '456',
    status: 'نعم',
    allowedDevices: 2,
    devices: []
  },
  {
    username: 'sara',
    password: '789',
    status: 'لا', // Blocked
    allowedDevices: 1,
    devices: []
  }
];

const MOCK_STUDENTS: StudentRow[] = [
  {
    studentId: '1001',
    studentName: 'فيصل السديري',
    lessonNumber: 1,
    imageSubmissionCount: 1,
    imageUrl: calliMockSVG1,
    audioSubmissionCount: 0,
    audioUrl: '',
    isSaved: false,
    notes: '',
    imageGrade: '',
    modifiedImageUrl: '',
    audioGrade: '',
    additionalImageUrl: '',
    videoUrl: '',
    correctionAudioUrl: '',
    date: '',
    submissionCount: 0,
    additionalT: 'المستوى الأول',
    additionalU: 'خط الرقعة',
    additionalV: 'حرف الألف',
    additionalW: 'الحلقة الأولى',
    additionalX: 'شمال الرياض',
    additionalY: 'ممتاز مبدئيًا',
    rowNumber: 2
  },
  {
    studentId: '1002',
    studentName: 'نورة بنت عبدالله',
    lessonNumber: 3,
    imageSubmissionCount: 2,
    imageUrl: calliMockSVG2,
    audioSubmissionCount: 0,
    audioUrl: '',
    isSaved: true,
    notes: 'خط رائع جداً، انتبهي لرفع كشيدة الكلمة الأخيرة بمقدار نقطتين فقط.',
    imageGrade: '95%',
    modifiedImageUrl: calliMockSVG2, // in real case it would be drawn
    audioGrade: '',
    additionalImageUrl: '',
    videoUrl: '',
    correctionAudioUrl: '',
    date: '2026-06-29 14:30:15',
    submissionCount: 1,
    additionalT: 'المستوى الأول',
    additionalU: 'خط النسخ',
    additionalV: 'كتابة السطر الثاني',
    additionalW: 'الحلقة الثانية',
    additionalX: 'جنوب الرياض',
    additionalY: 'طالبة متميزة',
    rowNumber: 3
  },
  {
    studentId: '1003',
    studentName: 'سلمان الشهراني',
    lessonNumber: 5,
    imageSubmissionCount: 0,
    imageUrl: '',
    audioSubmissionCount: 1,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Mock student audio lesson
    isSaved: false,
    notes: '',
    imageGrade: '',
    modifiedImageUrl: '',
    audioGrade: '',
    additionalImageUrl: '',
    videoUrl: '',
    correctionAudioUrl: '',
    date: '',
    submissionCount: 0,
    additionalT: 'المستوى الثاني',
    additionalU: 'تلاوة وتجويد',
    additionalV: 'سورة الملك ١-٥',
    additionalW: 'الحلقة الثالثة',
    additionalX: 'جدة',
    additionalY: 'نبرة صوت جيدة',
    rowNumber: 4
  },
  {
    studentId: '1004',
    studentName: 'أميرة الشمراني',
    lessonNumber: 2,
    imageSubmissionCount: 1,
    imageUrl: calliMockSVG3,
    audioSubmissionCount: 0,
    audioUrl: '',
    isSaved: false,
    notes: '',
    imageGrade: '',
    modifiedImageUrl: '',
    audioGrade: '',
    additionalImageUrl: '',
    videoUrl: '',
    correctionAudioUrl: '',
    date: '',
    submissionCount: 0,
    additionalT: 'المستوى الأول',
    additionalU: 'خط الديواني',
    additionalV: 'حرف الجيم المتصل',
    additionalW: 'الحلقة الأولى',
    additionalX: 'مكة المكرمة',
    additionalY: 'ملتزمة بالحضور',
    rowNumber: 5
  },
  {
    studentId: '1005',
    studentName: 'يوسف العثمان',
    lessonNumber: 10,
    imageSubmissionCount: 0,
    imageUrl: '',
    audioSubmissionCount: 3,
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    isSaved: true,
    notes: 'قراءة ممتازة ومخارج حروف واضحة جداً بارك الله فيك.',
    imageGrade: '',
    modifiedImageUrl: '',
    audioGrade: '10/10',
    additionalImageUrl: '',
    videoUrl: '',
    correctionAudioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Recorded response mockup
    date: '2026-06-28 10:15:00',
    submissionCount: 1,
    additionalT: 'المستوى الثالث',
    additionalU: 'مخارج الحروف',
    additionalV: 'مخرج القاف والكاف',
    additionalW: 'الحلقة الرابعة',
    additionalX: 'الدمام',
    additionalY: 'متفوق',
    rowNumber: 6
  }
];

const MOCK_PRESETS: PredefinedText[] = [
  { title: 'عبارة ثناء ممتازة', phrase: 'ما شاء الله تبارك الرحمن! خط في غاية الجمال والإتقان، استمر يا بطل ✍️✨' },
  { title: 'تحسين المسافات', phrase: 'أحسنت خطك جميل، لكن يرجى الانتباه للمسافات الفاصلة بين الكلمات لتكون متساوية.' },
  { title: 'تعديل زاوية القلم', phrase: 'ممتاز! يرجى مراعاة زاوية القلم (٧٥ درجة) عند النزول بحرف الراء والواو.' },
  { title: 'قراءة متميزة', phrase: 'تلاوة خاشعة وصوت رائع ومخارج حروف سليمة ومتقنة، بارك الله فيك وزادك من فضله 🌸🎤' },
  { title: 'ملاحظة التجويد الغنة', phrase: 'قراءة جيدة جداً، يرجى إعطاء الغنة حقها بمقدار حركتين عند النون والميم المشددتين.' }
];

const MOCK_WATERMARK: WatermarkSettings = {
  logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Calligraphy_seal.svg',
  opacity: 0.6,
  sizeFactor: 0.15,
  logoPosition: 'top-left',
  textPrefix: 'مدرسة الخط العربي الاحترافية',
  fontSize: 16,
  textPosition: 'bottom-right'
};

const MOCK_PROFILE: AppProfile = {
  logoUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=300&q=80',
  name: 'أكاديمية سليمان لتعليم الخط العربي والقرآن',
  description: 'المنصة المتكاملة لتصحيح التمارين والدروس الفنية والقرآنية بالصوت والصورة'
};

const MOCK_CONTACT: AppContact = {
  facebook: 'https://facebook.com/calligrapher.sulaiman',
  instagram: 'https://instagram.com/calligrapher.sulaiman',
  youtube: 'https://youtube.com/calligrapher.sulaiman',
  line: 'sulaiman_calli_line'
};

const MOCK_ADDITIONAL_HEADERS = [
  'المستوى الدراسي',
  'نوع الخط / المادة',
  'اسم الدرس التفصيلي',
  'الحلقة التعليمية',
  'المنطقة أو الفرع',
  'ملاحظة الإدارة'
];

// Database initialisation
export const initLocalDatabase = () => {
  if (!localStorage.getItem('gas_connection_config')) {
    const defaultConfig: ConnectionConfig = {
      gasUrl: '',
      useSimulator: true
    };
    localStorage.setItem('gas_connection_config', JSON.stringify(defaultConfig));
  }
  
  if (!localStorage.getItem('mock_students')) {
    localStorage.setItem('mock_students', JSON.stringify(MOCK_STUDENTS));
  }
  
  if (!localStorage.getItem('mock_teachers')) {
    localStorage.setItem('mock_teachers', JSON.stringify(MOCK_TEACHERS));
  }
  
  if (!localStorage.getItem('mock_presets')) {
    localStorage.setItem('mock_presets', JSON.stringify(MOCK_PRESETS));
  }
  
  if (!localStorage.getItem('mock_watermark')) {
    localStorage.setItem('mock_watermark', JSON.stringify(MOCK_WATERMARK));
  }
  
  if (!localStorage.getItem('mock_profile')) {
    localStorage.setItem('mock_profile', JSON.stringify(MOCK_PROFILE));
  }
  
  if (!localStorage.getItem('mock_contact')) {
    localStorage.setItem('mock_contact', JSON.stringify(MOCK_CONTACT));
  }
  
  if (!localStorage.getItem('mock_additional_headers')) {
    localStorage.setItem('mock_additional_headers', JSON.stringify(MOCK_ADDITIONAL_HEADERS));
  }
};

// Config helpers
export const getConnectionConfig = (): ConnectionConfig => {
  initLocalDatabase();
  const configStr = localStorage.getItem('gas_connection_config');
  return configStr ? JSON.parse(configStr) : { gasUrl: '', useSimulator: true };
};

export const saveConnectionConfig = (config: ConnectionConfig) => {
  localStorage.setItem('gas_connection_config', JSON.stringify(config));
};

// Base class representing our Unified Database connector
export class DatabaseConnector {
  static isUsingGas(): boolean {
    const config = getConnectionConfig();
    return !config.useSimulator && !!config.gasUrl;
  }

  static getGasUrl(): string {
    const config = getConnectionConfig();
    return config.gasUrl;
  }

  // Generalized fetch method with fallback to local simulation
  static async request<T>(action: string, method: 'GET' | 'POST' = 'GET', payload?: any): Promise<T> {
    if (this.isUsingGas()) {
      try {
        const url = new URL(this.getGasUrl());
        url.searchParams.append('action', action);
        
        let response;
        if (method === 'POST') {
          // Note: GAS handles redirects natively if done correctly. To avoid CORS preflight failures on Web Apps,
          // we can send payload as text/plain or standard query string, or fetch normally.
          response = await fetch(url.toString(), {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8', // This avoids preflight issues in standard Apps Script
            },
            body: JSON.stringify(payload)
          });
        } else {
          response = await fetch(url.toString(), {
            method: 'GET',
            mode: 'cors'
          });
        }
        
        const json = await response.json();
        if (json && json.success === false) {
          throw new Error(json.message || 'API request failed');
        }
        return json as T;
      } catch (err: any) {
        console.error('GAS API request failed, falling back to Simulator:', err);
        throw new Error(`خطأ في الاتصال بالسيرفر المباشر: ${err.message}. تم التراجع للمحاكي المحلي.`);
      }
    } else {
      // Local simulation delay to mimic server response
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.simulateAction<T>(action, payload);
    }
  }

  // Local actions simulator
  private static simulateAction<T>(action: string, payload?: any): T {
    initLocalDatabase();
    
    switch (action) {
      case 'getUsers': {
        const teachers = JSON.parse(localStorage.getItem('mock_teachers') || '[]');
        return teachers.map((t: Teacher) => ({
          username: t.username,
          password: t.password,
          status: t.status
        })) as unknown as T;
      }
      
      case 'getAdditionalHeaders': {
        return JSON.parse(localStorage.getItem('mock_additional_headers') || '[]') as unknown as T;
      }
      
      case 'getPredefinedTexts': {
        return JSON.parse(localStorage.getItem('mock_presets') || '[]') as unknown as T;
      }
      
      case 'getWatermarkSettings': {
        return JSON.parse(localStorage.getItem('mock_watermark') || '{}') as unknown as T;
      }
      
      case 'getData': {
        const profile = JSON.parse(localStorage.getItem('mock_profile') || '{}');
        const contact = JSON.parse(localStorage.getItem('mock_contact') || '{}');
        return {
          profile: [
            ['شعار', profile.logoUrl, ''],
            ['اسم المدرسة', profile.name, ''],
            ['الوصف', profile.description, '']
          ],
          contact: [
            [contact.facebook, contact.instagram, contact.youtube, contact.line]
          ]
        } as unknown as T;
      }
      
      case 'getTableData': {
        const students = JSON.parse(localStorage.getItem('mock_students') || '[]');
        return students as unknown as T;
      }
      
      case 'loginUser': {
        const { username, deviceId, location } = payload;
        const teachers: Teacher[] = JSON.parse(localStorage.getItem('mock_teachers') || '[]');
        const idx = teachers.findIndex(t => t.username === username);
        
        if (idx === -1) {
          return { success: false, message: 'مستخدِم غير مسجَّل' } as unknown as T;
        }
        
        const teacher = teachers[idx];
        if (teacher.status === 'لا') {
          return { success: false, message: 'تم تعطيل دخول هذا المعلم بواسطة الإدارة' } as unknown as T;
        }

        // Check if device already registered
        const deviceExists = teacher.devices.some(d => d.deviceId === deviceId);
        if (!deviceExists) {
          if (teacher.devices.length >= teacher.allowedDevices) {
            return { success: false, message: 'عذراً! تم تجاوز الحد الأقصى للأجهزة المسموح بها لهذا الحساب.' } as unknown as T;
          }
          teacher.devices.push({ deviceId, location: location || 'متصفح ويب غير معروف' });
          teachers[idx] = teacher;
          localStorage.setItem('mock_teachers', JSON.stringify(teachers));
        }
        
        return { success: true } as unknown as T;
      }
      
      case 'saveAllMedia': {
        const {
          canvasBase64,
          imageBase64,
          videoBase64,
          audioBase64,
          rowNumber,
          notes,
          imageGrade,
          audioGrade
        } = payload;
        
        const students: StudentRow[] = JSON.parse(localStorage.getItem('mock_students') || '[]');
        const idx = students.findIndex(s => s.rowNumber === rowNumber);
        
        if (idx !== -1) {
          const student = students[idx];
          
          // Increment the correction submission count in column Q (submissionCount)
          if (!student.isSaved) {
            student.submissionCount += 1;
          }
          
          student.isSaved = true;
          student.notes = notes || '';
          if (imageGrade !== undefined) student.imageGrade = imageGrade;
          if (audioGrade !== undefined) student.audioGrade = audioGrade;
          
          // Mimic file storage with local storage references or the base64 itself
          if (canvasBase64) student.modifiedImageUrl = canvasBase64;
          if (imageBase64) student.additionalImageUrl = imageBase64;
          if (videoBase64) student.videoUrl = videoBase64;
          if (audioBase64) student.correctionAudioUrl = audioBase64;
          
          student.date = new Date().toISOString().replace('T', ' ').substring(0, 19);
          
          students[idx] = student;
          localStorage.setItem('mock_students', JSON.stringify(students));
          
          // Add to History logs
          const history = JSON.parse(localStorage.getItem('mock_history') || '[]');
          history.push({
            ...student,
            logDate: student.date
          });
          localStorage.setItem('mock_history', JSON.stringify(history));
          
          return {
            modified: canvasBase64 || student.modifiedImageUrl,
            image: imageBase64 || student.additionalImageUrl,
            video: videoBase64 || student.videoUrl,
            audio: audioBase64 || student.correctionAudioUrl
          } as unknown as T;
        }
        throw new Error('لم يتم العثور على الصف المطلوب في البيانات المحاكية.');
      }
      
      default:
        throw new Error('الإجراء المطلوب غير معروف في المحاكي المحلي.');
    }
  }
}
