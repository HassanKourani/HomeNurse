import { MedicalSupplyType } from "../types/requests";
import { BaseRequestPage } from "../components/RequestPages/BaseRequestPage";

const serviceTypeLabels: Record<MedicalSupplyType, string> = {
  medical_equipment: "Medical Equipment",
};

export default function MedicalSupplyRequests() {
  return (
    <BaseRequestPage<MedicalSupplyType>
      title="Medical Supply Requests"
      description="View and manage medical supply and equipment requests"
      serviceTypes={serviceTypeLabels}
      tagColor="orange"
      allowedServiceTypes={["medical_equipment"]}
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
