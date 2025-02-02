import { useState } from "react";
import { Form, Input, Button, Alert, Card, Select } from "antd";
import styled from "styled-components";
import { useAuth } from "../../utils/AuthContext";

type AuthFormProps = {
  mode: "signin" | "signup";
};

type SignUpFormValues = {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  role: "registered" | "licensed" | "practitioner";
};

type SignInFormValues = {
  email: string;
  password: string;
};

const StyledCard = styled(Card)`
  max-width: 400px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  text-align: center;
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 600;
`;

export default function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();
  const [form] = Form.useForm();

  const handleSubmit = async (values: SignUpFormValues | SignInFormValues) => {
    setError(null);

    try {
      if (mode === "signup") {
        const { email, password, full_name, phone_number, role } =
          values as SignUpFormValues;
        await signUp(email, password, {
          full_name,
          phone_number,
          role,
        });
      } else {
        const { email, password } = values as SignInFormValues;
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <StyledCard>
      <FormTitle>{mode === "signup" ? "Create Account" : "Sign In"}</FormTitle>
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {mode === "signup" && (
          <>
            <Form.Item
              label="Full Name"
              name="full_name"
              rules={[
                { required: true, message: "Please input your full name!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phone_number"
              rules={[
                { required: true, message: "Please input your phone number!" },
                {
                  pattern: /^\+?[1-9]\d{1,14}$/,
                  message: "Please enter a valid phone number!",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Nurse Type"
              name="role"
              rules={[{ required: true, message: "Please select nurse type!" }]}
            >
              <Select>
                <Select.Option value="registered">
                  Registered Nurse (RN)
                </Select.Option>
                <Select.Option value="licensed">
                  Licensed Practical Nurse (LPN)
                </Select.Option>
                <Select.Option value="practitioner">
                  Nurse Practitioner (NP)
                </Select.Option>
              </Select>
            </Form.Item>
          </>
        )}

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Please enter a valid email!" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please input your password!" },
            { min: 6, message: "Password must be at least 6 characters!" },
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            {mode === "signup" ? "Sign Up" : "Sign In"}
          </Button>
        </Form.Item>
      </Form>
    </StyledCard>
  );
}
