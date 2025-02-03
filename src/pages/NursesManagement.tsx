import { useEffect, useState } from "react";
import { Table, Typography, Card, Tag, Button, message } from "antd";
import { motion } from "framer-motion";
import styled from "styled-components";
import supabase from "../utils/supabase";
import { useAuth } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

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
  max-width: 1200px;
  margin: 72px auto 0;
`;

const StyledCard = styled(Card)`
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;

  .ant-card-body {
    padding: 24px;
  }

  .ant-table {
    background: transparent;
  }

  .ant-table-thead > tr > th {
    background: rgba(24, 144, 255, 0.05);
    color: #1a3d7c;
    font-weight: 600;
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
      render: (_: unknown, record: NurseProfile) => (
        <Button
          type="link"
          onClick={() => console.log("View details:", record.id)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <StyledCard>
        <Title level={2} style={{ marginBottom: 24, color: "#1a3d7c" }}>
          Nurses Management
        </Title>
        <Table
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
      </StyledCard>
    </PageContainer>
  );
}
