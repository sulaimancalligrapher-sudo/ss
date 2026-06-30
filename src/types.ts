/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface StudentRow {
  studentId: string;
  studentName: string;
  lessonNumber: number;
  imageSubmissionCount: number;
  imageUrl: string;
  audioSubmissionCount: number;
  audioUrl: string;
  isSaved: boolean;
  notes: string;
  imageGrade: string;
  modifiedImageUrl: string;
  audioGrade: string;
  additionalImageUrl: string;
  videoUrl: string;
  correctionAudioUrl: string;
  date: string;
  submissionCount: number;
  additionalT: string;
  additionalU: string;
  additionalV: string;
  additionalW: string;
  additionalX: string;
  additionalY: string;
  rowNumber: number;
}

export interface Teacher {
  username: string;
  password?: string;
  status: string; // "نعم" or "لا"
  allowedDevices: number;
  devices: { deviceId: string; location: string }[];
}

export interface PredefinedText {
  title: string;
  phrase: string;
}

export interface WatermarkSettings {
  logoUrl: string;
  opacity: number;
  sizeFactor: number;
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  textPrefix: string;
  fontSize: number;
  textPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface AppProfile {
  logoUrl: string;
  name: string;
  description: string;
}

export interface AppContact {
  facebook: string;
  instagram: string;
  youtube: string;
  line: string;
}

export interface ConnectionConfig {
  gasUrl: string;
  useSimulator: boolean;
}

export interface CorrectionHistoryLog extends StudentRow {
  logDate: string;
}
