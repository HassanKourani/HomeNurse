import { useEffect } from "react";
import { Layout, Typography, message } from "antd";
import styled from "styled-components";
import AuthForm from "../components/Auth/AuthForm";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import supabase from "../utils/supabase";

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
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        message.error("Please sign in first");
        navigate("/");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "superAdmin") {
        message.error("You don't have permission to access this page");
        navigate("/");
      }
    };

    checkAccess();
  }, [user, navigate]);

  return (
    <StyledLayout>
      <MainContainer>
        <BannerSection>
          <MainTitle>
            Add New
            <span>Healthcare Professional</span>
          </MainTitle>
          <Subtitle>
            Create an account for a new nurse to join our network of healthcare
            professionals.
          </Subtitle>
          <Text>
            <StyledLink to="/nurses">View All Nurses</StyledLink>
          </Text>
          <br />
          <Text>
            <StyledLink to="/">Go to main page</StyledLink>
          </Text>
        </BannerSection>
        <FormSection>
          <AuthForm mode="signup" />
        </FormSection>
      </MainContainer>
    </StyledLayout>
  );
}
