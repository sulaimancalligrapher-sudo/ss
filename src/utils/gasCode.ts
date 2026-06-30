/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const GAS_CODE_INSTRUCTIONS = `
كيفية ربط التطبيق بجدول بيانات قوقل (Google Sheets) مجاناً:
--------------------------------------------------------------
1. افتح جدول البيانات الخاص بك في Google Sheets.
2. من القائمة العلوية، اختر: "الامتدادات" (Extensions) -> "أكواد تطبيقات قوقل" (Apps Script).
3. احذف أي كود موجود في الملف "Code.gs" والصق الكود البرمجي الموضح أدناه بالكامل.
4. اضغط على زر "حفظ" (أيقونة القرص المرن 💾).
5. اضغط على "نشر" (Deploy) -> "نشر جديد" (New deployment).
6. اضغط على أيقونة الترس بجانب "Select type" واختر "موقع ويب" (Web app).
7. قم بتهيئة الإعدادات كالتالي:
   - الوصف (Description): "Lesson Correction API"
   - تشغيل التطبيق باسم (Execute as): "أنا" (Me - بريدك الإلكتروني الخاص بقوقل)
   - من لديه صلاحية الدخول (Who has access): "أي شخص" (Anyone) -> *مهم جداً لنجاح الاتصال!*
8. اضغط على "نشر" (Deploy). قد يطلب منك قوقل إعطاء الصلاحيات للوصول للملفات، وافق عليها.
9. انسخ "رابط موقع الويب" (Web App URL) والصقه في قسم "إعدادات الربط" بالتطبيق هنا!
`;

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * كود Google Apps Script لتوصيل تطبيق الويب بجدول البيانات وحفظ الملفات في قوقل درايف.
 * الصق هذا الكود بالكامل في ملف Code.gs داخل مشروع Apps Script المرتبط بالشيت.
 */

function doGet(e) {
  var action = e.parameter.action;
  var response = {};
  
  try {
    if (action === 'getData') {
      response = getData();
    } else if (action === 'getAdditionalHeaders') {
      response = getAdditionalHeaders();
    } else if (action === 'getPredefinedTexts') {
      response = getPredefinedTexts();
    } else if (action === 'getWatermarkSettings') {
      response = getWatermarkSettings();
    } else if (action === 'getTableData') {
      response = getTableData();
    } else if (action === 'getUsers') {
      response = getUsers();
    } else {
      response = { success: false, message: 'الإجراء GET غير مدعوم' };
    }
  } catch (error) {
    response = { success: false, message: error.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var response = {};
  
  try {
    var action = e.parameter.action;
    var postData = JSON.parse(e.postData.contents);
    
    if (action === 'loginUser') {
      response = loginUser(postData.username, postData.deviceId, postData.location);
    } else if (action === 'saveAllMedia') {
      response = saveAllMedia(postData);
    } else {
      response = { success: false, message: 'الإجراء POST غير مدعوم' };
    }
  } catch (error) {
    response = { success: false, message: error.message };
  }
  
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// جلب بيانات الواجهة الرئيسية للموقع (اسم المدرسة، الشعار، التواصل)
function getData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var profileSheet = ss.getSheetByName('Profile');
  var contactSheet = ss.getSheetByName('Contact');
  
  var profileData = profileSheet ? profileSheet.getDataRange().getValues() : [];
  var contactData = contactSheet ? contactSheet.getDataRange().getValues() : [];
  
  return {
    profile: profileData.slice(1),
    contact: contactData.slice(1)
  };
}

// جلب العناوين الإضافية من العمود T إلى Y
function getAdditionalHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('A1');
  var headersRange = sheet.getRange('T1:Y1').getValues()[0];
  return headersRange.map(function(header) { 
    return header ? header.toString().trim() : ''; 
  });
}

// جلب العبارات المجهزة مسبقاً للتقييم والتصحيح
function getPredefinedTexts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) return [];
  var lastRow = settingsSheet.getLastRow();
  if (lastRow < 2) return [];
  
  var range = settingsSheet.getRange('D2:E' + lastRow).getValues();
  var texts = [];
  for (var i = 0; i < range.length; i++) {
    var phrase = range[i][0] ? range[i][0].toString().trim() : '';
    var title = range[i][1] ? range[i][1].toString().trim() : '';
    if (phrase && title) {
      texts.push({ title: title, phrase: phrase });
    }
  }
  return texts;
}

// جلب إعدادات العلامة المائية للصور
function getWatermarkSettings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) return {};
  var range = settingsSheet.getRange('G2:G8').getValues();
  return {
    logoUrl: range[0][0] ? range[0][0].toString().trim() : '',
    opacity: range[1][0] ? parseFloat(range[1][0]) : 1,
    sizeFactor: range[2][0] ? parseFloat(range[2][0]) : 1,
    logoPosition: range[3][0] ? range[3][0].toString().trim() : 'bottom-right',
    textPrefix: range[4][0] ? range[4][0].toString().trim() : '',
    fontSize: range[5][0] ? parseInt(range[5][0]) : 20,
    textPosition: range[6][0] ? range[6][0].toString().trim() : 'bottom-left'
  };
}

// جلب قائمة المعلمين وبيانات التسجيل والأجهزة المسموحة
function getUsers() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName('Settings');
  if (!settingsSheet) return [];
  var lastRow = settingsSheet.getLastRow();
  if (lastRow < 2) return [];
  
  var usersData = settingsSheet.getRange('Z2:AB' + lastRow).getValues();
  return usersData.map(function(row) {
    return {
      username: row[0] ? row[0].toString().trim() : '',
      password: row[1] ? row[1].toString().trim() : '',
      status: row[2] ? row[2].toString().trim() : ''
    };
  }).filter(function(user) { 
    return user.username !== ''; 
  });
}

// جلب بيانات الدروس والطلاب بالكامل من الجدول الرئيسي
function getTableData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('A1');
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  var range = sheet.getRange('A2:Y' + lastRow).getValues();
  var displayRange = sheet.getRange('T2:Y' + lastRow).getDisplayValues();
  var data = [];
  
  for (var i = 0; i < range.length; i++) {
    var imageUrl = range[i][4]; // العمود E
    var audioUrl = range[i][6]; // العمود G
    
    data.push({
      studentId: range[i][0].toString(), // A
      studentName: range[i][1].toString(), // B
      lessonNumber: parseInt(range[i][2]) || 0, // C
      imageSubmissionCount: parseInt(range[i][3]) || 0, // D
      imageUrl: imageUrl || '',
      audioSubmissionCount: parseInt(range[i][5]) || 0, // F
      audioUrl: audioUrl || '',
      isSaved: range[i][7] === 'تم', // H
      notes: range[i][8] || '', // I
      imageGrade: range[i][9] || '', // J
      modifiedImageUrl: range[i][10] || '', // K
      audioGrade: range[i][11] || '', // L
      additionalImageUrl: range[i][12] || '', // M
      videoUrl: range[i][13] || '', // N
      correctionAudioUrl: range[i][14] || '', // O
      date: range[i][15] || '', // P
      submissionCount: parseInt(range[i][16]) || 0, // Q
      additionalT: displayRange[i][0], // T
      additionalU: displayRange[i][1], // U
      additionalV: displayRange[i][2], // V
      additionalW: displayRange[i][3], // W
      additionalX: displayRange[i][4], // X
      additionalY: displayRange[i][5], // Y
      rowNumber: i + 2
    });
  }
  return data;
}

// تسجيل دخول معلم وفحص الأجهزة المتاحة والموقع الجغرافي للشبكة
function loginUser(username, deviceId, location) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName('Settings');
  var lastRow = settingsSheet.getLastRow();
  var usersRange = settingsSheet.getRange("Z2:AX" + lastRow);
  var usersData = usersRange.getValues();
  var userRow = -1;
  
  for (var i = 0; i < usersData.length; i++) {
    if (usersData[i][0].toString().trim() === username) {
      userRow = i + 2;
      break;
    }
  }
  
  if (userRow === -1) {
    return { success: false, message: 'اسم المعلم غير مسجل' };
  }
  
  var deviceColumns = [
    {locationCol: 31, deviceCol: 32}, // AE, AF (31, 32)
    {locationCol: 33, deviceCol: 34}, // AG, AH
    {locationCol: 35, deviceCol: 36}, // AI, AJ
    {locationCol: 37, deviceCol: 38}, // AK, AL
    {locationCol: 39, deviceCol: 40}, // AM, AN
    {locationCol: 41, deviceCol: 42}, // AO, AP
    {locationCol: 43, deviceCol: 44}, // AQ, AR
    {locationCol: 45, deviceCol: 46}, // AS, AT
    {locationCol: 47, deviceCol: 48}, // AU, AV
    {locationCol: 49, deviceCol: 50}  // AW, AX
  ];
  
  var allowedDevices = parseInt(settingsSheet.getRange(userRow, 29).getValue()) || 1; // AC (العمود 29)
  allowedDevices = Math.min(allowedDevices, 10);
  
  var deviceIndex = -1;
  for (var j = 0; j < allowedDevices; j++) {
    var currentDeviceId = settingsSheet.getRange(userRow, deviceColumns[j].deviceCol).getValue().toString().trim();
    if (currentDeviceId === deviceId) {
      deviceIndex = j;
      break;
    }
  }
  
  var registeredCount = 0;
  for (var j = 0; j < allowedDevices; j++) {
    if (settingsSheet.getRange(userRow, deviceColumns[j].deviceCol).getValue().toString().trim() !== '') {
      registeredCount++;
    }
  }
  
  if (deviceIndex === -1) {
    if (registeredCount >= allowedDevices) {
      return { success: false, message: 'عذراً! تم تجاوز عدد الأجهزة المسموح بها لهذا الحساب.' };
    }
    for (var j = 0; j < allowedDevices; j++) {
      if (settingsSheet.getRange(userRow, deviceColumns[j].deviceCol).getValue().toString().trim() === '') {
        deviceIndex = j;
        break;
      }
    }
  }
  
  if (deviceIndex !== -1) {
    settingsSheet.getRange(userRow, deviceColumns[deviceIndex].locationCol).setValue(location || 'متصفح ويب');
    settingsSheet.getRange(userRow, deviceColumns[deviceIndex].deviceCol).setValue(deviceId);
    return { success: true };
  } else {
    return { success: false, message: 'خطأ أثناء ربط الجهاز بالحساب' };
  }
}

// دالة لرفع وحفظ جميع ملفات الميديا (صورة، صوت، فيديو) إلى قوقل درايف وتحديث الشيت
function saveAllMedia(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('A1');
  var settingsSheet = ss.getSheetByName('Settings');
  
  var folderUrl = settingsSheet.getRange('B2').getValue();
  if (!folderUrl) {
    throw new Error('رابط مجلد الحفظ في درايف غير متوفر في Settings!B2');
  }
  
  // استخراج معرف المجلد
  var folderId = folderUrl.split('?')[0].match(/\\/([a-zA-Z0-9_-]+)(?:\\/)?$/);
  if (!folderId) {
    var driveIdMatch = folderUrl.match(/id=([a-zA-Z0-9_-]+)/);
    folderId = driveIdMatch ? driveIdMatch[1] : folderUrl;
  } else {
    folderId = folderId[1];
  }
  
  var folder = DriveApp.getFolderById(folderId);
  var row = payload.rowNumber;
  var urls = {};
  
  // تحديث عدد مرات الحفظ في العمود Q إذا كان الحفظ لأول مرة
  var currentH = sheet.getRange('H' + row).getValue();
  if (currentH !== 'تم') {
    var currentQ = parseInt(sheet.getRange('Q' + row).getValue()) || 0;
    sheet.getRange('Q' + row).setValue(currentQ + 1);
  }
  
  // حفظ الصورة المعدلة
  if (payload.canvasBase64 && payload.canvasBase64.startsWith('data:image/')) {
    var fileBlob = base64ToBlob(payload.canvasBase64, 'modified_image_' + row + '.jpg');
    var file = folder.createFile(fileBlob);
    urls.modified = file.getUrl();
    sheet.getRange('K' + row).setValue(urls.modified);
  }
  
  // حفظ الصورة الإضافية
  if (payload.imageBase64 && payload.imageBase64.startsWith('data:image/')) {
    var fileBlob = base64ToBlob(payload.imageBase64, 'extra_image_' + row + '.jpg');
    var file = folder.createFile(fileBlob);
    urls.image = file.getUrl();
    sheet.getRange('M' + row).setValue(urls.image);
  }
  
  // حفظ الفيديو المسجل
  if (payload.videoBase64 && payload.videoBase64.startsWith('data:video/')) {
    var fileBlob = base64ToBlob(payload.videoBase64, 'correction_video_' + row + '.mp4');
    var file = folder.createFile(fileBlob);
    urls.video = file.getUrl();
    sheet.getRange('N' + row).setValue(urls.video);
  }
  
  // حفظ الصوت المسجل
  if (payload.audioBase64 && payload.audioBase64.startsWith('data:audio/')) {
    var fileBlob = base64ToBlob(payload.audioBase64, 'correction_audio_' + row + '.mp3');
    var file = folder.createFile(fileBlob);
    urls.audio = file.getUrl();
    sheet.getRange('O' + row).setValue(urls.audio);
  }
  
  // تحديث الشيت بالقيم العادية
  sheet.getRange('I' + row).setValue(payload.notes || '');
  if (payload.imageGrade !== undefined) sheet.getRange('J' + row).setValue(payload.imageGrade || '');
  if (payload.audioGrade !== undefined) sheet.getRange('L' + row).setValue(payload.audioGrade || '');
  
  var formattedDate = Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm:ss");
  sheet.getRange('P' + row).setValue(formattedDate);
  sheet.getRange('H' + row).setValue('تم'); // تم الحفظ بنجاح
  
  // حفظ نسخة في ورقة CorrectionHistory
  saveToHistorySheet(ss, sheet, row, formattedDate);
  
  return { success: true, urls: urls };
}

// دالة تحويل Base64 إلى Blob
function base64ToBlob(base64String, filename) {
  var parts = base64String.split(',');
  var mime = parts[0].match(/:(.*?);/)[1];
  var bytes = Utilities.base64Decode(parts[1]);
  return Utilities.newBlob(bytes, mime, filename);
}

// حفظ سجل تاريخي للتصحيح للرجوع إليه لاحقاً
function saveToHistorySheet(ss, sheet, row, formattedDate) {
  var historySheet = ss.getSheetByName('CorrectionHistory');
  if (!historySheet) {
    historySheet = ss.insertSheet('CorrectionHistory');
    var headers = sheet.getRange('A1:Q1').getValues();
    historySheet.getRange('A1:Q1').setValues(headers);
    historySheet.getRange('R1').setValue('تاريخ الحفظ');
  }
  
  var rowData = sheet.getRange('A' + row + ':Q' + row).getValues()[0];
  rowData.push(formattedDate);
  
  var lastRow = historySheet.getLastRow();
  historySheet.appendRow(rowData);
}
`;
