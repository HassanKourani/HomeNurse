import { PsychiatricCareType } from "../types/requests";
import { BaseRequestPage } from "../components/RequestPages/BaseRequestPage";

const serviceTypeLabels: Record<PsychiatricCareType, string> = {
  full_time_private_psychiatric: "Full Time Psychiatric Care",
  part_time_private_psychiatric: "Part Time Psychiatric Care",
};

export default function PsychiatricCareRequests() {
  return (
    <BaseRequestPage<PsychiatricCareType>
      title="Psychiatric Care Requests"
      description="View and manage full-time and part-time psychiatric care requests"
      serviceTypes={serviceTypeLabels}
      tagColor="purple"
      allowedServiceTypes={[
        "full_time_private_psychiatric",
        "part_time_private_psychiatric",
      ]}
    />
  );
}
