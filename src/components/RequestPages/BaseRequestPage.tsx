import { useEffect, useState } from "react";
import { Typography, Tag, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { HomeOutlined, EyeOutlined } from "@ant-design/icons";
import { RequestFilters, FilterValues } from "../Filters/RequestFilters";
import supabase from "../../utils/supabase";
import {
  PageContainer,
  HeaderSection,
  StyledTable,
  MobileCardView,
  StyledCard,
  ActionButton,
} from "./styles";
import { ServiceRequest, statusColors } from "../../types/requests";

const { Title, Text } = Typography;

interface BaseRequestPageProps<T extends string> {
  title: string;
  description: string;
  serviceTypes: Record<T, string>;
  tagColor: string;
  allowedServiceTypes: T[];
  showStatus?: boolean;
  statusOptions?: { value: string; label: string }[];
}

export function BaseRequestPage<T extends string>({
  title,
  description,
  serviceTypes,
  tagColor,
  allowedServiceTypes,
  showStatus = true,
  statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
  ],
}: BaseRequestPageProps<T>) {
  const [requests, setRequests] = useState<ServiceRequest<T>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterValues>({
    patientName: "",
    contact: "",
    area: "",
    status: "",
  });
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("requests")
        .select(
          `
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
        `
        )
        .overlaps("service_type", allowedServiceTypes)
        .in("status", showStatus ? ["pending", "accepted"] : ["pending"])
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.patientName) {
        query = query.ilike("patient.full_name", `%${filters.patientName}%`);
      }
      if (filters.contact) {
        query = query.ilike("patient.phone_number", `%${filters.contact}%`);
      }
      if (filters.area) {
        query = query.eq("patient.area", filters.area);
      }
      if (filters.status && showStatus) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const validData = data.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (item: Partial<ServiceRequest<T> & { patient: any }>) =>
            item.id &&
            Array.isArray(item.service_type) &&
            item.service_type.length > 0 &&
            item.status &&
            item.created_at &&
            item.patient &&
            typeof item.patient === "object" &&
            "full_name" in item.patient &&
            "phone_number" in item.patient &&
            "location" in item.patient &&
            "area" in item.patient
        ) as unknown as ServiceRequest<T>[];

        setRequests(validData);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      message.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

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
      render: (_: unknown, record: ServiceRequest<T>) => (
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
      render: (types: T[]) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {types.map((type, index) => (
            <Tag key={index} color={tagColor}>
              {serviceTypes[type]}
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
      render: (_: unknown, record: ServiceRequest<T>) => (
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

  const renderMobileCard = (request: ServiceRequest<T>) => (
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
            {request.service_type.map((type, index) => (
              <Tag key={index} color={tagColor}>
                {serviceTypes[type]}
              </Tag>
            ))}
          </div>
        </div>
        <div className="card-item">
          <span className="label">Location</span>
          <span className="value">
            {request.patient.area} - {request.patient.location}
          </span>
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
          <Title level={2}>{title}</Title>
          <Text>{description}</Text>
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
        showStatus={showStatus}
        statusOptions={statusOptions}
      />

      <StyledTable<ServiceRequest<T>>
        columns={columns}
        dataSource={requests}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} requests`,
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
