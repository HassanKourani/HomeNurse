import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Tag,
  Button,
  message,
  Descriptions,
  Input,
  Spin,
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
} from "@ant-design/icons";
import { useAuth } from "../utils/AuthContext";

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
  patient: {
    full_name: string;
    phone_number: string;
    location: string;
    area: string;
  };
  assigned_nurse?: {
    full_name: string;
    phone_number: string;
  } | null;
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

const StyledCard = styled(Card)`
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
  const [newPrice, setNewPrice] = useState<string>("");
  const [savingPrice, setSavingPrice] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

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
        const { data, error } = await supabase
          .from("requests")
          .select(
            `
            id,
            service_type,
            details,
            status,
            created_at,
            price,
            assigned_nurse_id,
            patient:profiles!fk_patient (
              full_name,
              phone_number,
              location,
              area
            ),
            assigned_nurse:profiles!assigned_nurse_id (
              full_name,
              phone_number
            )
          `
          )
          .eq("id", parseInt(id))
          .single();

        if (error) throw error;

        if (data) {
          const transformedData = {
            ...data,
            patient: data.patient,
            assigned_nurse:
              data.assigned_nurse && data.assigned_nurse.length > 0
                ? {
                    full_name: data.assigned_nurse[0].full_name,
                    phone_number: data.assigned_nurse[0].phone_number,
                  }
                : null,
          } as unknown as RequestDetails;

          setRequest(transformedData);
          setNewPrice(data.price?.toString() || "");
        }
      } catch (error) {
        console.error("Error fetching request details:", error);
        message.error("Failed to fetch request details");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id, navigate]);

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
        message.error("Failed to update price");
        return;
      }

      // If successful, update the local state
      setRequest((prev) =>
        prev ? { ...prev, price: parseFloat(newPrice) } : null
      );
      setEditingPrice(false);
      message.success("Price updated successfully");
    } catch (error) {
      console.error("Error updating price:", error);
      message.error("Failed to update price");
    } finally {
      setSavingPrice(false);
    }
  };

  const canEditPrice = userRole === "nurse" || userRole === "superAdmin";

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

      <StyledCard>
        <Descriptions
          title="Request Information"
          bordered
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
        >
          <Descriptions.Item label="Service Type">
            <Tag color={getServiceTypeColor(request.service_type)}>
              {serviceTypeLabels[request.service_type]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[request.status]}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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
          <Descriptions.Item label="Details" span={2}>
            {request.details}
          </Descriptions.Item>
          {request.assigned_nurse && (
            <>
              <Descriptions.Item label="Assigned Nurse">
                {request.assigned_nurse.full_name}
              </Descriptions.Item>
              <Descriptions.Item label="Nurse Contact">
                {request.assigned_nurse.phone_number}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </StyledCard>
    </PageContainer>
  );
}
