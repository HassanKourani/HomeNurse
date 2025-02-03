import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Alert,
  Card,
  Select,
  Typography,
  message,
} from "antd";
import styled from "styled-components";
import { useAuth } from "../../utils/AuthContext";
import {
  UserOutlined,
  LockOutlined,
  PhoneOutlined,
  IdcardOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  overflow: hidden;

  .ant-card-body {
    padding: 32px;
  }

  .ant-form-item-label > label {
    color: #1a3d7c;
    font-weight: 500;
  }

  .ant-input-affix-wrapper,
  .ant-select-selector,
  .ant-input {
    height: 45px;
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    transition: all 0.3s;
    box-sizing: border-box;

    &:hover,
    &:focus,
    &.ant-input-affix-wrapper-focused {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }

  .ant-input-affix-wrapper {
    padding: 0 11px;
    display: flex;
    align-items: center;

    .ant-input-prefix {
      margin-right: 10px;
      color: #1a3d7c;
      opacity: 0.5;
      display: flex;
      align-items: center;

      .anticon {
        font-size: 18px;
      }
    }

    input.ant-input {
      height: 100%;
      padding: 0;
      border: none;
      box-shadow: none;

      &:focus {
        box-shadow: none;
      }
    }

    .ant-input-suffix {
      margin-left: 10px;
      display: flex;
      align-items: center;
    }
  }

  .ant-input {
    padding: 8px 11px;

    &:focus {
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }

  .ant-select-selector {
    padding: 0 11px;
    display: flex;
    align-items: center;

    .ant-select-selection-item {
      line-height: normal;
    }
  }

  .ant-input-password {
    padding: 0 11px;

    input {
      height: 100%;
    }

    .ant-input-password-icon {
      color: #1a3d7c;
      opacity: 0.5;

      &:hover {
        color: #1890ff;
        opacity: 1;
      }
    }
  }

  .ant-btn {
    height: 45px;
    font-weight: 600;
    font-size: 16px;
    border-radius: 8px;

    &.ant-btn-primary {
      background: linear-gradient(120deg, #1890ff, #096dd9);
      border: none;
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.25);

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
      }
    }
  }

  .ant-form-item-explain-error {
    font-size: 13px;
    margin-top: 4px;
  }
`;

const FormHeader = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

const FormTitle = styled(Title)`
  &.ant-typography {
    margin-bottom: 8px;
    color: #1a3d7c;
  }
`;

const FormSubtitle = styled(Text)`
  &.ant-typography {
    color: #666;
    font-size: 16px;
  }
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
        message.success("Account created successfully");
        form.resetFields();
      } else {
        const { email, password } = values as SignInFormValues;
        await signIn(email, password);
        message.success("Sign in successful");
        form.resetFields();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <StyledCard>
      <FormHeader>
        <FormTitle level={2}>
          {mode === "signup" ? "Create Account" : "Welcome Back"}
        </FormTitle>
        <FormSubtitle>
          {mode === "signup"
            ? "Join our network of healthcare professionals"
            : "Sign in to access your account"}
        </FormSubtitle>
      </FormHeader>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        size="large"
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
              <Input
                prefix={<IdcardOutlined className="site-form-item-icon" />}
                placeholder="Enter your full name"
              />
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
              <Input
                prefix={<PhoneOutlined className="site-form-item-icon" />}
                placeholder="Enter your phone number"
              />
            </Form.Item>

            <Form.Item
              label="Nurse Type"
              name="role"
              rules={[{ required: true, message: "Please select nurse type!" }]}
            >
              <Select placeholder="Select your nurse type">
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
          <Input
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Enter your email"
          />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            { required: true, message: "Please input your password!" },
            { min: 6, message: "Password must be at least 6 characters!" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder="Enter your password"
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 12 }}>
          <Button type="primary" htmlType="submit" block>
            {mode === "signup" ? "Create Account" : "Sign In"}
          </Button>
        </Form.Item>
      </Form>
    </StyledCard>
  );
}
