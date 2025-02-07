import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const WaitingApprovalPage = () => {
  const navigate = useNavigate();

  return (
    <Result
      status="info"
      title="Registration Successful!"
      subTitle="Your account is pending approval. Our team will review your application and you will be notified via email once your account is approved. Please check your email for further instructions."
      extra={[
        <Button key="home" onClick={() => navigate("/")} type="primary">
          Back to Home
        </Button>,
      ]}
    />
  );
};

export default WaitingApprovalPage;
