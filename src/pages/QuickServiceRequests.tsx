import { QuickServiceType } from "../types/requests";
import { BaseRequestPage } from "../components/RequestPages/BaseRequestPage";

const serviceTypeLabels: Record<QuickServiceType, string> = {
  blood_test: "Blood Test",
  im: "Intramuscular Injection",
  iv: "Intravenous Therapy",
  patient_care: "Patient Care",
  hemo_vs: "Hemodynamic/Vital Signs",
  other: "Other Services",
};

export default function QuickServiceRequests() {
  return (
    <BaseRequestPage<QuickServiceType>
      title="Quick Service Requests"
      description="View and manage quick service requests"
      serviceTypes={serviceTypeLabels}
      tagColor="cyan"
      allowedServiceTypes={[
        "blood_test",
        "im",
        "iv",
        "patient_care",
        "hemo_vs",
        "other",
      ]}
      showStatus={false}
    />
  );
}
