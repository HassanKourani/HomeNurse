import { Layout } from "antd";
import styled from "styled-components";
import AuthForm from "../components/Auth/AuthForm";

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
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

export default function SignupPage() {
  return (
    <StyledLayout>
      <StyledContent>
        <CenteredContent>
          <AuthForm mode="signup" />
        </CenteredContent>
      </StyledContent>
    </StyledLayout>
  );
}
