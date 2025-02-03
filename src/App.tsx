import { useState } from "react";
import { Layout, Button, Typography, Spin } from "antd";
import styled from "styled-components";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./utils/AuthContext";
import AuthForm from "./components/Auth/AuthForm";
import LandingForm from "./components/Landing/LandingForm";
import SignupPage from "./pages/SignupPage";
import "./App.css";

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
    max-width: 1400px;
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
    .header-content {
      padding: 0 16px;
    }

    .logo-section {
      h4.ant-typography {
        font-size: 18px;
      }
    }

    .ant-btn {
      padding: 0 16px;
    }
  }
`;

const StyledContent = styled(Content)`
  padding: 72px 24px 24px;
  max-width: 1400px;
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

function AuthenticatedApp() {
  const { user, signOut } = useAuth();

  return (
    <StyledLayout>
      <StyledHeader>
        <div className="header-content">
          <div className="logo-section">
            <span className="logo">👨‍⚕️</span>
            <Title level={4}>Medical Care Home Services</Title>
          </div>
          <div className="nav-actions">
            <Button type="text">Dashboard</Button>
            <Button type="primary" danger onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </StyledHeader>
      <StyledContent>
        <Title level={2} style={{ color: "#1a3d7c" }}>
          Welcome, {user?.email}
        </Title>
        {/* Add your authenticated app content here */}
      </StyledContent>
    </StyledLayout>
  );
}

function UnauthenticatedApp() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <StyledLayout>
      <StyledHeader>
        <div className="header-content">
          <div className="logo-section">
            <span className="logo">👨‍⚕️</span>
            <Title level={4}>Medical Care Home Services</Title>
          </div>
          <div className="nav-actions">
            {!showSignIn ? (
              <>
                <Button type="text" onClick={() => setShowSignIn(true)}>
                  Sign In
                </Button>
                <Button
                  type="primary"
                  onClick={() => (window.location.href = "/signup")}
                >
                  Join Now
                </Button>
              </>
            ) : (
              <Button type="text" onClick={() => setShowSignIn(false)}>
                Back to Home
              </Button>
            )}
          </div>
        </div>
      </StyledHeader>
      <StyledContent>
        {showSignIn ? (
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
              <Text>
                New to our platform?{" "}
                <StyledLink to="/signup">Create an Account</StyledLink>
              </Text>
            </BannerSection>
            <FormSection>
              <AuthForm mode="signin" />
            </FormSection>
          </MainContainer>
        ) : (
          <LandingForm />
        )}
      </StyledContent>
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
          <Route path="/*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default AppWithProvider;
