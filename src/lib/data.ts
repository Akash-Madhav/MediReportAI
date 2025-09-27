import type { User, Report, Prescription, HealthMetric, Reminder, Pharmacy } from './types';

export const mockUser: User = {
  uid: 'mock-user-123',
  displayName: 'Jane Doe',
  email: 'jane.doe@example.com',
  photoURL: 'https://picsum.photos/seed/101/100/100',
  role: 'patient',
  profile: {
    dob: '1985-05-15',
    sex: 'female',
    contact: '+1234567890'
  }
};

export const mockReports: Report[] = [
  {
    id: 'report-001',
    name: "Annual Check-up Bloodwork",
    patientId: 'mock-user-123',
    storagePath: '/uploads/reports/mock-user-123/report-001.pdf',
    uploadedAt: '2023-10-26T10:00:00Z',
    extractedValues: [
      { test: 'Hemoglobin A1c', value: 5.9, unit: '%', referenceRange: { low: 4.8, high: 5.6 }, status: 'abnormal' },
      { test: 'Total Cholesterol', value: 210, unit: 'mg/dL', referenceRange: { high: 200 }, status: 'abnormal' },
      { test: 'LDL Cholesterol', value: 135, unit: 'mg/dL', referenceRange: { high: 130 }, status: 'abnormal' },
      { test: 'HDL Cholesterol', value: 55, unit: 'mg/dL', referenceRange: { low: 40 }, status: 'normal' },
      { test: 'TSH', value: 2.5, unit: 'mIU/L', referenceRange: { low: 0.4, high: 4.0 }, status: 'normal' },
    ],
    suggestedFollowUps: [
      { test: 'Fasting Glucose', reason: 'Elevated HbA1c may indicate pre-diabetes.', priority: 'Medium' },
      { test: 'Lipid Panel Repeat', reason: 'Monitor cholesterol levels after dietary changes.', priority: 'Low' },
    ],
    riskSummary: [
      { condition: 'Pre-diabetes', confidence: 'Moderate', note: 'Based on HbA1c level. Lifestyle modification recommended.' },
      { condition: 'Hyperlipidemia', confidence: 'High', note: 'Elevated total and LDL cholesterol.' },
    ],
    patientExplanation: 'Your recent blood test shows slightly elevated blood sugar and cholesterol levels. We recommend some dietary changes and a follow-up test in a few months to monitor these levels. Overall, your results are mostly good, but these are important areas to watch.'
  },
  {
    id: 'report-002',
    name: "Thyroid Function Test",
    patientId: 'mock-user-123',
    storagePath: '/uploads/reports/mock-user-123/report-002.pdf',
    uploadedAt: '2023-05-12T09:30:00Z',
    extractedValues: [
       { test: 'TSH', value: 3.1, unit: 'mIU/L', referenceRange: { low: 0.4, high: 4.0 }, status: 'normal' },
       { test: 'Free T4', value: 1.4, unit: 'ng/dL', referenceRange: { low: 0.8, high: 1.8 }, status: 'normal' },
    ],
    suggestedFollowUps: [],
    riskSummary: [],
    patientExplanation: 'Your thyroid function tests are all within the normal range. No follow-up is needed at this time.'
  },
];

export const mockPrescriptions: Prescription[] = [
  {
    id: 'presc-001',
    name: "Metformin Rx",
    patientId: 'mock-user-123',
    storagePath: '/uploads/prescriptions/mock-user-123/presc-001.jpg',
    uploadedAt: '2023-10-28T14:00:00Z',
    medicines: [
      { name: 'Metformin', dosage: '500 mg', frequency: 'Twice daily', route: 'Oral' },
      { name: 'Lisinopril', dosage: '10 mg', frequency: 'Once daily', route: 'Oral' },
    ],
    interactions: [
      { drugA: 'Metformin', drugB: 'Lisinopril', severity: 'low', message: 'Monitor blood glucose levels, as ACE inhibitors like Lisinopril can enhance the blood-glucose-lowering effect of antidiabetic agents.' }
    ],
    validatedBy: 'doc-456'
  },
  {
    id: 'presc-002',
    name: "Allergy Season Rx",
    patientId: 'mock-user-123',
    storagePath: '/uploads/prescriptions/mock-user-123/presc-002.jpg',
    uploadedAt: '2023-04-02T11:00:00Z',
    medicines: [
      { name: 'Cetirizine', dosage: '10 mg', frequency: 'Once daily as needed', route: 'Oral' },
    ],
    interactions: [],
    validatedBy: 'doc-456'
  }
];

export const mockHealthMetrics: HealthMetric[] = [
  { id: 'hm-1', metricType: 'Cholesterol', timestamp: '2023-01-15T08:00:00Z', value: 220, unit: 'mg/dL' },
  { id: 'hm-2', metricType: 'Cholesterol', timestamp: '2023-04-20T08:30:00Z', value: 215, unit: 'mg/dL' },
  { id: 'hm-3', metricType: 'Cholesterol', timestamp: '2023-07-22T08:15:00Z', value: 212, unit: 'mg/dL' },
  { id: 'hm-4', metricType: 'Cholesterol', timestamp: '2023-10-26T10:00:00Z', value: 210, unit: 'mg/dL' },
  { id: 'hm-5', metricType: 'Blood Pressure', timestamp: '2023-10-26T10:00:00Z', value: 125, unit: 'mmHg' },
  { id: 'hm-6', metricType: 'Blood Pressure', timestamp: '2023-07-22T08:15:00Z', value: 128, unit: 'mmHg' },
  { id: 'hm-7', metricType: 'Glucose', timestamp: '2023-10-26T10:00:00Z', value: 105, unit: 'mg/dL' },
  { id: 'hm-8', metricType: 'Glucose', timestamp: '2023-07-22T08:15:00Z', value: 98, unit: 'mg/dL' },
];

export const mockReminders: Reminder[] = [
  { id: 'rem-1', patientId: 'mock-user-123', medicineName: 'Metformin', time: '08:00', recurrence: 'Daily', enabled: true },
  { id: 'rem-2', patientId: 'mock-user-123', medicineName: 'Lisinopril', time: '08:00', recurrence: 'Daily', enabled: true },
  { id: 'rem-3', patientId: 'mock-user-123', medicineName: 'Metformin', time: '20:00', recurrence: 'Daily', enabled: true },
  { id: 'rem-4', patientId: 'mock-user-123', medicineName: 'Vitamin D', time: '09:00', recurrence: 'Daily', enabled: false },
];

export const mockPharmacies: Pharmacy[] = [
    {
        id: 'pharm-1',
        name: 'Downtown Health Pharmacy',
        address: '123 Main St, Metropolis, USA',
        coords: { lat: 40.7128, lng: -74.0060 },
        stock: [
            { medicineName: 'Metformin', available: true, lastUpdated: '2023-11-01T10:00:00Z'},
            { medicineName: 'Lisinopril', available: true, lastUpdated: '2023-11-01T10:00:00Z'},
        ]
    },
    {
        id: 'pharm-2',
        name: 'Uptown Wellness Center',
        address: '456 Oak Ave, Metropolis, USA',
        coords: { lat: 40.7580, lng: -73.9855 },
        stock: [
            { medicineName: 'Metformin', available: false, lastUpdated: '2023-11-01T09:00:00Z'},
            { medicineName: 'Lisinopril', available: true, lastUpdated: '2023-11-01T09:00:00Z'},
        ]
    },
     {
        id: 'pharm-3',
        name: 'Eastside Medical Supplies',
        address: '789 Pine Ln, Metropolis, USA',
        coords: { lat: 40.7484, lng: -73.9500 },
        stock: [
            { medicineName: 'Metformin', available: true, lastUpdated: '2023-10-31T15:00:00Z'},
            { medicineName: 'Lisinopril', available: true, lastUpdated: '2023-10-31T15:00:00Z'},
        ]
    }
]
