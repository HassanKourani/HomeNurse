import { Form, Input, Button, Card, Typography } from "antd";
import styled from "styled-components";

const { Title, Paragraph } = Typography;

type LandingFormValues = {
  name: string;
  email: string;
};

const StyledCard = styled(Card)`
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled(Title)`
  text-align: center;
  margin-bottom: 16px !important;
`;

const FormDescription = styled(Paragraph)`
  text-align: center;
  margin-bottom: 24px;
`;

export default function LandingForm() {
  const [form] = Form.useForm<LandingFormValues>();

  const handleSubmit = async (values: LandingFormValues) => {
    // We'll implement this later
    console.log(values);
  };

  return (
    <StyledCard>
      <FormTitle level={2}>Welcome to Home Nurse</FormTitle>
      <FormDescription>
        Looking for professional nursing care? Fill out the form below and we'll
        get back to you.
      </FormDescription>

      <Form<LandingFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {/* We'll add the actual form fields later */}
        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Please input your name!" }]}
        >
          <Input placeholder="Enter your full name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input placeholder="Enter your email address" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Submit Request
          </Button>
        </Form.Item>
      </Form>
    </StyledCard>
  );
}
