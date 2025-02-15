import { PhysiotherapyType } from "../types/requests";
import { BaseRequestPage } from "../components/RequestPages/BaseRequestPage";

const serviceTypeLabels: Record<PhysiotherapyType, string> = {
  physiotherapy: "Physiotherapy",
};

export default function PhysiotherapyRequests() {
  return (
    <BaseRequestPage<PhysiotherapyType>
      title="Physiotherapy Requests"
      description="View and manage physiotherapy service requests"
      serviceTypes={serviceTypeLabels}
      tagColor="green"
      allowedServiceTypes={["physiotherapy"]}
    />
  );
}
