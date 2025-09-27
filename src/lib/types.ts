export type User = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'patient' | 'doctor' | 'admin';
  locale?: string;
  pushToken?: string;
  profile?: {
    dob: string;
    sex: 'male' | 'female' | 'other';
    contact: string;
  };
};

export type ExtractedValue = {
  test: string;
  value: number | string;
  unit?: string;
  referenceRange?: {
    low?: number;
    high?: number;
  };
  status?: 'normal' | 'abnormal';
};

export type Report = {
  id: string;
  name: string;
  patientId: string;
  storagePath: string;
  uploadedAt: string; // ISO date string
  extractedValues: ExtractedValue[];
  chartsData?: any; // To be defined
  suggestedFollowUps: {
    test: string;
    reason: string;
    priority: string;
  }[];
  riskSummary: {
    condition: string;
    confidence: string;
    note: string;
  }[];
  patientExplanation: string;
};

export type Prescription = {
  id: string;
  name: string;
  patientId: string;
  storagePath: string;
  uploadedAt: string; // ISO date string
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    reason: string;
  }[];
  interactions: {
    drugA: string;
    drugB: string;
    severity: 'low' | 'moderate' | 'high';
    message: string;
  }[];
  validatedBy?: string | null; // doctorId
};

export type HealthMetric = {
  id: string;
  metricType: 'Cholesterol' | 'Blood Pressure' | 'Glucose';
  timestamp: string; // ISO date string
  value: number;
  unit: string;
};

export type Reminder = {
  id:string;
  patientId: string;
  medicineName: string;
  time: string; // e.g., "08:00"
  recurrence: string;
  enabled: boolean;
};

export type Pharmacy = {
    id: string;
    name: string;
    address: string;
    distance?: number;
    coords: { lat: number; lng: number };
    stock?: { medicineName: string; available: boolean; lastUpdated: string }[];
};
