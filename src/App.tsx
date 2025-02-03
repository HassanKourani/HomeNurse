import { useState, useEffect } from "react";
import { Layout, Button, Typography, Spin } from "antd";
import styled from "styled-components";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./utils/AuthContext";
import AuthForm from "./components/Auth/AuthForm";
import LandingForm from "./components/Landing/LandingForm";
import SignupPage from "./pages/SignupPage";
import NursesManagement from "./pages/NursesManagement";
import { motion, AnimatePresence } from "framer-motion";
import supabase from "./utils/supabase";
import "./App.css";
import RegularCareRequests from "./pages/RegularCareRequests";
import PsychiatricCareRequests from "./pages/PsychiatricCareRequests";
import QuickServiceRequests from "./pages/QuickServiceRequests";
import MyAssignments from "./pages/MyAssignments";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
`;

const StyledHeader = styled(Header)`
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 0;
  position: fixed;
  width: 100%;
  z-index: 1000;
  height: 72px;
  border-bottom: 1px solid rgba(24, 144, 255, 0.1);

  .header-content {
    width: 100%;
    height: 100%;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 12px;

    .logo {
      font-size: 24px;
      color: #1890ff;
      display: flex;
      align-items: center;
    }

    h4.ant-typography {
      margin: 0;
      font-size: 20px;
      background: linear-gradient(120deg, #1890ff, #096dd9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .ant-btn {
    border-radius: 8px;
    height: 40px;
    font-weight: 500;
    padding: 0 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    transition: all 0.3s ease;

    &.ant-btn-primary {
      background: linear-gradient(120deg, #1890ff, #096dd9);
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.25);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
      }
    }

    &.ant-btn-primary.ant-btn-dangerous {
      background: linear-gradient(120deg, #ff4d4f, #cf1322);
      box-shadow: 0 2px 8px rgba(255, 77, 79, 0.25);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
      }
    }

    &.ant-btn-text {
      color: #1a3d7c;

      &:hover {
        background: rgba(24, 144, 255, 0.1);
        color: #1890ff;
      }
    }
  }

  @media (max-width: 768px) {
    height: 64px;

    .header-content {
      padding: 0 16px;
    }

    .logo-section {
      .logo {
        display: none;
      }

      h4.ant-typography {
        font-size: 16px;
        &::after {
          content: "Medical Care";
        }
        span {
          display: none;
        }
      }
    }

    .ant-btn {
      padding: 0 16px;
      font-size: 14px;
    }
  }
`;

const StyledContent = styled(Content)`
  padding: 72px 24px 24px;
  margin: 0 auto;
  width: 100%;
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;

  // small screen
  @media (max-width: 768px) {
    padding: 96px 16px 24px;
  }
`;

const LoadingContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);

  .ant-spin {
    .ant-spin-dot-item {
      background-color: #1890ff;
    }
  }
`;

const MainContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  gap: 64px;
  margin: 0 auto;
  padding: 24px 0;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 32px;
    padding: 0;
  }
`;

const BannerSection = styled.div`
  flex: 1;
  padding: 48px 0;

  @media (max-width: 1024px) {
    text-align: center;
    padding: 0;
  }
`;

const FormSection = styled.div`
  width: 100%;
  max-width: 480px;

  @media (max-width: 1024px) {
    max-width: 400px;
  }
`;

const MainTitle = styled(Title)`
  &.ant-typography {
    font-size: 2.5rem;
    font-weight: 800;
    color: #1a3d7c;
    margin-bottom: 16px;
    line-height: 1.2;

    span {
      display: block;
      background: linear-gradient(120deg, #1890ff, #096dd9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
`;

const Subtitle = styled(Text)`
  &.ant-typography {
    display: block;
    font-size: 1.1rem;
    color: #666;
    margin-bottom: 32px;
    line-height: 1.6;
  }
`;

const StyledLink = styled(Link)`
  color: #1890ff;
  font-weight: 500;
  font-size: 1.1rem;

  &:hover {
    text-decoration: underline;
  }
`;

const AnimatedHeader = motion(StyledHeader);
const AnimatedContent = motion(StyledContent);

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5 },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 },
};

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 32px 24px;
  margin: 0 auto;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 16px;
  }
`;

const ServiceCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  .emoji {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    color: #1a3d7c;
    margin: 0;
  }

  .description {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
    margin: 0;
    flex-grow: 1;
  }

  .stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .stat-item {
    background: rgba(24, 144, 255, 0.05);
    padding: 8px 12px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;

    .value {
      font-weight: 600;
      color: #1a3d7c;
    }

    .label {
      color: #666;
      font-size: 12px;
    }
  }
`;

function AuthenticatedApp() {
  const { user, signOut } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRole = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

      setIsSuperAdmin(profile?.role === "superAdmin");
    };

    checkRole();
  }, [user]);

  const serviceCards = [
    {
      emoji: "🏥",
      title: "Regular Care Requests",
      description:
        "View and manage regular care requests including full-time and part-time nursing care assignments.",
      stats: [
        { value: "12", label: "New Requests" },
        { value: "5", label: "Pending" },
        { value: "3", label: "Urgent" },
      ],
      onClick: () => navigate("/regular-care-requests"),
    },
    {
      emoji: "🧠",
      title: "Psychiatric Care Requests",
      description:
        "Access psychiatric care assignments and mental health support requests from patients.",
      stats: [
        { value: "8", label: "New Requests" },
        { value: "4", label: "Pending" },
        { value: "2", label: "Priority" },
      ],
      onClick: () => navigate("/psychiatric-requests"),
    },
    {
      emoji: "⚡",
      title: "Quick Service Requests",
      description:
        "Check immediate assistance requests and short-term care assignments in your area.",
      stats: [
        { value: "6", label: "New" },
        { value: "2", label: "Active" },
      ],
      onClick: () => navigate("/quick-requests"),
    },
    {
      emoji: "📋",
      title: "My Assignments",
      description:
        "View your current and upcoming care assignments, schedules, and patient details.",
      stats: [
        { value: "4", label: "Active" },
        { value: "2", label: "Upcoming" },
      ],
      onClick: () => navigate("/my-assignments"),
    },
    {
      emoji: "👤",
      title: "My Profile",
      description:
        "Manage your professional profile, update certifications, and view performance metrics.",
      stats: [
        { value: "15", label: "Completed" },
        { value: "4.9", label: "Rating" },
      ],
      onClick: () => navigate("/profile"),
    },
  ];

  return (
    <StyledLayout>
      <AnimatedHeader
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="header-content">
          <motion.div
            className="logo-section"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="logo">👨‍⚕️</span>
            <Title level={4}>
              <span>Home Services</span>
            </Title>
          </motion.div>
          <motion.div
            className="nav-actions"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isSuperAdmin && (
              <>
                <Button type="text" onClick={() => navigate("/nurses")}>
                  Manage Nurses
                </Button>
                <Button type="text" onClick={() => navigate("/signup")}>
                  Add Nurse
                </Button>
              </>
            )}
            <Button type="primary" danger onClick={() => signOut()}>
              Sign Out
            </Button>
          </motion.div>
        </div>
      </AnimatedHeader>
      <AnimatedContent
        {...fadeInUp}
        style={{
          background: "linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)",
        }}
      >
        <DashboardGrid>
          {serviceCards.map((card, index) => (
            <ServiceCard
              key={card.title}
              onClick={card.onClick}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="emoji">{card.emoji}</div>
              <h3 className="title">{card.title}</h3>
              <p className="description">{card.description}</p>
              <div className="stats">
                {card.stats.map((stat, i) => (
                  <div key={i} className="stat-item">
                    <span className="value">{stat.value}</span>
                    <span className="label">{stat.label}</span>
                  </div>
                ))}
              </div>
            </ServiceCard>
          ))}
        </DashboardGrid>
      </AnimatedContent>
    </StyledLayout>
  );
}

function UnauthenticatedApp() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <StyledLayout>
      <AnimatedHeader
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="header-content">
          <motion.div
            className="logo-section"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="logo">👨‍⚕️</span>
            <Title level={4}>
              <span>Medical Care Home Services</span>
            </Title>
          </motion.div>
          <motion.div
            className="nav-actions"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {!showSignIn ? (
              <>
                <Button type="text" onClick={() => setShowSignIn(true)}>
                  Sign In
                </Button>
                <Button
                  type="primary"
                  onClick={() =>
                    (window.location.href = "mailto:support@medicalcare.com")
                  }
                >
                  Contact Support
                </Button>
              </>
            ) : (
              <Button type="text" onClick={() => setShowSignIn(false)}>
                Back to Home
              </Button>
            )}
          </motion.div>
        </div>
      </AnimatedHeader>
      <AnimatedContent {...fadeInUp}>
        <AnimatePresence mode="wait">
          {showSignIn ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <MainContainer>
                <BannerSection>
                  <MainTitle>
                    Welcome Back to
                    <span>Medical Care</span>
                  </MainTitle>
                  <Subtitle>
                    Access your dashboard to manage patient requests and provide
                    exceptional healthcare services to those in need.
                  </Subtitle>
                  <StyledLink to="/" onClick={() => setShowSignIn(false)}>
                    Go to main page
                  </StyledLink>
                </BannerSection>
                <FormSection>
                  <AuthForm mode="signin" />
                </FormSection>
              </MainContainer>
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <LandingForm />
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatedContent>
    </StyledLayout>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LoadingContainer>
        <Spin size="large" />
      </LoadingContainer>
    );
  }

  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

function AppWithProvider() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/nurses" element={<NursesManagement />} />
          <Route
            path="/regular-care-requests"
            element={<RegularCareRequests />}
          />
          <Route
            path="/psychiatric-requests"
            element={<PsychiatricCareRequests />}
          />
          <Route path="/quick-requests" element={<QuickServiceRequests />} />
          <Route path="/my-assignments" element={<MyAssignments />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default AppWithProvider;
