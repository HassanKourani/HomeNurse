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
} from "@ant-design/icons";
import { useAuth } from "../utils/AuthContext";
import dayjs from "dayjs";
import { useNotification } from "../utils/NotificationProvider";

const { Title, Text } = Typography;

type RequestDetails = {
  id: string;
  service_type:
    | "blood_test"
    | "im"
    | "iv"
    | "patient_care"
    | "hemo_vs"
    | "other"
    | "full_time_private_normal"
    | "part_time_private_normal"
    | "full_time_private_psychiatric"
    | "part_time_private_psychiatric";
  details: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  price: number | null;
  visit_date: string | null;
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
      if (!id) return;

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
            patient:profiles!fk_patient (
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
  }, [id, navigate, notificationApi]);

  useEffect(() => {
    const fetchAvailableNurses = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, phone_number, role")
          .in("role", ["registered", "licensed", "practitioner"])
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

      // Update local state
      setRequest((prev) =>
        prev
          ? {
              ...prev,
              status: "accepted",
              assigned_nurses: [...(prev.assigned_nurses || []), nurseData],
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
    if (!id) return;

    try {
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
        description: "Nurse removed successfully",
        placement: "topRight",
      });
    } catch (error) {
      console.error("Error removing nurse:", error);
      notificationApi.error({
        message: "Error",
        description: "Failed to remove nurse",
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

  const canEditPrice =
    userRole === "superAdmin" ||
    (userRole !== "patient" &&
      request?.assigned_nurses.some((nurse) => nurse.id === user?.id));

  const canApproveRequest =
    userRole &&
    userRole !== "patient" &&
    !request?.assigned_nurses.length &&
    request?.status === "pending";

  const canCancelRequest =
    request?.status === "accepted" && userRole === "superAdmin";

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

        setRequest((prev) =>
          prev
            ? {
                ...prev,
                status: "accepted",
                assigned_nurses: [...prev.assigned_nurses, nurseData],
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
                transition={{
                  duration: 0.5,
                  delay: 0.6,
                  ease: "easeOut",
                }}
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
              </motion.div>
            }
          >
            <Descriptions.Item label="Service Type">
              <Tag color={getServiceTypeColor(request.service_type)}>
                {serviceTypeLabels[request.service_type]}
              </Tag>
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
              {request.patient.phone_number}
            </Descriptions.Item>
            <Descriptions.Item label="Location">
              {request.patient.area} - {request.patient.location}
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
                    {request.price ? `$${request.price.toFixed(2)}` : "Not set"}
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
              {request.details}
            </Descriptions.Item>
            {request.assigned_nurses && request.assigned_nurses.length > 0 && (
              <Descriptions.Item label="Assigned Nurses" span={2}>
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
                    {(userRole === "superAdmin" ||
                      (userRole !== "patient" && nurse.id === user?.id)) && (
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
    </PageContainer>
  );
}
