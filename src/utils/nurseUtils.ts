// Service type definitions
export type ServiceType =
  | "blood_test"
  | "im"
  | "iv"
  | "patient_care"
  | "hemo_vs"
  | "other"
  | "full_time_private_normal"
  | "part_time_private_normal"
  | "full_time_private_psychiatric"
  | "part_time_private_psychiatric"
  | "medical_equipment";

export type PaymentType = "cash" | "whish";

// Constants
export const QUICK_SERVICE_TYPES = [
  "blood_test",
  "im",
  "iv",
  "hemo_vs",
  "patient_care",
  "other",
] as const;

export type QuickServiceType = (typeof QUICK_SERVICE_TYPES)[number];

export const COMMISSION_RATES = {
  quick_service: 3.0, // per service - commission varies based on payment type
  private_care_percentage: 0.2, // 20% commission for private care
} as const;

export const ROLE_COLORS = {
  registered: "blue",
  physiotherapist: "red",
  general_doctor: "magenta",
  superAdmin: "gold",
} as const;

export const ROLE_LABELS = {
  registered: "Registered Nurse (RN)",
  physiotherapist: "Physiotherapist",
  general_doctor: "General Doctor",
  superAdmin: "Super Admin",
} as const;

// Helper functions
export const isQuickService = (type: string): boolean => {
  return QUICK_SERVICE_TYPES.includes(type as QuickServiceType);
};

export const isMedicalSupply = (type: string): boolean => {
  return type === "medical_equipment";
};

// Common interfaces
export interface WorkingHoursLog {
  id: number;
  request_id: number;
  hours: number;
  work_date: string;
  notes: string;
  created_at: string;
  is_paid: boolean;
  request: {
    service_type: ServiceType[];
    price: number;
    payment_type: PaymentType;
    status: string;
  };
}

export interface NurseProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: "registered" | "physiotherapist" | "general_doctor" | "superAdmin";
  created_at: string;
  is_approved: boolean;
  is_blocked: boolean;
  amountWeOwe: number;
  amountTheyOwe: number;
  netAmount: number;
  normal_care_hourly_rate?: number;
  psychiatric_care_hourly_rate?: number;
  rates_updated_at?: string;
  nurse_working_hours_log?: WorkingHoursLog[];
}

export interface NurseRequest {
  id: number;
  service_type: ServiceType[];
  details: string;
  status: string;
  created_at: string;
  price: number;
  patient: {
    full_name: string;
    phone_number: string;
    location: string;
  };
}

// Utility functions for calculations
export const calculateNursePayments = (workingHours: WorkingHoursLog[]) => {
  let amountWeOwe = 0;
  let amountTheyOwe = 0;

  workingHours.forEach((log) => {
    if (!log.is_paid && log.request) {
      // Skip medical supply services
      if (log.request.service_type.some(isMedicalSupply)) {
        return;
      }

      const isQuickServiceRequest =
        log.request.service_type.some(isQuickService);

      if (isQuickServiceRequest) {
        // Quick service commission calculation based on payment type
        if (log.request.payment_type === "cash") {
          amountTheyOwe += COMMISSION_RATES.quick_service; // Nurse owes us for cash payments
        } else {
          amountWeOwe += COMMISSION_RATES.quick_service; // We owe nurse for whish payments
        }
      } else if (log.request.price) {
        // Private care payment calculation
        const hourlyRate = log.request.price;
        const nurseShare =
          hourlyRate * (1 - COMMISSION_RATES.private_care_percentage); // 80% of price
        amountWeOwe += nurseShare * log.hours;
      }
    }
  });

  return {
    amountWeOwe,
    amountTheyOwe,
    netAmount: amountWeOwe - amountTheyOwe,
  };
};
