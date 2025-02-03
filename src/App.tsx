import { useState } from "react";
import { Layout, Button, Typography, Space, Spin } from "antd";
import styled from "styled-components";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./utils/AuthContext";
import AuthForm from "./components/Auth/AuthForm";
import LandingForm from "./components/Landing/LandingForm";
import SignupPage from "./pages/SignupPage";
import "./App.css";

const { Header, Content } = Layout;
const { Title } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100%;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
`;

const StyledHeader = styled(Header)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  width: 100%;
  z-index: 1000;
  border-bottom: 1px solid rgba(24, 144, 255, 0.1);

  h4 {
    background: linear-gradient(120deg, #1890ff, #096dd9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600;
  }

  .ant-btn {
    border-radius: 8px;
    height: 40px;
    font-weight: 500;
    padding: 0 24px;
  }
`;

const StyledContent = styled(Content)`
  padding: 0px 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  // small screen
  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`;

const CenteredContent = styled.div`
  max-width: 400px;
  margin: 20% auto;
  padding: 0 16px;

  .ant-card {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: none;
  }

  .ant-form-item-label > label {
    color: #1a3d7c;
    font-weight: 500;
  }

  .ant-input,
  .ant-input-password {
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    transition: all 0.3s;

    &:hover,
    &:focus {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }

  .ant-btn {
    border-radius: 8px;
    height: 40px;
    font-weight: 500;
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

function AuthenticatedApp() {
  const { user, signOut } = useAuth();

  return (
    <StyledLayout>
      <StyledHeader>
        <Title level={4} style={{ margin: 0 }}>
          Medical Care Home Services
        </Title>
        <Button type="primary" danger onClick={() => signOut()}>
          Sign Out
        </Button>
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
        <Title level={4} style={{ margin: 0 }}>
          Medical Care Home Services
        </Title>
        {!showSignIn && (
          <Button type="primary" onClick={() => setShowSignIn(true)}>
            Sign In
          </Button>
        )}
      </StyledHeader>
      <StyledContent>
        {showSignIn ? (
          <CenteredContent>
            <AuthForm mode="signin" />
            <Space
              direction="horizontal"
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <Button type="link" onClick={() => setShowSignIn(false)}>
                Back to Home
              </Button>
            </Space>
          </CenteredContent>
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
