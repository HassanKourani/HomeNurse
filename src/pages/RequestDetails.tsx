import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Tag,
  Button,
  Descriptions,
  Input,
  Spin,
  DatePicker,
  Modal,
  Avatar,
  List,
  Checkbox,
  Table,
  Form,
} from "antd";
import { motion } from "framer-motion";
import styled from "styled-components";
import supabase from "../utils/supabase";
import { useNavigate, useParams } from "react-router-dom";
import {
  HomeOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CheckOutlined,
  UserAddOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  FileOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useAuth } from "../utils/AuthContext";
import dayjs from "dayjs";
import { useNotification } from "../utils/NotificationProvider";
import { sendNurseAssignmentRequest } from "../utils/emailUtils";
import { Area } from "../components/Landing/LandingForm";

const { Title, Text } = Typography;

type RequestDetails = {
  id: string;
  service_type: Array<
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
    | "physiotherapy"
  >;
  details: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  price: number | null;
  visit_date: string | null;
  image_id: string | null;
  assigned_nurses: Array<{
    id: string;
    full_name: string;
    phone_number: string;
    working_hours?: number;
  }>;
  patient: {
    full_name: string;
    phone_number: string;
    location: string;
    area: string;
  };
};

interface WorkingHoursLog {
  id: number;
  request_id: number;
  nurse_id: string;
  hours: number;
  work_date: string;
  notes: string;
  created_at: string;
}

// Add interface for form values
interface HoursLogFormValues {
  work_date: dayjs.Dayjs;
  hours: number;
  notes?: string;
}

interface NurseAssignment {
  nurse: {
    id: string;
    full_name: string;
    phone_number: string;
  };
  working_hours: number;
}

type NurseData = {
  id: string;
  full_name: string;
  phone_number: string;
  working_hours?: number;
};

const PageContainer = styled(motion.div)`
  padding: 24px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  min-height: 100vh;
  padding-top: 72px;
`;

const HeaderSection = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  .title-section {
    h2 {
      margin: 0;
      color: #1a3d7c;
    }

    p {
      margin: 8px 0 0;
      color: #666;
      font-size: 16px;
    }
  }

  .actions-section {
    display: flex;
    gap: 12px;
  }

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    text-align: center;

    .actions-section {
      justify-content: center;
    }
  }
`;

const StyledCard = styled(motion(Card))`
  margin-bottom: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 24px;

    @media (max-width: 576px) {
      padding: 16px;
    }
  }

  .ant-descriptions {
    .ant-descriptions-header {
      margin-bottom: 20px;
    }
  }

  .ant-descriptions-bordered {
    .ant-descriptions-view {
      border: 1px solid #f0f0f0;
      border-radius: 8px;
    }

    .ant-descriptions-item-label {
      color: #666;
      font-weight: 500;
      background-color: rgba(24, 144, 255, 0.02);
      padding: 16px 24px;
      width: 200px;

      @media (max-width: 768px) {
        width: 100%;
        border-bottom: none !important;
        padding: 16px 24px 4px;
      }
    }

    .ant-descriptions-item-content {
      color: #1a3d7c;
      font-weight: 500;
      padding: 16px 24px;

      @media (max-width: 768px) {
        padding: 4px 24px 16px;
        border-bottom: 1px solid #f0f0f0;
      }

      .ant-tag {
        white-space: nowrap;
      }
    }
  }

  @media (max-width: 768px) {
    .ant-descriptions-bordered .ant-descriptions-row > th,
    .ant-descriptions-bordered .ant-descriptions-row > td {
      width: 100%;
      display: block;
    }

    .ant-descriptions-bordered .ant-descriptions-item {
      padding: 0;
    }

    .ant-descriptions-bordered .ant-descriptions-row {
      border-bottom: none;
    }
  }
`;

const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  &.ant-btn-primary {
    background: linear-gradient(120deg, #1890ff, #096dd9);
    border: none;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.25);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    }
  }

  &.ant-btn-default {
    border: 1px solid #d9d9d9;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const serviceTypeLabels = {
  blood_test: "Blood Test",
  im: "Intramuscular Injection",
  iv: "Intravenous Therapy",
  patient_care: "Patient Care",
  hemo_vs: "Hemodynamic/Vital Signs",
  other: "Other Services",
  full_time_private_normal: "Full Time Regular Care",
  part_time_private_normal: "Part Time Regular Care",
  full_time_private_psychiatric: "Full Time Psychiatric Care",
  part_time_private_psychiatric: "Part Time Psychiatric Care",
  physiotherapy: "Physiotherapy",
};

const areaLabels: Record<Area, string> = {
  beirut: "Beirut",
  near_beirut: "Near Beirut",
  mount_lebanon: "Mount Lebanon",
  north_lebanon: "North Lebanon",
  south_lebanon: "South Lebanon",
  bekaa: "Bekaa",
};

const statusColors = {
  pending: "gold",
  accepted: "blue",
  completed: "green",
  cancelled: "red",
};

const getServiceTypeColor = (type: string) => {
  if (type.includes("psychiatric")) return "purple";
  if (type.includes("private_normal")) return "blue";
  if (type === "physiotherapy") return "green";
  return "cyan";
};

const PriceEditSection = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  .ant-input {
    width: 160px;
    flex-shrink: 0;
  }

  .ant-btn {
    min-width: 90px;
    flex-shrink: 0;
  }

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    .ant-input {
      width: 100% !important;
    }

    .ant-btn {
      width: 100%;
    }
  }
`;

const isQuickService = (type: string) => {
  const quickServices = [
    "blood_test",
    "im",
    "iv",
    "patient_care",
    "hemo_vs",
    "other",
  ];
  return quickServices.includes(type);
};

const isPhysiotherapyService = (type: string) => {
  return type === "physiotherapy";
};

const isPrivateOrPsychiatricService = (type: string) => {
  const privateServices = [
    "full_time_private_normal",
    "full_time_private_psychiatric",
    "part_time_private_normal",
    "part_time_private_psychiatric",
  ];
  return privateServices.includes(type);
};

const canViewRequest = (
  userRole: string | null,
  request: RequestDetails | null
) => {
  if (!userRole || !request) return false;

  const requestType = request.service_type[0];
  const isPhysio = isPhysiotherapyService(requestType);
  const isQuick = isQuickService(requestType);
  const isPrivateOrPsych = isPrivateOrPsychiatricService(requestType);

  // Super admin can view all requests
  if (userRole === "superAdmin") return true;

  // If user is a physiotherapist, they can only view physiotherapy requests
  if (userRole === "physiotherapist") return isPhysio;

  // Regular nurses can view quick services and private/psychiatric care, but not physiotherapy
  if (userRole === "registered") return isQuick || isPrivateOrPsych;

  // Patients can view their own requests
  if (userRole === "patient") return true;

  return false;
};

const logOneHourForNurse = async (nurseId: string, requestId: number) => {
  const today = dayjs().format("YYYY-MM-DD");
  try {
    // First check if there's already a log for today
    const { data: existingLog } = await supabase
      .from("nurse_working_hours_log")
      .select("*")
      .eq("request_id", requestId)
      .eq("nurse_id", nurseId)
      .eq("work_date", today)
      .single();

    if (existingLog) {
      // If a log already exists, don't create a new one
      return;
    }

    // If no log exists, create a new one
    const { error } = await supabase.rpc("add_nurse_working_hours", {
      rid: requestId,
      nid: nurseId,
      hours: 1,
      work_date: today,
      notes: "Automatically logged for quick service",
    });
    if (error) throw error;
  } catch (error) {
    // Only throw if it's not a "no rows returned" error
    if (error instanceof Error && !error.message.includes("no rows returned")) {
      console.error("Error logging automatic hour:", error);
      throw error;
    }
  }
};

const ViewDocumentButton = styled(Button)`
  margin-left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const DocumentModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
  }

  .ant-modal-body {
    padding: 24px;
    text-align: center;
  }

  .document-container {
    max-height: 80vh;
    overflow: auto;
    margin: -24px;

    img,
    object {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
    }
  }

  .document-actions {
    position: sticky;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 16px;
    display: flex;
    justify-content: center;
    gap: 16px;
    border-top: 1px solid #f0f0f0;
  }
`;

export default function RequestDetails() {
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingVisitDate, setEditingVisitDate] = useState(false);
  const [newPrice, setNewPrice] = useState<string>("");
  const [newVisitDate, setNewVisitDate] = useState<string | null>(null);
  const [savingPrice, setSavingPrice] = useState(false);
  const [savingVisitDate, setSavingVisitDate] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [completingRequest, setCompletingRequest] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [availableNurses, setAvailableNurses] = useState<
    Array<{
      id: string;
      full_name: string;
      phone_number: string;
      role: string;
    }>
  >([]);
  const [assigningNurse, setAssigningNurse] = useState(false);
  const [isAssignNurseModalVisible, setIsAssignNurseModalVisible] =
    useState(false);
  const [nurseSearchQuery, setNurseSearchQuery] = useState("");
  const [selectedNurseIds, setSelectedNurseIds] = useState<string[]>([]);
  const [isHoursModalVisible, setIsHoursModalVisible] = useState(false);
  const [selectedNurseForHours, setSelectedNurseForHours] = useState<{
    id: string;
    full_name: string;
  } | null>(null);
  const [workingHoursLogs, setWorkingHoursLogs] = useState<WorkingHoursLog[]>(
    []
  );
  const [loadingHoursLog, setLoadingHoursLog] = useState(false);
  const [form] = Form.useForm();
  const notificationApi = useNotification();
  const [isDocumentModalVisible, setIsDocumentModalVisible] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<string>("");
  const [requestingAssignment, setRequestingAssignment] = useState(false);
  const [hasRequestedAssignment, setHasRequestedAssignment] = useState(() => {
    const requestedAssignments = localStorage.getItem("requestedAssignments");
    if (requestedAssignments) {
      const requests = JSON.parse(requestedAssignments);
      return requests.includes(id);
    }
    return false;
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        setUserRole(profile?.role || null);
      }
    };

    fetchUserRole();
  }, [user]);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!id || !userRole) return; // Wait for both id and userRole to be available

      try {
        // First fetch the request details
        const { data: requestData, error: requestError } = await supabase
          .from("requests")
          .select(
            `
            id,
            service_type,
            details,
            status,
            created_at,
            price,
            visit_date,
            image_id,
            assigned_nurses:request_nurse_assignments(
              nurse:profiles(
                id,
                full_name,
                phone_number
              ),
              working_hours
            ),
            patient:profiles!fk_patient(
              full_name,
              phone_number,
              location,
              area
            )
          `
          )
          .eq("id", parseInt(id))
          .single();

        if (requestError) throw requestError;

        // Then fetch all assigned nurses
        const { data: nurseAssignments, error: nurseError } = await supabase
          .from("request_nurse_assignments")
          .select(
            `
            nurse:profiles (
              id,
              full_name,
              phone_number
            ),
            working_hours
          `
          )
          .eq("request_id", parseInt(id));

        if (nurseError) throw nurseError;

        interface PatientType {
          full_name: string;
          phone_number: string;
          location: string;
          area: string;
        }

        const assignedNurses = (
          nurseAssignments as unknown as NurseAssignment[]
        ).map((assignment) => ({
          id: assignment.nurse.id,
          full_name: assignment.nurse.full_name,
          phone_number: assignment.nurse.phone_number,
          working_hours: assignment.working_hours,
        }));

        const transformedRequest = {
          ...requestData,
          assigned_nurses: assignedNurses,
          patient: requestData.patient as unknown as PatientType,
        } as RequestDetails;

        // Check if the user has permission to view this request
        if (!canViewRequest(userRole, transformedRequest)) {
          navigate("/");
          notificationApi.error({
            message: "Access Denied",
            description: "You don't have permission to view this request.",
          });
          return; // Exit early if no permission
        }

        setRequest(transformedRequest);
        setNewPrice(requestData.price?.toString() || "");
        setNewVisitDate(requestData.visit_date || null);
      } catch (error) {
        console.error("Error in request details:", error);
        notificationApi.error({
          message: "Error",
          description: "An unexpected error occurred",
          placement: "topRight",
        });
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "PGRST116"
        ) {
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id, userRole, navigate, notificationApi]); // Added userRole to dependencies

  useEffect(() => {
    const fetchAvailableNurses = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, phone_number, role")
          .in("role", [
            "registered",
            "licensed",
            "practitioner",
            "nurse",
            "physiotherapist",
          ])
          .is("is_approved", true)
          .is("is_blocked", false)
          .order("full_name");

        if (error) throw error;
        setAvailableNurses(data || []);
      } catch (error) {
        console.error("Error fetching nurses:", error);
        notificationApi.error({
          message: "Error",
          description: "Failed to fetch available nurses",
          placement: "topRight",
        });
      }
    };

    if (userRole === "superAdmin") {
      fetchAvailableNurses();
    }
  }, [userRole]);

  const handleUpdatePrice = async () => {
    if (!newPrice || !id) return;

    try {
      setSavingPrice(true);
      const { error } = await supabase.rpc("update_price", {
        rid: parseInt(id),
        price: parseFloat(newPrice),
      });

      if (error) {
        console.error("Error updating price:", error);
        notificationApi.error({
          message: "Error",
          description: "Failed to update price",
          placement: "topRight",
        });
        return;
      }

      // If successful, update the local state
      setRequest((prev) =>
        prev ? { ...prev, price: parseFloat(newPrice) } : null
      );
      setEditingPrice(false);
      notificationApi.success({
        message: "Success",
        description: "Price updated successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error updating price:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to update price",
        placement: "topRight",
      });
    } finally {
      setSavingPrice(false);
    }
  };

  const handleUpdateVisitDate = async () => {
    if (!newVisitDate || !id) return;

    try {
      setSavingVisitDate(true);
      const { error } = await supabase.rpc("set_request_visit_date", {
        rid: parseInt(id),
        visit_date: newVisitDate,
      });

      if (error) {
        console.error("Error updating visit date:", error);
        notificationApi.error({
          message: "Error",
          description: "Failed to update visit date",
          placement: "topRight",
        });
        return;
      }

      // If successful, update the local state
      setRequest((prev) =>
        prev ? { ...prev, visit_date: newVisitDate } : null
      );
      setEditingVisitDate(false);
      notificationApi.success({
        message: "Success",
        description: "Visit date updated successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error updating visit date:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to update visit date",
        placement: "topRight",
      });
    } finally {
      setSavingVisitDate(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!id || !user?.id) return;

    try {
      setApprovingRequest(true);
      const { error } = await supabase.rpc("assign_nurse_to_request", {
        rid: parseInt(id),
        nid: user.id,
      });

      if (error) {
        console.error("Error approving request:", error);
        notificationApi.error({
          message: "Error",
          description: "Failed to approve request",
          placement: "topRight",
        });
        return;
      }

      // Fetch nurse details from profiles
      const { data: nurseData, error: nurseError } = await supabase
        .from("profiles")
        .select("id, full_name, phone_number")
        .eq("id", user.id)
        .single();

      if (nurseError) {
        console.error("Error fetching nurse details:", nurseError);
        notificationApi.error({
          message: "Error",
          description: "Failed to fetch nurse details",
          placement: "topRight",
        });
        return;
      }

      let nurseToAdd: NurseData = nurseData as NurseData;

      // If it's a quick service, automatically log one hour
      if (request && isQuickService(request.service_type[0])) {
        try {
          await logOneHourForNurse(user.id, parseInt(id));
          nurseToAdd = {
            ...nurseToAdd,
            working_hours: 1,
          };
        } catch (error) {
          console.error("Error logging automatic hour:", error);
          notificationApi.warning({
            message: "Warning",
            description: "Request approved but failed to log automatic hour",
            placement: "topRight",
          });
        }
      }

      // Update local state
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              status: "accepted",
              assigned_nurses: [...(prev.assigned_nurses || []), nurseToAdd],
            }
          : null
      );
      notificationApi.success({
        message: "Success",
        description: "Request approved successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error approving request:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to approve request",
        placement: "topRight",
      });
    } finally {
      setApprovingRequest(false);
    }
  };

  const handleRemoveNurse = async (nurseId: string) => {
    if (!id || userRole !== "superAdmin") {
      notificationApi.error({
        message: "Error",
        description: "Only super admins can remove nurses from requests",
        placement: "topRight",
      });
      return;
    }

    try {
      // First, delete all working hours logs using the RPC function
      const { data: deleteResult, error: deleteHoursError } =
        await supabase.rpc("delete_nurse_request_hours", {
          rid: parseInt(id),
          nid: nurseId,
        });

      if (deleteHoursError || !deleteResult?.success) {
        console.error(
          "Error deleting working hours:",
          deleteHoursError || deleteResult?.error
        );
        notificationApi.error({
          message: "Error",
          description: "Failed to delete nurse's working hours",
          placement: "topRight",
        });
        return;
      }

      // Then remove the nurse from the request
      const { error } = await supabase.rpc("remove_nurse_from_request", {
        rid: parseInt(id),
        nid: nurseId,
      });

      if (error) {
        console.error("Error removing nurse:", error);
        notificationApi.error({
          message: "Error",
          description: "Failed to remove nurse",
          placement: "topRight",
        });
        return;
      }

      // Update local state
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              assigned_nurses: prev.assigned_nurses.filter(
                (nurse) => nurse.id !== nurseId
              ),
              status:
                prev.assigned_nurses.length <= 1 ? "pending" : prev.status,
            }
          : null
      );
      notificationApi.success({
        message: "Success",
        description: `Nurse and their working hours (${deleteResult.deleted_count} records) removed successfully`,
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error in nurse removal process:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to complete nurse removal process",
        placement: "topRight",
      });
    }
  };

  const handleCancelRequest = async () => {
    if (!id) return;

    try {
      setCancellingRequest(true);
      const { error } = await supabase.rpc("cancel_request", {
        request_id: parseInt(id),
      });

      if (error) {
        console.error("Error cancelling request:", error);
        notificationApi.error({
          message: "Error",
          description: "Failed to cancel request",
          placement: "topRight",
        });
        return;
      }

      // Update local state
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              status: "cancelled",
            }
          : null
      );
      notificationApi.success({
        message: "Success",
        description: "Request cancelled successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error cancelling request:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to cancel request",
        placement: "topRight",
      });
    } finally {
      setCancellingRequest(false);
    }
  };

  const handleCompleteRequest = async () => {
    if (!id) return;

    try {
      setCompletingRequest(true);
      const { error } = await supabase.rpc("complete_request", {
        rid: parseInt(id),
      });

      if (error) throw error;

      // Update local state
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
            }
          : null
      );
      notificationApi.success({
        message: "Success",
        description: "Request marked as completed successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error completing request:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to complete request",
        placement: "topRight",
      });
    } finally {
      setCompletingRequest(false);
    }
  };

  const canEditPrice =
    userRole === "superAdmin" ||
    (userRole !== "patient" &&
      request?.assigned_nurses.some(
        (nurse) =>
          nurse.id === user?.id && isQuickService(request.service_type[0])
      ));

  const canApproveRequest =
    userRole &&
    userRole !== "patient" &&
    !request?.assigned_nurses.length &&
    request?.status === "pending" &&
    (isQuickService(request.service_type[0]) || userRole === "superAdmin");

  const canCancelRequest =
    request?.status === "accepted" && userRole === "superAdmin";

  const isNurseAssigned =
    userRole !== "patient" &&
    request?.assigned_nurses.some((nurse) => nurse.id === user?.id);

  const canCompleteRequest =
    (userRole === "superAdmin" ||
      (isNurseAssigned &&
        request?.service_type.some((service) => isQuickService(service)))) &&
    request?.status === "accepted";

  const canRequestAssignment =
    userRole &&
    userRole !== "patient" &&
    userRole !== "superAdmin" &&
    request &&
    !isQuickService(request.service_type[0]) &&
    request.status === "pending" &&
    !request.assigned_nurses.some((nurse) => nurse.id === user?.id) &&
    !hasRequestedAssignment;

  const filteredNurses = availableNurses.filter(
    (nurse) =>
      !request?.assigned_nurses.some((assigned) => assigned.id === nurse.id) &&
      (nurse.full_name.toLowerCase().includes(nurseSearchQuery.toLowerCase()) ||
        nurse.phone_number.includes(nurseSearchQuery))
  );

  const handleAssignMultipleNurses = async () => {
    if (!id || selectedNurseIds.length === 0) return;

    setAssigningNurse(true);
    let hasError = false;

    for (const nurseId of selectedNurseIds) {
      try {
        const { error } = await supabase.rpc("assign_nurse_to_request", {
          rid: parseInt(id),
          nid: nurseId,
        });

        if (error) {
          console.error("Error assigning nurse:", error);
          hasError = true;
          continue;
        }

        const { data: nurseData, error: nurseError } = await supabase
          .from("profiles")
          .select("id, full_name, phone_number")
          .eq("id", nurseId)
          .single();

        if (nurseError) {
          console.error("Error fetching nurse details:", nurseError);
          continue;
        }

        const nurseToAdd: NurseData = nurseData as NurseData;
        let finalNurseData = nurseToAdd;

        // If it's a quick service, automatically log one hour
        if (request && isQuickService(request.service_type[0])) {
          try {
            await logOneHourForNurse(nurseId, parseInt(id));
            finalNurseData = {
              ...nurseToAdd,
              working_hours: 1,
            };
          } catch (error) {
            console.error("Error logging automatic hour:", error);
            notificationApi.warning({
              message: "Warning",
              description: `Failed to log automatic hour for nurse ${nurseData.full_name}`,
              placement: "topRight",
            });
          }
        }

        setRequest((prev) =>
          prev
            ? {
                ...prev,
                status: "accepted",
                assigned_nurses: [...prev.assigned_nurses, finalNurseData],
              }
            : null
        );
      } catch (error) {
        console.error("Error in nurse assignment:", error);
        hasError = true;
      }
    }

    setAssigningNurse(false);
    setIsAssignNurseModalVisible(false);
    setSelectedNurseIds([]);
    setNurseSearchQuery("");

    if (hasError) {
      notificationApi.warning({
        message: "Warning",
        description: "Some nurses could not be assigned",
        placement: "topRight",
      });
    } else {
      notificationApi.success({
        message: "Success",
        description: "Nurses assigned successfully",
        placement: "topRight",
      });
    }
  };

  const fetchWorkingHoursLogs = async (nurseId: string) => {
    try {
      setLoadingHoursLog(true);
      const { data, error } = await supabase
        .from("nurse_working_hours_log")
        .select("*")
        .eq("request_id", id)
        .eq("nurse_id", nurseId)
        .order("work_date", { ascending: false });

      if (error) throw error;
      setWorkingHoursLogs(data || []);
    } catch (error) {
      console.error("Error fetching working hours logs:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to fetch working hours history",
        placement: "topRight",
      });
    } finally {
      setLoadingHoursLog(false);
    }
  };

  const handleLogHours = async (values: HoursLogFormValues) => {
    if (!id || !selectedNurseForHours) return;

    try {
      // Check if there's already an entry for this date
      const { data: existingLog } = await supabase
        .from("nurse_working_hours_log")
        .select("*")
        .eq("request_id", id)
        .eq("nurse_id", selectedNurseForHours.id)
        .eq("work_date", values.work_date.format("YYYY-MM-DD"))
        .single();

      if (existingLog) {
        notificationApi.error({
          message: "Error",
          description:
            "A working hours log already exists for this nurse on the selected date",
          placement: "topRight",
        });
        return;
      }

      const { error } = await supabase.rpc("add_nurse_working_hours", {
        rid: parseInt(id),
        nid: selectedNurseForHours.id,
        hours: values.hours,
        work_date: values.work_date.format("YYYY-MM-DD"),
        notes: values.notes,
      });

      if (error) throw error;

      notificationApi.success({
        message: "Success",
        description: "Working hours logged successfully",
        placement: "topRight",
      });
      form.resetFields();
      fetchWorkingHoursLogs(selectedNurseForHours.id);

      // Refresh the main request to update total hours
      const { data: requestData } = await supabase
        .from("requests")
        .select(
          `
          id,
          assigned_nurses:request_nurse_assignments(
            nurse:profiles (
              id,
              full_name,
              phone_number
            ),
            working_hours
          )
        `
        )
        .eq("id", id)
        .single();

      if (requestData) {
        setRequest((prev) =>
          prev
            ? {
                ...prev,
                assigned_nurses: (
                  requestData.assigned_nurses as unknown as NurseAssignment[]
                ).map((assignment) => ({
                  id: assignment.nurse.id,
                  full_name: assignment.nurse.full_name,
                  phone_number: assignment.nurse.phone_number,
                  working_hours: assignment.working_hours,
                })),
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error logging working hours:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to log working hours",
        placement: "topRight",
      });
    }
  };

  const handleViewDocument = async () => {
    if (!request?.image_id) return;

    try {
      // Get the public URL for the file
      const { data } = await supabase.storage
        .from("request-images")
        .getPublicUrl(request.image_id);

      if (data?.publicUrl) {
        setDocumentUrl(data.publicUrl);
        // Get file extension
        const fileExt = request.image_id.split(".").pop()?.toLowerCase() || "";
        setDocumentType(fileExt);
        setIsDocumentModalVisible(true);
      }
    } catch (error) {
      console.error("Error getting document URL:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to load the document",
        placement: "topRight",
      });
    }
  };

  const handleDownloadDocument = async () => {
    if (!request?.image_id || !documentUrl) return;

    try {
      const response = await fetch(documentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = request.image_id.split("/").pop() || "document";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading document:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to download the document",
        placement: "topRight",
      });
    }
  };

  const handleRequestAssignment = async () => {
    if (!user?.id || !request) return;

    try {
      setRequestingAssignment(true);

      // Get nurse's full name
      const { data: nurseData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (!nurseData) throw new Error("Could not find nurse data");

      await sendNurseAssignmentRequest(
        request.id.toString(),
        nurseData.full_name,
        request.patient.full_name,
        request.service_type
      );

      // Save to localStorage
      const requestedAssignments = localStorage.getItem("requestedAssignments");
      const requests = requestedAssignments
        ? JSON.parse(requestedAssignments)
        : [];
      requests.push(id);
      localStorage.setItem("requestedAssignments", JSON.stringify(requests));

      // Update local state
      setHasRequestedAssignment(true);

      notificationApi.success({
        message: "Success",
        description: "Assignment request sent successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error requesting assignment:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to send assignment request",
        placement: "topRight",
      });
    } finally {
      setRequestingAssignment(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>
          <Spin size="large" />
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (!request) {
    return (
      <PageContainer>
        <HeaderSection>
          <div className="title-section">
            <Title level={2}>Request Not Found</Title>
            <Text>The requested care request could not be found.</Text>
          </div>
          <div className="actions-section">
            <ActionButton onClick={() => navigate("/")} icon={<HomeOutlined />}>
              Back to Dashboard
            </ActionButton>
          </div>
        </HeaderSection>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <HeaderSection>
        <div className="title-section">
          <Title level={2}>Request Details</Title>
          <Text>View detailed information about this care request</Text>
        </div>
        <div className="actions-section">
          <ActionButton onClick={() => navigate(-1)} icon={<HomeOutlined />}>
            Back
          </ActionButton>
        </div>
      </HeaderSection>

      <StyledCard
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: "easeOut",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.4,
            ease: "easeOut",
          }}
        >
          <Descriptions
            title="Request Information"
            bordered
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            extra={
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6, ease: "easeOut" }}
              >
                {userRole === "superAdmin" &&
                  request.status !== "cancelled" && (
                    <Button
                      type="primary"
                      icon={<UserAddOutlined />}
                      onClick={() => setIsAssignNurseModalVisible(true)}
                      style={{ marginRight: 8 }}
                    >
                      Assign Nurses
                    </Button>
                  )}
                {canApproveRequest && (
                  <Button
                    type="primary"
                    onClick={handleApproveRequest}
                    loading={approvingRequest}
                    icon={<CheckOutlined />}
                  >
                    Approve Request
                  </Button>
                )}
                {canCompleteRequest && (
                  <Button
                    type="primary"
                    onClick={handleCompleteRequest}
                    loading={completingRequest}
                    icon={<CheckOutlined />}
                    style={{
                      marginLeft: 8,
                      marginRight: 8,
                      background: "#52c41a",
                      borderColor: "#52c41a",
                    }}
                  >
                    Complete Request
                  </Button>
                )}
                {canCancelRequest && (
                  <Button
                    danger
                    onClick={handleCancelRequest}
                    loading={cancellingRequest}
                    style={{ marginLeft: 8 }}
                  >
                    Cancel Request
                  </Button>
                )}
                {canRequestAssignment ? (
                  <Button
                    type="primary"
                    onClick={handleRequestAssignment}
                    loading={requestingAssignment}
                    icon={<UserAddOutlined />}
                    style={{ marginLeft: 8 }}
                  >
                    Request Assignment
                  </Button>
                ) : userRole !== "patient" &&
                  userRole !== "superAdmin" &&
                  !isQuickService(request.service_type[0]) &&
                  hasRequestedAssignment ? (
                  <Button
                    disabled
                    icon={<CheckOutlined />}
                    style={{ marginLeft: 8 }}
                  >
                    Request Sent
                  </Button>
                ) : null}
              </motion.div>
            }
          >
            <Descriptions.Item label="Service Types">
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                {request.service_type.map((type, index) => (
                  <Tag key={index} color={getServiceTypeColor(type)}>
                    {serviceTypeLabels[type]}
                  </Tag>
                ))}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusColors[request.status]}>
                {request.status.charAt(0).toUpperCase() +
                  request.status.slice(1)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Patient Name">
              {request.patient.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Contact">
              {userRole === "superAdmin" ||
              isQuickService(request.service_type[0]) ||
              request.assigned_nurses.some((nurse) => nurse.id === user?.id)
                ? request.patient.phone_number
                : "Contact hidden - Only visible to assigned nurses"}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              {areaLabels[request.patient.area as keyof typeof areaLabels] ||
                request.patient.area}{" "}
              - {request.patient.location}
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(request.created_at).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Price" span={2}>
              {editingPrice ? (
                <PriceEditSection>
                  <Input
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    type="number"
                    prefix="$"
                    size="middle"
                  />
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleUpdatePrice}
                    loading={savingPrice}
                    size="middle"
                  >
                    Save
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setEditingPrice(false);
                      setNewPrice(request.price?.toString() || "");
                    }}
                    size="middle"
                  >
                    Cancel
                  </Button>
                </PriceEditSection>
              ) : (
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <Text>
                    {request.price &&
                    (isQuickService(request.service_type[0]) ||
                      (!isQuickService(request.service_type[0]) &&
                        userRole === "superAdmin"))
                      ? `$${request.price.toFixed(2)}`
                      : "Contact for price"}
                  </Text>
                  {canEditPrice && (
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => setEditingPrice(true)}
                      size="middle"
                    >
                      Edit Price
                    </Button>
                  )}
                </div>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Visit Date" span={2}>
              {editingVisitDate ? (
                <PriceEditSection>
                  <DatePicker
                    showTime={{
                      format: "hh",
                      showSecond: false,
                      showMinute: false,
                      use12Hours: true,
                    }}
                    format="YYYY-MM-DD hh A"
                    value={
                      newVisitDate ? dayjs(newVisitDate.split("+")[0]) : null
                    }
                    onChange={(date) => {
                      if (!date) {
                        setNewVisitDate(null);
                        return;
                      }

                      // Get the selected hour and period (AM/PM)
                      const hour = date.format("hh");
                      const period = date.format("A");

                      // Convert to 24-hour format manually
                      let hour24 = parseInt(hour);
                      if (period === "PM" && hour24 !== 12) {
                        hour24 += 12;
                      } else if (period === "AM" && hour24 === 12) {
                        hour24 = 0;
                      }

                      // Format date without timezone
                      const newDate = `${date.format("YYYY-MM-DD")} ${String(
                        hour24
                      ).padStart(2, "0")}:00:00`;
                      setNewVisitDate(newDate);
                    }}
                    size="middle"
                    style={{ width: "200px" }}
                  />
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleUpdateVisitDate}
                    loading={savingVisitDate}
                    size="middle"
                  >
                    Save
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => {
                      setEditingVisitDate(false);
                      setNewVisitDate(
                        request?.visit_date
                          ? request.visit_date.split("+")[0]
                          : null
                      );
                    }}
                    size="middle"
                  >
                    Cancel
                  </Button>
                </PriceEditSection>
              ) : (
                <div
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <Text>
                    {request.visit_date
                      ? (() => {
                          const date = dayjs(request.visit_date.split("+")[0]);
                          const hour24 = parseInt(date.format("HH"));
                          const hour12 = hour24 % 12 || 12;
                          const period = hour24 >= 12 ? "PM" : "AM";
                          return `${date.format(
                            "YYYY-MM-DD"
                          )} ${hour12}:00 ${period}`;
                        })()
                      : "Not set"}
                  </Text>
                  {canEditPrice && (
                    <Button
                      type="link"
                      icon={<EditOutlined />}
                      onClick={() => setEditingVisitDate(true)}
                      size="middle"
                    >
                      Edit Visit Date
                    </Button>
                  )}
                </div>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Details" span={2}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>{request.details}</div>
                {request.image_id && (
                  <ViewDocumentButton
                    type="primary"
                    ghost
                    icon={<FileOutlined />}
                    onClick={handleViewDocument}
                  >
                    View Document
                  </ViewDocumentButton>
                )}
              </div>
            </Descriptions.Item>
            {request.assigned_nurses && request.assigned_nurses.length > 0 && (
              <Descriptions.Item label="Assigned Nurses" span={2}>
                {isQuickService(request.service_type[0]) &&
                  userRole !== "patient" &&
                  (userRole === "superAdmin" ||
                    request.assigned_nurses.some(
                      (nurse) => nurse.id === user?.id
                    )) && (
                    <div
                      style={{
                        marginBottom: "16px",
                        padding: "12px",
                        background: "#fffbe6",
                        border: "1px solid #ffe58f",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Text type="warning">
                        Note: A commission fee of $4 will be deducted from the
                        payment for this quick service request.
                      </Text>
                    </div>
                  )}
                {request.assigned_nurses.map((nurse) => (
                  <div
                    key={nurse.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                      padding: "12px",
                      background: "#f5f5f5",
                      borderRadius: "4px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{nurse.full_name}</div>
                      <div style={{ color: "#666", marginTop: 4 }}>
                        {nurse.phone_number}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <Text type="secondary">Total Hours:</Text>
                        <Text>{nurse.working_hours || 0} hours</Text>
                        {userRole === "superAdmin" && (
                          <Button
                            type="link"
                            icon={<ClockCircleOutlined />}
                            onClick={() => {
                              setSelectedNurseForHours({
                                id: nurse.id,
                                full_name: nurse.full_name,
                              });
                              setIsHoursModalVisible(true);
                              fetchWorkingHoursLogs(nurse.id);
                            }}
                          >
                            Log Hours
                          </Button>
                        )}
                      </div>
                    </div>
                    {userRole === "superAdmin" && (
                      <Button
                        danger
                        size="small"
                        onClick={() => handleRemoveNurse(nurse.id)}
                        style={{ marginLeft: 16 }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        </motion.div>
      </StyledCard>

      <Modal
        title="Assign Nurses"
        open={isAssignNurseModalVisible}
        onCancel={() => {
          setIsAssignNurseModalVisible(false);
          setSelectedNurseIds([]);
          setNurseSearchQuery("");
        }}
        onOk={handleAssignMultipleNurses}
        okText="Assign Selected Nurses"
        okButtonProps={{
          disabled: selectedNurseIds.length === 0,
          loading: assigningNurse,
        }}
        width={600}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search nurses by name or phone number"
          value={nurseSearchQuery}
          onChange={(e) => setNurseSearchQuery(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <List
          dataSource={filteredNurses}
          renderItem={(nurse) => (
            <List.Item
              key={nurse.id}
              onClick={() => {
                setSelectedNurseIds((prev) =>
                  prev.includes(nurse.id)
                    ? prev.filter((id) => id !== nurse.id)
                    : [...prev, nurse.id]
                );
              }}
              style={{
                cursor: "pointer",
                background: selectedNurseIds.includes(nurse.id)
                  ? "#e6f7ff"
                  : "transparent",
                transition: "background-color 0.3s",
                padding: "8px",
                borderRadius: "4px",
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{
                      backgroundColor: selectedNurseIds.includes(nurse.id)
                        ? "#1890ff"
                        : "#d9d9d9",
                    }}
                  >
                    {nurse.full_name.charAt(0)}
                  </Avatar>
                }
                title={nurse.full_name}
                description={
                  <div>
                    <div>{nurse.phone_number}</div>
                    <Tag color="blue">{nurse.role}</Tag>
                  </div>
                }
              />
              <Checkbox
                checked={selectedNurseIds.includes(nurse.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  setSelectedNurseIds((prev) =>
                    e.target.checked
                      ? [...prev, nurse.id]
                      : prev.filter((id) => id !== nurse.id)
                  );
                }}
              />
            </List.Item>
          )}
          style={{ maxHeight: "400px", overflowY: "auto" }}
        />
      </Modal>

      <Modal
        title={`Log Working Hours - ${selectedNurseForHours?.full_name}`}
        open={isHoursModalVisible}
        onCancel={() => {
          setIsHoursModalVisible(false);
          setSelectedNurseForHours(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 24 }}>
          <Form form={form} onFinish={handleLogHours} layout="vertical">
            <Form.Item
              name="work_date"
              label="Work Date"
              rules={[
                { required: true, message: "Please select the work date" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="hours"
              label="Hours Worked"
              rules={[{ required: true, message: "Please enter hours worked" }]}
            >
              <Input type="number" min={0} step={0.5} />
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Log Hours
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div>
          <Title level={5}>Working Hours History</Title>
          <Table
            dataSource={workingHoursLogs}
            rowKey="id"
            loading={loadingHoursLog}
            pagination={false}
            columns={[
              {
                title: "Date",
                dataIndex: "work_date",
                key: "work_date",
                render: (date) => dayjs(date).format("YYYY-MM-DD"),
              },
              {
                title: "Hours",
                dataIndex: "hours",
                key: "hours",
                render: (hours) => `${hours} hours`,
              },
              {
                title: "Notes",
                dataIndex: "notes",
                key: "notes",
                ellipsis: true,
              },
              {
                title: "Logged At",
                dataIndex: "created_at",
                key: "created_at",
                render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
              },
            ]}
            scroll={{ y: 300 }}
          />
        </div>
      </Modal>

      <DocumentModal
        title="Document Preview"
        open={isDocumentModalVisible}
        onCancel={() => setIsDocumentModalVisible(false)}
        footer={null}
        width={1000}
        centered
      >
        <div className="document-container">
          {documentUrl &&
            (["jpg", "jpeg", "png", "gif"].includes(documentType) ? (
              <img
                src={documentUrl}
                alt="Document preview"
                style={{ maxWidth: "100%" }}
              />
            ) : (
              <object
                data={documentUrl}
                type="application/pdf"
                width="100%"
                height="800px"
              >
                <p>Unable to display document. Please download to view.</p>
              </object>
            ))}
        </div>
        <div className="document-actions">
          <Button
            icon={<EyeOutlined />}
            href={documentUrl ? documentUrl : undefined}
            target="_blank"
          >
            Open in New Tab
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownloadDocument}
          >
            Download
          </Button>
        </div>
      </DocumentModal>
    </PageContainer>
  );
}
