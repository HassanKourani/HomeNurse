import { useEffect, useState } from "react";
import { Table, Typography, Tag, Button, message, Space, Card } from "antd";
import { motion } from "framer-motion";
import styled from "styled-components";
import supabase from "../utils/supabase";
import { useAuth } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, HomeOutlined, EyeOutlined } from "@ant-design/icons";
import {
  NurseFilters,
  NurseFilterValues,
} from "../components/Filters/NurseFilters";

const { Title, Text } = Typography;

interface WorkingHoursLog {
  id: number;
  hours: number;
  is_paid: boolean;
  request: {
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
    >;
    price: number;
  };
}

type NurseProfile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role:
    | "registered"
    | "licensed"
    | "practitioner"
    | "nurse"
    | "physiotherapist";
  created_at: string;
  is_approved: boolean;
  is_blocked: boolean;
  amountWeOwe: number;
  amountTheyOwe: number;
  netAmount: number;
  nurse_working_hours_log: WorkingHoursLog[];
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

const StyledTable = styled(Table<NurseProfile>)`
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
  nurse: "orange",
  physiotherapist: "red",
};

const roleLabels = {
  registered: "Registered Nurse (RN)",
  licensed: "Licensed Practical Nurse (LPN)",
  practitioner: "Nurse Practitioner (NP)",
  nurse: "Nurse",
  physiotherapist: "Physiotherapist",
};

export default function NursesManagement() {
  const [nurses, setNurses] = useState<NurseProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NurseFilterValues>({
    name: "",
    email: "",
    phone: "",
    role: "",
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchNurses = async () => {
    try {
      let query = supabase
        .from("profiles")
        .select(
          `
          *,
          nurse_working_hours_log:nurse_working_hours_log (
            id,
            hours,
            is_paid,
            request:requests (
              service_type,
              price
            )
          )
        `
        )
        .in("role", [
          "registered",
          "licensed",
          "practitioner",
          "nurse",
          "physiotherapist",
        ])
        .not("id", "eq", user?.id)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters.name) {
        query = query.ilike("full_name", `%${filters.name}%`);
      }
      if (filters.email) {
        query = query.ilike("email", `%${filters.email}%`);
      }
      if (filters.phone) {
        query = query.ilike("phone_number", `%${filters.phone}%`);
      }
      if (filters.role) {
        query = query.eq("role", filters.role);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process the data to calculate earnings
      const processedData = (data || []).map(
        (
          nurse: Omit<
            NurseProfile,
            "amountWeOwe" | "amountTheyOwe" | "netAmount"
          >
        ) => {
          const workingHours = nurse.nurse_working_hours_log || [];
          let amountWeOwe = 0;
          let amountTheyOwe = 0;

          workingHours.forEach((log: WorkingHoursLog) => {
            if (!log.is_paid && log.request) {
              const isQuickServiceRequest = log.request.service_type.some(
                (type) =>
                  [
                    "blood_test",
                    "im",
                    "iv",
                    "hemo_vs",
                    "patient_care",
                    "other",
                  ].includes(type)
              );

              if (isQuickServiceRequest) {
                // Quick service commission owed to company
                amountTheyOwe += 3.0; // Using the fixed commission rate
              } else if (log.request.price) {
                // Private care payment owed to nurse
                const hourlyRate = log.request.price;
                const nurseShare = hourlyRate * 0.9; // 90% of price
                amountWeOwe += nurseShare * log.hours;
              }
            }
          });

          return {
            ...nurse,
            amountWeOwe,
            amountTheyOwe,
            netAmount: amountWeOwe - amountTheyOwe,
          };
        }
      );

      setNurses(processedData);
    } catch (error) {
      console.error("Error fetching nurses:", error);
      message.error("Failed to fetch nurses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is superAdmin
    const checkAccess = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (profile?.role !== "superAdmin") {
          message.error("You don't have permission to access this page");
          navigate("/");
          return;
        }

        // Fetch nurses after confirming superAdmin access
        await fetchNurses();
      } catch (error) {
        console.error("Error checking access:", error);
        message.error("Error checking permissions");
        navigate("/");
      }
    };

    checkAccess();
  }, [user, navigate, filters]);

  const handleFilterChange = (values: NurseFilterValues) => {
    setFilters(values);
  };

  const handleReset = () => {
    setFilters({
      name: "",
      email: "",
      phone: "",
      role: "",
    });
  };

  const handleApproval = async (nurseId: string, approve: boolean) => {
    try {
      const { data, error } = await supabase.rpc("approve_nurse", {
        nurse_id_param: nurseId,
        should_approve: approve,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message);
      }

      message.success(data.message);

      // Refresh the nurses list
      fetchNurses();
    } catch (error) {
      console.error("Error updating nurse status:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to update nurse status"
      );
    }
  };

  const handleBlockToggle = async (nurse: NurseProfile) => {
    try {
      const { data, error } = await supabase.rpc("toggle_nurse_block", {
        nurse_id_param: nurse.id,
        should_block: !nurse.is_blocked,
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.message);
      }

      message.success(data.message);
      fetchNurses(); // Refresh the nurses list
    } catch (error) {
      console.error("Error toggling nurse block status:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to update block status"
      );
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "full_name",
      key: "full_name",
      width: 250,
      render: (text: string) => (
        <strong style={{ color: "#1a3d7c" }}>{text}</strong>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 300,
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
      key: "phone_number",
      width: 200,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 220,
      render: (role: keyof typeof roleColors) => (
        <Tag color={roleColors[role]}>{roleLabels[role]}</Tag>
      ),
    },
    {
      title: "We Owe",
      dataIndex: "amountWeOwe",
      key: "amountWeOwe",
      width: 200,
      render: (amount: number) => (
        <Text type={amount === 0 ? undefined : "danger"}>
          ${amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: "They Owe",
      dataIndex: "amountTheyOwe",
      key: "amountTheyOwe",
      width: 200,
      render: (amount: number) => (
        <Text type={amount === 0 ? undefined : "success"}>
          ${amount.toFixed(2)}
        </Text>
      ),
    },
    {
      title: "Net Balance",
      dataIndex: "netAmount",
      key: "netAmount",
      width: 250,
      render: (amount: number) => (
        <Text
          type={amount === 0 ? undefined : amount > 0 ? "danger" : "success"}
          strong
        >
          ${Math.abs(amount).toFixed(2)}
          {amount !== 0 && (
            <small style={{ marginLeft: 4 }}>
              {amount > 0 ? "(We Owe)" : "(They Owe)"}
            </small>
          )}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 200,
      render: (_: unknown, record: NurseProfile) => (
        <Space>
          <Tag color={record.is_approved ? "success" : "warning"}>
            {record.is_approved ? "Approved" : "Pending"}
          </Tag>
          {record.is_blocked && <Tag color="error">BLOCKED</Tag>}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: NurseProfile) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/profile/${record.id}`)}
          >
            View Profile
          </Button>
          {!record.is_approved ? (
            <Button
              type="primary"
              size="small"
              onClick={() => handleApproval(record.id, true)}
            >
              Approve
            </Button>
          ) : (
            <Button
              type="primary"
              danger
              size="small"
              onClick={() => handleApproval(record.id, false)}
            >
              Revoke Approval
            </Button>
          )}
          <Button
            type={record.is_blocked ? "default" : "text"}
            danger={!record.is_blocked}
            onClick={() => handleBlockToggle(record)}
            size="small"
          >
            {record.is_blocked ? "Unblock" : "Block"}
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
        <div className="card-item">
          <span className="label">We Owe</span>
          <span className="value">
            <Text type={nurse.amountWeOwe === 0 ? undefined : "danger"}>
              ${nurse.amountWeOwe.toFixed(2)}
            </Text>
          </span>
        </div>
        <div className="card-item">
          <span className="label">They Owe</span>
          <span className="value">
            <Text type={nurse.amountTheyOwe === 0 ? undefined : "success"}>
              ${nurse.amountTheyOwe.toFixed(2)}
            </Text>
          </span>
        </div>
        <div className="card-item">
          <span className="label">Net Balance</span>
          <span className="value">
            <Text
              type={
                nurse.netAmount === 0
                  ? undefined
                  : nurse.netAmount > 0
                  ? "danger"
                  : "success"
              }
              strong
            >
              ${Math.abs(nurse.netAmount).toFixed(2)}
              {nurse.netAmount !== 0 && (
                <small style={{ marginLeft: 4 }}>
                  {nurse.netAmount > 0 ? "(We Owe)" : "(They Owe)"}
                </small>
              )}
            </Text>
          </span>
        </div>
        <div className="card-item">
          <span className="label">Status</span>
          <Space>
            <Tag color={nurse.is_approved ? "success" : "warning"}>
              {nurse.is_approved ? "Approved" : "Pending"}
            </Tag>
            {nurse.is_blocked && <Tag color="error">BLOCKED</Tag>}
          </Space>
        </div>
      </div>
      <div className="card-actions">
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/profile/${nurse.id}`)}
        >
          View
        </Button>
        {!nurse.is_approved ? (
          <Button
            type="primary"
            size="small"
            onClick={() => handleApproval(nurse.id, true)}
          >
            Approve
          </Button>
        ) : (
          <Button
            type="primary"
            danger
            size="small"
            onClick={() => handleApproval(nurse.id, false)}
          >
            Revoke
          </Button>
        )}
        <Button
          type={nurse.is_blocked ? "default" : "text"}
          danger={!nurse.is_blocked}
          onClick={() => handleBlockToggle(nurse)}
          size="small"
        >
          {nurse.is_blocked ? "Unblock" : "Block"}
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

      <NurseFilters
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        initialValues={filters}
      />

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
        scroll={{ x: 1820 }}
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
