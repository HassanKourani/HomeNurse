import { useEffect, useState } from "react";
import { Table, Typography, Tag, Button, message, Card } from "antd";
import { motion } from "framer-motion";
import styled from "styled-components";
import supabase from "../utils/supabase";
import { useNavigate } from "react-router-dom";
import { HomeOutlined, EyeOutlined } from "@ant-design/icons";
import {
  RequestFilters,
  FilterValues,
} from "../components/Filters/RequestFilters";

const { Title, Text } = Typography;

type DatabaseResponse = {
  id: string;
  service_type: Array<
    "full_time_private_psychiatric" | "part_time_private_psychiatric"
  >;
  details: string;
  status: "pending" | "accepted" | "completed" | "cancelled";
  created_at: string;
  patient: {
    full_name: string;
    phone_number: string;
    location: string;
    area: string;
  };
};

interface RawResponse {
  id: string;
  service_type: DatabaseResponse["service_type"];
  details: string;
  status: DatabaseResponse["status"];
  created_at: string;
  patient: {
    full_name: string;
    phone_number: string;
    location: string;
    area: string;
  };
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

const StyledTable = styled(Table<DatabaseResponse>)`
  .ant-table {
    background: transparent;
    overflow-x: auto;
  }

  .ant-table-wrapper {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ant-table-thead > tr > th {
    background: rgba(24, 144, 255, 0.05);
    color: #1a3d7c;
    font-weight: 600;
    border-bottom: 2px solid #f0f0f0;
    padding: 16px;
    white-space: nowrap;
  }

  .ant-table-tbody > tr > td {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-table-tbody > tr:hover > td {
    background: rgba(24, 144, 255, 0.02);
  }

  .ant-pagination {
    margin: 16px 0;
  }

  @media (max-width: 1024px) {
    td {
      white-space: nowrap;

      &.details-column {
        max-width: 200px;
        white-space: normal;
      }
    }
  }

  @media (max-width: 576px) {
    display: none;
  }
`;

const MobileCardView = styled.div`
  display: none;

  @media (max-width: 576px) {
    display: block;
  }
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      color: #1a3d7c;
      font-weight: 600;
    }
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: #666;
      font-size: 14px;
    }

    .value {
      color: #1a3d7c;
      font-weight: 500;
    }
  }

  .card-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
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

const serviceTypeLabels = {
  full_time_private_psychiatric: "Full Time Psychiatric Care",
  part_time_private_psychiatric: "Part Time Psychiatric Care",
};

const statusColors = {
  pending: "gold",
  accepted: "blue",
  completed: "green",
  cancelled: "red",
};

export default function PsychiatricCareRequests() {
  const [requests, setRequests] = useState<DatabaseResponse[]>([]);
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
        .overlaps("service_type", [
          "full_time_private_psychiatric",
          "part_time_private_psychiatric",
        ])
        .in("status", ["pending", "accepted"])
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
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const validData = (data as unknown as RawResponse[]).filter(
          (item) =>
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
        ) as DatabaseResponse[];

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
      render: (types: DatabaseResponse["service_type"]) => (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {types.map((type, index) => (
            <Tag key={index} color="purple">
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
            {request.service_type.map((type, index) => (
              <Tag key={index} color="purple">
                {serviceTypeLabels[type]}
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
          <Title level={2}>Psychiatric Care Requests</Title>
          <Text>
            View and manage full-time and part-time psychiatric care requests
          </Text>
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
