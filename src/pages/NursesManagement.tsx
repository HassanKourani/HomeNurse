import { useEffect, useState } from "react";
import { Table, Typography, Tag, Button, message, Space, Card } from "antd";
import { motion } from "framer-motion";
import styled from "styled-components";
import supabase from "../utils/supabase";
import { useAuth } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  PlusOutlined,
  HomeOutlined,
  DeleteOutlined,
  EyeOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

type NurseProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role: "registered" | "licensed" | "practitioner";
  created_at: string;
};

const PageContainer = styled(motion.div)`
  padding: 24px;
  max-width: 1400px;
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

const StyledTable = styled(Table<NurseProfile>)`
  .ant-table {
    background: transparent;
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

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileCardView = styled.div`
  display: none;

  @media (max-width: 768px) {
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

  @media (max-width: 576px) {
    flex: 1;
    justify-content: center;
  }
`;

const roleColors = {
  registered: "blue",
  licensed: "green",
  practitioner: "purple",
};

const roleLabels = {
  registered: "Registered Nurse (RN)",
  licensed: "Licensed Practical Nurse (LPN)",
  practitioner: "Nurse Practitioner (NP)",
};

export default function NursesManagement() {
  const [nurses, setNurses] = useState<NurseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is superAdmin
    const checkAccess = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "superAdmin") {
        message.error("You don't have permission to access this page");
        navigate("/");
      }
    };

    checkAccess();
  }, [user, navigate]);

  useEffect(() => {
    const fetchNurses = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone_number, role, created_at")
          .in("role", ["registered", "licensed", "practitioner"])
          .order("created_at", { ascending: false });

        if (error) throw error;
        setNurses(data || []);
      } catch (error) {
        console.error("Error fetching nurses:", error);
        message.error("Failed to fetch nurses data");
      } finally {
        setLoading(false);
      }
    };

    fetchNurses();
  }, []);

  const columns = [
    {
      title: "Name",
      dataIndex: "full_name",
      key: "full_name",
      render: (text: string) => (
        <strong style={{ color: "#1a3d7c" }}>{text}</strong>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
      key: "phone_number",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: keyof typeof roleColors) => (
        <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: undefined, record: NurseProfile) => (
        <Space>
          <Button
            type="link"
            onClick={() => console.log("View details:", record.id)}
          >
            View Details
          </Button>
          <Button
            type="link"
            danger
            onClick={() => console.log("Block:", record.id)}
          >
            Block
          </Button>
        </Space>
      ),
    },
  ];

  const renderMobileCard = (nurse: NurseProfile) => (
    <StyledCard key={nurse.id}>
      <div className="card-header">
        <h3>{nurse.full_name}</h3>
        <Tag color={roleColors[nurse.role]}>{roleLabels[nurse.role]}</Tag>
      </div>
      <div className="card-content">
        <div className="card-item">
          <span className="label">Email</span>
          <span className="value">{nurse.email}</span>
        </div>
        <div className="card-item">
          <span className="label">Phone</span>
          <span className="value">{nurse.phone_number}</span>
        </div>
      </div>
      <div className="card-actions">
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => console.log("View details:", nurse.id)}
        >
          View
        </Button>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => console.log("Block:", nurse.id)}
        >
          Block
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
          <Title level={2}>Nurses Management</Title>
          <Text>
            Manage and monitor all registered healthcare professionals
          </Text>
        </div>
        <div className="actions-section">
          <ActionButton onClick={() => navigate("/")} icon={<HomeOutlined />}>
            Main Page
          </ActionButton>
          <ActionButton
            type="primary"
            onClick={() => navigate("/signup")}
            icon={<PlusOutlined />}
          >
            Add Nurse
          </ActionButton>
        </div>
      </HeaderSection>

      <StyledTable
        columns={columns}
        dataSource={nurses}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} nurses`,
        }}
      />

      <MobileCardView>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
        ) : (
          nurses.map(renderMobileCard)
        )}
      </MobileCardView>
    </PageContainer>
  );
}
