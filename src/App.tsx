import { useState } from "react";
import { Layout, Button, Typography, Space, Spin } from "antd";
import styled from "styled-components";
import { AuthProvider, useAuth } from "./utils/AuthContext";
import AuthForm from "./components/Auth/AuthForm";
import "./App.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
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
          HomeNurse
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
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <StyledLayout>
      <StyledContent>
        <CenteredContent>
          <Title level={2} style={{ textAlign: "center", marginBottom: 32 }}>
            HomeNurse
          </Title>
          <AuthForm mode={mode} />
          <Space
            direction="horizontal"
            style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
          >
            <Text type="secondary">
              {mode === "signin"
                ? "Don't have an account? "
                : "Already have an account? "}
            </Text>
            <Button
              type="link"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Sign Up" : "Sign In"}
            </Button>
          </Space>
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
      <App />
    </AuthProvider>
  );
}

export default AppWithProvider;
