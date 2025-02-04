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
} from "@ant-design/icons";
import { useAuth } from "../utils/AuthContext";
import supabase from "../utils/supabase";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

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

interface AssignedRequest {
  request_id: number;
  request: {
    id: number;
    service_type: string;
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
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHoursLog[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    totalHours: 0,
    totalEarnings: 0,
    serviceTypeStats: {},
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.id) return;

      try {
        // Fetch profile details
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch quick service assignments through proper join
        const { data: assignedRequestsData, error: assignedRequestsError } =
          await supabase
            .from("request_nurse_assignments")
            .select(
              `
            request_id,
            request:requests!inner (
              id,
              service_type
            )
          `
            )
            .eq("nurse_id", user.id);

        if (assignedRequestsError) throw assignedRequestsError;

        // Filter and count quick services from assigned requests
        const quickServiceCounts = (
          assignedRequestsData as unknown as AssignedRequest[]
        ).reduce((acc, curr) => {
          const serviceType = curr.request.service_type;
          if (QUICK_SERVICE_TYPES.includes(serviceType)) {
            acc[serviceType] = (acc[serviceType] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        console.log("Assigned requests:", assignedRequestsData);
        console.log("Quick service counts:", quickServiceCounts);

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
            request:requests (
              service_type
            )
          `
          )
          .eq("nurse_id", user.id)
          .order("work_date", { ascending: false });

        if (hoursError) throw hoursError;

        // Double type assertion to safely convert the response
        const typedHoursData = (hoursData ||
          []) as unknown as WorkingHoursLog[];
        setWorkingHours(typedHoursData);

        // Calculate statistics
        const statistics: ProfileStats = {
          totalHours: 0,
          totalEarnings: 0,
          serviceTypeStats: {},
        };

        // Initialize statistics for quick services from assignments
        Object.entries(quickServiceCounts).forEach(([serviceType, count]) => {
          statistics.serviceTypeStats[serviceType] = {
            hours: 0, // Quick services don't count hours
            earnings: count * SERVICE_RATES.quick_service, // $3 per service
            count: count,
          };
          statistics.totalEarnings += count * SERVICE_RATES.quick_service;
        });

        // Process regular services from working hours
        typedHoursData.forEach((log) => {
          const serviceType = log.request.service_type;

          // Skip quick services as they're already counted from assignments
          if (QUICK_SERVICE_TYPES.includes(serviceType)) {
            return;
          }

          if (!statistics.serviceTypeStats[serviceType]) {
            statistics.serviceTypeStats[serviceType] = {
              hours: 0,
              earnings: 0,
              count: 0,
            };
          }

          statistics.serviceTypeStats[serviceType].hours += log.hours;
          statistics.serviceTypeStats[serviceType].count += 1;

          // Calculate earnings for hourly services
          let earnings = 0;
          if (serviceType.includes("psychiatric")) {
            earnings = log.hours * SERVICE_RATES.psychiatric;
          } else if (serviceType.includes("private")) {
            earnings = log.hours * SERVICE_RATES.normal_private;
          }

          statistics.serviceTypeStats[serviceType].earnings += earnings;
          statistics.totalHours += log.hours;
          statistics.totalEarnings += earnings;
        });

        console.log("Final statistics:", statistics);
        setStats(statistics);
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  // Add debug output for quick service stats
  useEffect(() => {
    const quickServiceStats = Object.entries(stats.serviceTypeStats).filter(
      ([type]) => QUICK_SERVICE_TYPES.includes(type)
    );
    console.log("Quick service stats:", quickServiceStats);
  }, [stats]);

  if (loading) {
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

  return (
    <PageContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <BackButton icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
        Back
      </BackButton>

      <ProfileHeader>
        <Avatar size={96} icon={<UserOutlined />} />
        <div className="profile-info">
          <Title level={2} className="profile-title">
            {profile?.full_name}
          </Title>
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
        <TabPane tab="Service Type Breakdown" key="1">
          <ResponsiveTableCard>
            <Table
              dataSource={Object.entries(stats.serviceTypeStats).map(
                ([type, data]) => ({
                  key: type,
                  service_type: type,
                  hours: data.hours,
                  count: data.count,
                  earnings: data.earnings,
                })
              )}
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
                  render: (hours: number) => hours.toFixed(1),
                },
                {
                  title: "Count",
                  dataIndex: "count",
                  key: "count",
                },
                {
                  title: "Earnings",
                  dataIndex: "earnings",
                  key: "earnings",
                  render: (earnings: number) => `$${earnings.toFixed(2)}`,
                },
              ]}
              scroll={{ x: "max-content" }}
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
              ]}
              scroll={{ x: 720, y: 400 }}
              pagination={{ pageSize: 10 }}
            />
          </ResponsiveTableCard>
        </TabPane>
      </Tabs>
    </PageContainer>
  );
}
