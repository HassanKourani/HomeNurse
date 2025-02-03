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
`;

const StyledHeader = styled(Header)`
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StyledContent = styled(Content)`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const CenteredContent = styled.div`
  max-width: 400px;
  margin: 48px auto;
  padding: 0 16px;
`;

const LoadingContainer = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

function AuthenticatedApp() {
  const { user, signOut } = useAuth();

  return (
    <StyledLayout>
      <StyledHeader>
        <Title level={4} style={{ margin: 0 }}>
          Medical Care Home Services
        </Title>
        <Button type="link" danger onClick={() => signOut()}>
          Sign Out
        </Button>
      </StyledHeader>
      <StyledContent>
        <Title level={2}>Welcome, {user?.email}</Title>
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
        <CenteredContent>
          {showSignIn ? (
            <>
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
            </>
          ) : (
            <LandingForm />
          )}
        </CenteredContent>
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
