import { Layout, Typography } from "antd";
import styled from "styled-components";
import AuthForm from "../components/Auth/AuthForm";
import { Link } from "react-router-dom";

const { Title, Text } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const MainContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  gap: 64px;
  margin: 0 auto;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 32px;
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

export default function SignupPage() {
  return (
    <StyledLayout>
      <MainContainer>
        <BannerSection>
          <MainTitle>
            Join Our Network of
            <span>Healthcare Professionals</span>
          </MainTitle>
          <Subtitle>
            Connect with patients who need your expertise and provide quality
            healthcare services from the comfort of their homes.
          </Subtitle>
          <Text>
            Already have an account? <StyledLink to="/">Sign In</StyledLink>
          </Text>
        </BannerSection>
        <FormSection>
          <AuthForm mode="signup" />
        </FormSection>
      </MainContainer>
    </StyledLayout>
  );
}
