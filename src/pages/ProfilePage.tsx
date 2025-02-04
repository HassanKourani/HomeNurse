import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Tabs,
  Avatar,
  Spin,
  Button,
  message,
  Modal,
} from "antd";
import { motion } from "framer-motion";
import styled from "styled-components";
import {
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  ArrowLeftOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useAuth } from "../utils/AuthContext";
import supabase from "../utils/supabase";
import dayjs from "dayjs";
import { useNavigate, useParams, Navigate } from "react-router-dom";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

// Constants for service rates
const SERVICE_RATES = {
  normal_private: 3.75, // per hour
  psychiatric: 4.0, // per hour
  quick_service: 3.0, // per service
};

// Quick service types list - exact matches from database
const QUICK_SERVICE_TYPES = [
  "blood_test",
  "im",
  "iv",
  "hemo_vs",
  "patient_care",
  "other",
];

// Service type categories for classification
const isQuickService = (type: string): boolean => {
  console.log("Checking if quick service:", type);
  // List of known quick service types
  const quickServices = [
    "blood_test",
    "im",
    "iv",
    "hemo_vs",
    "patient_care",
    "other",
  ];
  const isQuick = quickServices.includes(type);
  console.log("Is it in quick services list?", isQuick);
  return isQuick;
};

interface WorkingHoursLog {
  id: number;
  request_id: number;
  hours: number;
  work_date: string;
  notes: string;
  created_at: string;
  is_paid: boolean;
  request: {
    service_type: string;
  };
}

interface ProfileStats {
  totalHours: number;
  totalEarnings: number;
  serviceTypeStats: {
    [key: string]: {
      hours: number;
      earnings: number;
      count: number;
    };
  };
}

interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  role: string;
  created_at: string;
}

// Add this interface for request data
interface NurseRequest {
  id: number;
  service_type: string;
  details: string;
  status: string;
  created_at: string;
  patient: {
    full_name: string;
    phone_number: string;
    location: string;
  };
}

const PageContainer = styled(motion.div)`
  padding: 16px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  min-height: 100vh;
  position: relative;
  padding-top: 24px;

  @media (min-width: 768px) {
    padding: 24px;
    padding-top: 72px;
  }
`;

const BackButton = styled(Button)`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid #e6e6e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: white;
    border-color: #1890ff;
  }

  @media (min-width: 768px) {
    top: 24px;
    left: 24px;
  }
`;

const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;

  .ant-card-head {
    border-bottom: none;
    padding-bottom: 0;
  }

  .ant-card-body {
    padding: 24px;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  @media (min-width: 768px) {
    flex-direction: row;
    gap: 24px;
    padding: 24px;
    margin-bottom: 32px;
  }

  .profile-info {
    flex: 1;
    text-align: center;

    @media (min-width: 768px) {
      text-align: left;
    }
  }

  .profile-details {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;

    @media (min-width: 768px) {
      flex-direction: row;
      gap: 24px;
    }
  }
`;

const StatisticCard = styled(StyledCard)`
  .ant-statistic-title {
    color: #666;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .ant-statistic-content {
    color: #1a3d7c;
    font-size: 24px;
  }
`;

const ResponsiveTableCard = styled(StyledCard)`
  .ant-table-wrapper {
    overflow: hidden;

    .ant-table {
      min-width: 600px;
    }
  }
`;

export default function ProfilePage() {
  const { user } = useAuth();
  const { nurseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHoursLog[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    totalHours: 0,
    totalEarnings: 0,
    serviceTypeStats: {},
  });
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [nurseRequests, setNurseRequests] = useState<NurseRequest[]>([]);

  // Define fetchProfileData first
  const fetchProfileData = async () => {
    if (!nurseId || authorized !== true) return;

    try {
      // Fetch profile details
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", nurseId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch requests assigned to this nurse
      const { data: requestsData, error: requestsError } = await supabase
        .from("request_nurse_assignments")
        .select(
          `
          request:requests (
            id,
            service_type,
            details,
            status,
            created_at,
            patient:profiles!fk_patient (
              full_name,
              phone_number,
              location
            )
          )
        `
        )
        .eq("nurse_id", nurseId)
        .order("request(created_at)", { ascending: false });

      if (requestsError) throw requestsError;

      // Transform the data to match our interface
      const transformedRequests = (requestsData || [])
        .map((item) => {
          const request = item.request as unknown as NurseRequest;
          if (!request) return null;
          return {
            id: request.id,
            service_type: request.service_type,
            details: request.details,
            status: request.status,
            created_at: request.created_at,
            patient: {
              full_name: request.patient.full_name,
              phone_number: request.patient.phone_number,
              location: request.patient.location,
            },
          };
        })
        .filter((item): item is NurseRequest => item !== null);

      setNurseRequests(transformedRequests);

      // Fetch working hours with request details
      const { data: hoursData, error: hoursError } = await supabase
        .from("nurse_working_hours_log")
        .select(
          `
            id,
            request_id,
            hours,
            work_date,
            notes,
            created_at,
            is_paid,
            request:requests (
              service_type
            )
          `
        )
        .eq("nurse_id", nurseId)
        .order("work_date", { ascending: false });

      if (hoursError) throw hoursError;

      // Double type assertion to safely convert the response
      const typedHoursData = (hoursData || []) as unknown as WorkingHoursLog[];
      setWorkingHours(typedHoursData);

      // Calculate statistics for unpaid services only
      const statistics: ProfileStats = {
        totalHours: 0,
        totalEarnings: 0,
        serviceTypeStats: {},
      };

      // Process only unpaid services from working hours
      typedHoursData
        .filter((log) => !log.is_paid) // Only process unpaid services
        .forEach((log) => {
          const serviceType = log.request.service_type;

          if (!statistics.serviceTypeStats[serviceType]) {
            statistics.serviceTypeStats[serviceType] = {
              hours: 0,
              earnings: 0,
              count: 0,
            };
          }

          statistics.serviceTypeStats[serviceType].count += 1;

          // Calculate earnings based on service type
          let earnings = 0;
          if (isQuickService(serviceType)) {
            // Quick services are charged per service
            earnings = SERVICE_RATES.quick_service;
          } else if (serviceType.includes("psychiatric")) {
            // Psychiatric services are charged per hour
            earnings = log.hours * SERVICE_RATES.psychiatric;
            statistics.serviceTypeStats[serviceType].hours += log.hours;
            statistics.totalHours += log.hours;
          } else if (serviceType.includes("private")) {
            // Normal private services are charged per hour
            earnings = log.hours * SERVICE_RATES.normal_private;
            statistics.serviceTypeStats[serviceType].hours += log.hours;
            statistics.totalHours += log.hours;
          }

          statistics.serviceTypeStats[serviceType].earnings += earnings;
          statistics.totalEarnings += earnings;
        });

      console.log("Final unpaid statistics:", statistics);
      setStats(statistics);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      message.error("Error loading profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check authorization
    const checkAuthorization = async () => {
      console.log("Checking authorization...");
      console.log("Current user:", user);
      console.log("Nurse ID from params:", nurseId);

      if (!user) {
        console.log("No user found, not authorized");
        setAuthorized(false);
        setLoading(false);
        return;
      }

      try {
        // Get the current user's profile to check role
        const { data: currentUserProfile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        console.log("Current user profile:", currentUserProfile);
        console.log("Profile error:", profileError);

        if (profileError) throw profileError;

        // User is authorized if they are superAdmin or if they're viewing their own profile
        const isSuperAdmin = currentUserProfile?.role === "superAdmin";
        setIsSuperAdmin(isSuperAdmin);
        const isOwnProfile = user.id === nurseId;

        console.log("Is super admin?", isSuperAdmin);
        console.log("Is own profile?", isOwnProfile);
        console.log("User role:", currentUserProfile?.role);

        if (isSuperAdmin || isOwnProfile) {
          console.log("User is authorized");
          setAuthorized(true);
        } else {
          console.log("User is not authorized");
          setAuthorized(false);
          message.error("You are not authorized to view this profile");
        }
      } catch (error) {
        console.error("Error checking authorization:", error);
        setAuthorized(false);
        message.error("Error checking authorization");
      }
    };

    checkAuthorization();
  }, [user, nurseId]);

  useEffect(() => {
    if (authorized === true) {
      fetchProfileData();
    }
  }, [nurseId, authorized]);

  // Add debug output for quick service stats
  useEffect(() => {
    const quickServiceStats = Object.entries(stats.serviceTypeStats).filter(
      ([type]) => QUICK_SERVICE_TYPES.includes(type)
    );
    console.log("Quick service stats:", quickServiceStats);
  }, [stats]);

  const handlePayment = () => {
    console.log("Payment button clicked");
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      // Show loading message
      const loadingMessage = message.loading("Processing payment...", 0);

      // Call the Supabase function to process payment
      const { error } = await supabase.rpc("process_nurse_payment", {
        nurse_id_param: nurseId,
      });

      // Clear loading message
      loadingMessage();

      if (error) {
        throw error;
      }

      // Show success message
      message.success(
        `Successfully processed payment for ${profile?.full_name}`
      );

      // Refresh the profile data to update statistics
      fetchProfileData();

      // Close modal
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      message.error("Failed to process payment. Please try again.");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const handleSinglePayment = async (logId: number) => {
    try {
      const loadingMessage = message.loading("Processing payment...", 0);

      // Call the Supabase function to process payment for single entry
      const { error } = await supabase.rpc("process_single_payment", {
        log_id_param: logId,
      });

      loadingMessage();

      if (error) {
        throw error;
      }

      message.success("Successfully processed payment for this entry");
      fetchProfileData(); // Refresh the data
    } catch (error) {
      console.error("Error processing single payment:", error);
      message.error("Failed to process payment. Please try again.");
    }
  };

  const handleDeleteClick = (logId: number) => {
    setSelectedLogId(logId);
    setIsDeleteModalVisible(true);
  };

  const handleDeleteModalOk = async () => {
    if (!selectedLogId) return;

    try {
      const { error } = await supabase.rpc("delete_working_hours_log", {
        log_id_param: selectedLogId,
      });

      if (error) {
        console.error("Delete error:", error);
        throw error;
      }

      message.success("Working hours record deleted successfully");
      await fetchProfileData(); // Wait for the data to refresh
      setIsDeleteModalVisible(false);
      setSelectedLogId(null);
    } catch (error) {
      console.error("Error deleting working hours:", error);
      message.error("Failed to delete working hours record");
    }
  };

  const handleDeleteModalCancel = () => {
    setIsDeleteModalVisible(false);
    setSelectedLogId(null);
  };

  // Show loading state while checking authorization
  if (authorized === null || loading) {
    return (
      <PageContainer>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  // Only redirect if we're sure the user is not authorized
  if (authorized === false) {
    console.log("Not authorized, redirecting to home");
    return <Navigate to="/" replace />;
  }

  return (
    <PageContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Modal
        title="Confirm Payment Processing"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="Process Payment"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            background: "linear-gradient(120deg, #1890ff, #096dd9)",
            border: "none",
          },
        }}
      >
        <p>
          Are you sure you want to process payment for {profile?.full_name}?
          This will mark all unpaid working hours as paid.
        </p>
      </Modal>

      <Modal
        title="Delete Working Hours Record"
        open={isDeleteModalVisible}
        onOk={handleDeleteModalOk}
        onCancel={handleDeleteModalCancel}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
        }}
      >
        <p>
          Are you sure you want to delete this working hours record? This action
          cannot be undone.
        </p>
      </Modal>

      <BackButton icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        Back
      </BackButton>

      <ProfileHeader>
        <Avatar size={96} icon={<UserOutlined />} />
        <div className="profile-info">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              justifyContent: "center",
            }}
          >
            <Title level={2} className="profile-title" style={{ margin: 0 }}>
              {profile?.full_name}
            </Title>
            {isSuperAdmin && user?.id !== nurseId && (
              <Button
                type="primary"
                onClick={handlePayment}
                style={{
                  background: "linear-gradient(120deg, #1890ff, #096dd9)",
                  border: "none",
                  boxShadow: "0 2px 8px rgba(24, 144, 255, 0.25)",
                  height: "40px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                icon={<DollarOutlined />}
              >
                Process Payment
              </Button>
            )}
          </div>
          <Text className="profile-subtitle">
            <Tag color="blue">{profile?.role}</Tag>
          </Text>
          <div className="profile-details">
            <span className="detail-item">
              <PhoneOutlined /> {profile?.phone_number}
            </span>
            <span className="detail-item">
              <MailOutlined /> {user?.email}
            </span>
            <span className="detail-item">
              <CalendarOutlined /> Joined{" "}
              {dayjs(profile?.created_at).format("MMMM YYYY")}
            </span>
          </div>
        </div>
      </ProfileHeader>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard>
            <Statistic
              title="Total Working Hours"
              value={stats.totalHours}
              suffix="hrs"
              prefix={<ClockCircleOutlined />}
            />
          </StatisticCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard>
            <Statistic
              title="Total Services"
              value={workingHours.length}
              prefix={<UserOutlined />}
            />
          </StatisticCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard>
            <Statistic
              title="Average Hours per Service"
              value={(stats.totalHours / (workingHours.length || 1)).toFixed(1)}
              suffix="hrs"
            />
          </StatisticCard>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatisticCard>
            <Statistic
              title="Total Earnings"
              value={stats.totalEarnings.toFixed(2)}
              prefix={<DollarOutlined />}
            />
          </StatisticCard>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={8}>
          <StatisticCard>
            <Statistic
              title="Normal Private Care Earnings"
              value={Object.entries(stats.serviceTypeStats)
                .filter(
                  ([type]) =>
                    type.includes("private") && !type.includes("psychiatric")
                )
                .reduce((sum, [, data]) => sum + data.earnings, 0)
                .toFixed(2)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              Rate: ${SERVICE_RATES.normal_private}/hour
            </div>
          </StatisticCard>
        </Col>
        <Col xs={24} md={8}>
          <StatisticCard>
            <Statistic
              title="Psychiatric Care Earnings"
              value={Object.entries(stats.serviceTypeStats)
                .filter(([type]) => type.includes("psychiatric"))
                .reduce((sum, [, data]) => sum + data.earnings, 0)
                .toFixed(2)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              Rate: ${SERVICE_RATES.psychiatric}/hour
            </div>
          </StatisticCard>
        </Col>
        <Col xs={24} md={8}>
          <StatisticCard>
            <Statistic
              title="Quick Service Earnings"
              value={Object.entries(stats.serviceTypeStats)
                .filter(([type]) => isQuickService(type))
                .reduce((sum, [, data]) => sum + data.earnings, 0)
                .toFixed(2)}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              Rate: ${SERVICE_RATES.quick_service} per service
            </div>
          </StatisticCard>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" style={{ marginTop: 24 }}>
        <TabPane tab="Assigned Requests" key="1">
          <ResponsiveTableCard>
            <Table
              dataSource={nurseRequests}
              columns={[
                {
                  title: "Service Type",
                  dataIndex: "service_type",
                  key: "service_type",
                  render: (type: string) => (
                    <Tag
                      color={
                        QUICK_SERVICE_TYPES.includes(type)
                          ? "blue"
                          : type.includes("psychiatric")
                          ? "purple"
                          : "green"
                      }
                    >
                      {type.replace(/_/g, " ").toUpperCase()}
                    </Tag>
                  ),
                  width: 200,
                },
                {
                  title: "Patient",
                  dataIndex: ["patient", "full_name"],
                  key: "patient_name",
                  width: 200,
                },
                {
                  title: "Contact",
                  dataIndex: ["patient", "phone_number"],
                  key: "patient_contact",
                  width: 150,
                },
                {
                  title: "Location",
                  dataIndex: ["patient", "location"],
                  key: "location",
                  width: 200,
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (status: string) => (
                    <Tag
                      color={
                        status === "completed"
                          ? "success"
                          : status === "accepted"
                          ? "processing"
                          : status === "cancelled"
                          ? "error"
                          : "warning"
                      }
                    >
                      {status.toUpperCase()}
                    </Tag>
                  ),
                  width: 120,
                },
                {
                  title: "Created At",
                  dataIndex: "created_at",
                  key: "created_at",
                  render: (date: string) =>
                    dayjs(date).format("YYYY-MM-DD HH:mm"),
                  width: 150,
                },
                {
                  title: "Details",
                  dataIndex: "details",
                  key: "details",
                  ellipsis: true,
                  width: 300,
                },
                {
                  title: "Actions",
                  key: "actions",
                  width: 100,
                  render: (_, record) => (
                    <Button
                      type="link"
                      onClick={() => navigate(`/request/${record.id}`)}
                    >
                      View Details
                    </Button>
                  ),
                },
              ]}
              scroll={{ x: "max-content" }}
              pagination={{ pageSize: 10 }}
            />
          </ResponsiveTableCard>
        </TabPane>

        <TabPane tab="Working Hours History" key="2">
          <ResponsiveTableCard>
            <Table
              dataSource={workingHours}
              columns={[
                {
                  title: "Date",
                  dataIndex: "work_date",
                  key: "work_date",
                  render: (date) => dayjs(date).format("YYYY-MM-DD"),
                  width: 120,
                  fixed: "left",
                },
                {
                  title: "Service Type",
                  dataIndex: ["request", "service_type"],
                  key: "service_type",
                  render: (type) => (
                    <Tag
                      color={
                        QUICK_SERVICE_TYPES.includes(type)
                          ? "blue"
                          : type.includes("psychiatric")
                          ? "purple"
                          : "green"
                      }
                      style={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {type.replace(/_/g, " ").toUpperCase()}
                    </Tag>
                  ),
                  width: 200,
                  ellipsis: true,
                },
                {
                  title: "Hours",
                  dataIndex: "hours",
                  key: "hours",
                  render: (hours) => `${hours} hrs`,
                  width: 100,
                },
                {
                  title: "Notes",
                  dataIndex: "notes",
                  key: "notes",
                  ellipsis: true,
                  width: 300,
                },
                {
                  title: "Payment Status",
                  key: "payment_status",
                  width: 150,
                  render: (_, record) => (
                    <Tag color={record.is_paid ? "success" : "warning"}>
                      {record.is_paid ? "Paid" : "Unpaid"}
                    </Tag>
                  ),
                },
                {
                  title: "Actions",
                  key: "actions",
                  width: 200,
                  render: (_, record) => (
                    <div style={{ display: "flex", gap: "8px" }}>
                      {isSuperAdmin && !record.is_paid && (
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleSinglePayment(record.id)}
                          icon={<DollarOutlined />}
                          style={{
                            background:
                              "linear-gradient(120deg, #1890ff, #096dd9)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          Mark as Paid
                        </Button>
                      )}
                      {isSuperAdmin && (
                        <Button
                          danger
                          size="small"
                          onClick={() => handleDeleteClick(record.id)}
                          icon={<DeleteOutlined />}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  ),
                },
              ]}
              scroll={{ x: "max-content" }}
            />
          </ResponsiveTableCard>
        </TabPane>
      </Tabs>
    </PageContainer>
  );
}
