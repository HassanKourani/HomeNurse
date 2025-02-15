import { RegularCareType } from "../types/requests";
import { BaseRequestPage } from "../components/RequestPages/BaseRequestPage";

const serviceTypeLabels: Record<RegularCareType, string> = {
  full_time_private_normal: "Full Time Private Care",
  part_time_private_normal: "Part Time Private Care",
};

export default function RegularCareRequests() {
  return (
    <BaseRequestPage<RegularCareType>
      title="Regular Care Requests"
      description="View and manage full-time and part-time private care requests"
      serviceTypes={serviceTypeLabels}
      tagColor="blue"
      allowedServiceTypes={[
        "full_time_private_normal",
        "part_time_private_normal",
      ]}
    />
  );
}
