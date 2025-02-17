import { useEffect, useState } from "react";
import {
  Typography,
  Tag,
  Button,
  message,
  Space,
  Select,
  Row,
  Col,
} from "antd";
import supabase from "../utils/supabase";
import { useAuth } from "../utils/AuthContext";
import { useNavigate } from "react-router-dom";
import { PlusOutlined, HomeOutlined, EyeOutlined } from "@ant-design/icons";
import {
  NurseFilters,
  NurseFilterValues,
} from "../components/Filters/NurseFilters";
import {
  NurseProfile,
  ROLE_COLORS,
  ROLE_LABELS,
  calculateNursePayments,
} from "../utils/nurseUtils";
import {
  PageContainer,
  HeaderSection,
  StyledTable,
  MobileCardView,
  StyledCard,
  ActionButton,
} from "./styles/NursesManagement.styles";

const { Title, Text } = Typography;

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
              price,
              payment_type
            )
          )
        `
        )
        .in("role", [
          "registered",
          "physiotherapist",
          "general_doctor",
          "superAdmin",
        ])
        .not("id", "eq", user?.id)
        .not("email", "eq", "hkourani36@gmail.com")
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
      const processedData = (data || []).map((nurse) => {
        const workingHours = nurse.nurse_working_hours_log || [];
        const { amountWeOwe, amountTheyOwe, netAmount } =
          calculateNursePayments(workingHours);

        return {
          ...nurse,
          amountWeOwe,
          amountTheyOwe,
          netAmount,
        };
      });

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

  const handleRoleUpdate = async (nurseId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc("update_nurse_role", {
        updated_role: newRole,
        nurse_id_param: nurseId,
      });

      if (error) throw error;

      message.success("Role updated successfully");
      fetchNurses(); // Refresh the nurses list
    } catch (error) {
      console.error("Error updating nurse role:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to update role"
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
      width: 500,
      render: (role: keyof typeof ROLE_COLORS, record: NurseProfile) => (
        <Row justify="space-between">
          <Col span={8}>
            <Tag color={ROLE_COLORS[role]}>{ROLE_LABELS[role]}</Tag>
          </Col>

          <Col span={16} style={{ textAlign: "right" }}>
            <Select
              defaultValue={role}
              style={{ width: 120 }}
              onChange={(newRole) => handleRoleUpdate(record.id, newRole)}
              onClick={(e) => e.stopPropagation()}
            >
              <Select.Option value="registered">Registered Nurse</Select.Option>
              <Select.Option value="physiotherapist">
                Physiotherapist
              </Select.Option>
              <Select.Option value="general_doctor">
                General Doctor
              </Select.Option>
              <Select.Option value="superAdmin">Super Admin</Select.Option>
            </Select>
          </Col>
        </Row>
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
        <Tag color={ROLE_COLORS[nurse.role]}>{ROLE_LABELS[nurse.role]}</Tag>
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
