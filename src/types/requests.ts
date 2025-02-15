export type BaseServiceRequest = {
  id: string;
  details: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  patient: {
    full_name: string;
    phone_number: string;
    location: string;
    area: string;
  };
};

export type QuickServiceType =
  | "blood_test"
  | "im"
  | "iv"
  | "patient_care"
  | "hemo_vs"
  | "other";
export type RegularCareType =
  | "full_time_private_normal"
  | "part_time_private_normal";
export type PsychiatricCareType =
  | "full_time_private_psychiatric"
  | "part_time_private_psychiatric";
export type PhysiotherapyType = "physiotherapy";

export type ServiceRequest<T> = BaseServiceRequest & {
  service_type: Array<T>;
};

export type ServiceType =
  | "blood_test"
  | "im"
  | "iv"
  | "patient_care"
  | "hemo_vs"
  | "other"
  | "physiotherapy"
  | "full_time_private_normal"
  | "part_time_private_normal"
  | "full_time_private_psychiatric"
  | "part_time_private_psychiatric";

export type RequestStatus = "pending" | "accepted" | "completed" | "cancelled";

export type Patient = {
  full_name: string;
  phone_number: string;
  location: string;
  area: string;
};

export type DatabaseResponse = {
  id: string;
  service_type: ServiceType[];
  details: string;
  status: RequestStatus;
  created_at: string;
  patient: Patient;
  working_hours?: number;
};

export const statusColors = {
  pending: "gold",
  accepted: "blue",
  completed: "green",
  cancelled: "red",
} as const;

export type StatusType = keyof typeof statusColors;
