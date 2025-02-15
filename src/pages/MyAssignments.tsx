import { useEffect, useState } from "react";
import { Typography, Tag, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined, EyeOutlined } from "@ant-design/icons";
import {
  RequestFilters,
  FilterValues,
} from "../components/Filters/RequestFilters";
import supabase from "../utils/supabase";
import {
  PageContainer,
  HeaderSection,
  StyledTable,
  MobileCardView,
  StyledCard,
  ActionButton,
} from "../components/RequestPages/styles";
import { DatabaseResponse, statusColors, ServiceType } from "../types/requests";
import { useAuth } from "../utils/AuthContext";
import { useNotification } from "../utils/NotificationProvider";

const { Title, Text } = Typography;

// Add type for raw data from Supabase
type RawAssignmentData = {
  request: {
    id: string;
    service_type: ServiceType[];
    details: string;
    status: DatabaseResponse["status"];
    created_at: string;
    patient: DatabaseResponse["patient"];
  };
  working_hours: number;
};

const serviceTypeLabels: Record<ServiceType, string> = {
  blood_test: "Blood Test",
  im: "Intramuscular Injection",
  iv: "Intravenous Therapy",
  patient_care: "Patient Care",
  hemo_vs: "Hemodynamic/Vital Signs",
  other: "Other Services",
  physiotherapy: "Physiotherapy",
  full_time_private_normal: "Full Time Regular Care",
  part_time_private_normal: "Part Time Regular Care",
  full_time_private_psychiatric: "Full Time Psychiatric Care",
  part_time_private_psychiatric: "Part Time Psychiatric Care",
  medical_equipment: "Medical Equipment",
  general_doctor: "General Doctor",
};

const getServiceTypeColor = (type: ServiceType): string => {
  if (type.includes("psychiatric")) return "purple";
  if (type.includes("private_normal")) return "blue";
  return "cyan";
};

export default function MyAssignments() {
  const [requests, setRequests] = useState<DatabaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({
    patientName: "",
    contact: "",
    area: "",
    status: "",
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const notification = useNotification();

  const fetchRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      let query = supabase
        .from("request_nurse_assignments")
        .select(
          `
          working_hours,
          request:requests (
            id,
            service_type,
            details,
            status,
            created_at,
            patient:profiles!fk_patient (
              full_name,
              phone_number,
              location,
              area
            )
          )
        `
        )
        .eq("nurse_id", user.id)
        .order("request(created_at)", { ascending: false });

      // Apply filters
      if (filters.patientName) {
        query = query.ilike(
          "request.patient.full_name",
          `%${filters.patientName}%`
        );
      }
      if (filters.contact) {
        query = query.ilike(
          "request.patient.phone_number",
          `%${filters.contact}%`
        );
      }
      if (filters.area) {
        query = query.eq("request.patient.area", filters.area);
      }
      if (filters.status) {
        query = query.eq("request.status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const validData = (data as unknown as RawAssignmentData[])
          .filter((item) => {
            if (!item?.request) return false;
            const request = item.request;
            return (
              request &&
              typeof request === "object" &&
              "id" in request &&
              "service_type" in request &&
              "details" in request &&
              "status" in request &&
              "created_at" in request &&
              "patient" in request &&
              request.patient &&
              typeof request.patient === "object" &&
              "full_name" in request.patient &&
              "phone_number" in request.patient &&
              "location" in request.patient &&
              "area" in request.patient
            );
          })
          .map((item) => ({
            id: item.request.id,
            service_type: item.request.service_type,
            details: item.request.details,
            status: item.request.status,
            created_at: item.request.created_at,
            patient: item.request.patient,
            working_hours: item.working_hours || 0,
          })) as DatabaseResponse[];

        setRequests(validData);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch requests",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters, user?.id]);

  const handleFilterChange = (values: FilterValues) => {
    setFilters(values);
  };

  const handleReset = () => {
    setFilters({
      patientName: "",
      contact: "",
      area: "",
      status: "",
    });
  };

  const columns = [
    {
      title: "Patient Name",
      dataIndex: ["patient", "full_name"],
      key: "patient_name",
      render: (text: string) => (
        <strong style={{ color: "#1a3d7c" }}>{text}</strong>
      ),
      width: 200,
    },
    {
      title: "Location",
      key: "location",
      render: (_: unknown, record: DatabaseResponse) => (
        <span>
          {record.patient?.area} - {record.patient?.location}
        </span>
      ),
      width: 250,
    },
    {
      title: "Service Types",
      dataIndex: "service_type",
      key: "service_type",
      render: (types: ServiceType[]) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {types.map((type, index) => (
            <Tag key={index} color={getServiceTypeColor(type)}>
              {serviceTypeLabels[type]}
            </Tag>
          ))}
        </div>
      ),
      width: 200,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
      width: 120,
    },
    {
      title: "Working Hours",
      dataIndex: "working_hours",
      key: "working_hours",
      render: (hours: number) => <Text strong>{hours || 0} hours</Text>,
      width: 150,
    },
    {
      title: "Details",
      dataIndex: "details",
      key: "details",
      ellipsis: true,
      className: "details-column",
      width: 300,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: undefined, record: DatabaseResponse) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/request/${record.id}`)}
        >
          View Details
        </Button>
      ),
      width: 150,
    },
  ];

  const renderMobileCard = (request: DatabaseResponse) => (
    <StyledCard key={request.id}>
      <div className="card-header">
        <h3>{request.patient.full_name}</h3>
        <Tag color={statusColors[request.status]}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </Tag>
      </div>
      <div className="card-content">
        <div className="card-item">
          <span className="label">Service Types</span>
          <div
            className="value"
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {request.service_type.map((type: ServiceType, index: number) => (
              <Tag key={index} color={getServiceTypeColor(type)}>
                {serviceTypeLabels[type]}
              </Tag>
            ))}
          </div>
        </div>
        <div className="card-item">
          <span className="label">Contact</span>
          <span className="value">{request.patient.phone_number}</span>
        </div>
        <div className="card-item">
          <span className="label">Location</span>
          <span className="value">
            {request.patient.area} - {request.patient.location}
          </span>
        </div>
        <div className="card-item">
          <span className="label">Working Hours</span>
          <span className="value">{request.working_hours || 0} hours</span>
        </div>
        <div className="card-item">
          <span className="label">Details</span>
          <span
            className="value"
            style={{ maxWidth: "60%", textAlign: "right" }}
          >
            {request.details}
          </span>
        </div>
      </div>
      <div className="card-actions">
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/request/${request.id}`)}
        >
          View Details
        </Button>
      </div>
    </StyledCard>
  );

  return (
    <PageContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <HeaderSection>
        <div className="title-section">
          <Title level={2}>My Assignments</Title>
          <Text>View and manage your assigned care requests</Text>
        </div>
        <div className="actions-section">
          <ActionButton onClick={() => navigate("/")} icon={<HomeOutlined />}>
            Back to Dashboard
          </ActionButton>
        </div>
      </HeaderSection>

      <RequestFilters
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        initialValues={filters}
        statusOptions={[
          { value: "pending", label: "Pending" },
          { value: "accepted", label: "Accepted" },
          { value: "completed", label: "Completed" },
          { value: "cancelled", label: "Cancelled" },
        ]}
      />

      <StyledTable
        columns={columns}
        dataSource={requests}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} assignments`,
        }}
      />

      <MobileCardView>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
        ) : (
          requests.map(renderMobileCard)
        )}
      </MobileCardView>
    </PageContainer>
  );
}
