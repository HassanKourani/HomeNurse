import { DoctorVisitType } from "../types/requests";
import { BaseRequestPage } from "../components/RequestPages/BaseRequestPage";

const serviceTypeLabels: Record<DoctorVisitType, string> = {
  general_doctor: "General Doctor",
};

export default function DoctorVisitRequests() {
  return (
    <BaseRequestPage<DoctorVisitType>
      title="Doctor Visit Requests"
      description="View and manage doctor visit requests for various specialties"
      serviceTypes={serviceTypeLabels}
      tagColor="magenta"
      allowedServiceTypes={["general_doctor"]}
      showStatus={true}
      statusOptions={[
        { value: "pending", label: "Pending" },
        { value: "accepted", label: "Accepted" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
      ]}
    />
  );
}
