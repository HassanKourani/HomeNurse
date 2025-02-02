import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Upload,
  Select,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import styled from "styled-components";
import supabase from "../../utils/supabase";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

type ServiceType =
  | "full_time_private_normal"
  | "full_time_private_psychiatric"
  | "part_time_private_normal"
  | "part_time_private_psychiatric"
  | "blood_test"
  | "im"
  | "iv"
  | "patient_care"
  | "hemo_vs"
  | "other";

type LandingFormValues = {
  full_name: string;
  phone_number: string;
  email: string;
  service_type: ServiceType;
  details: string;
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  full_time_private_normal: "Full time private (الرعاية المنزلية المستمرة)",
  full_time_private_psychiatric:
    "Full time psychiatric (الرعاية المنزلية المستمرة للمرضى الذين يعانون من أمراض الأعصاب)",
  part_time_private_normal: "Part time private (الرعاية المنزلية الجزئية)",
  part_time_private_psychiatric:
    "Part time psychiatric (الرعاية المنزلية الجزئية للمرضى الذين يعانون من أمراض الأعصاب)",
  blood_test: "Blood test (اختبار الدم)",
  im: "Intramuscular (IM, الحقن العضلي) ",
  iv: "Intravenous (IV, مصل الجسم) ",
  patient_care: "Care for patients (الرعاية للمرضى)",
  hemo_vs: "Hemo+ v/s (الرعاية للمرضى الذين يعانون من أمراض الأورام)",
  other: "Other",
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
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleSubmit = async (values: LandingFormValues) => {
    try {
      setLoading(true);

      // 1. Create profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            full_name: values.full_name,
            phone_number: values.phone_number,
            email: values.email,
            role: "patient",
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      // 2. Upload image if exists
      let imageId = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `request-images/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from("request-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;
        imageId = data.path;
      }

      // 3. Create request
      const { error: requestError } = await supabase.from("requests").insert([
        {
          patient_id: profileData.id,
          service_type: values.service_type,
          details: values.details,
          status: "pending",
          image_id: imageId,
          created_at: new Date().toISOString(),
        },
      ]);

      if (requestError) throw requestError;

      message.success("Your request has been submitted successfully!");
      form.resetFields();
      setImageFile(null);
    } catch (error) {
      console.error("Error:", error);
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === "done") {
      setImageFile(info.file.originFileObj as File);
    }
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
        <Form.Item
          label="Full Name"
          name="full_name"
          rules={[{ required: true, message: "Please input your full name!" }]}
        >
          <Input placeholder="Enter your full name" />
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
          <Input placeholder="Enter your phone number" />
        </Form.Item>

        <Form.Item
          label="Service Type"
          name="service_type"
          rules={[{ required: true, message: "Please select a service type!" }]}
        >
          <Select placeholder="Select the type of service you need">
            {(
              Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]
            ).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Details"
          name="details"
          rules={[
            {
              required: false,
              message: "Please provide details about your needs!",
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder="Please describe your needs and any relevant medical conditions"
          />
        </Form.Item>

        <Form.Item label="Supporting Document (Optional)">
          <Upload
            maxCount={1}
            beforeUpload={() => false}
            onChange={handleImageChange}
          >
            <Button icon={<UploadOutlined />}>Click to Upload</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Submit Request
          </Button>
        </Form.Item>
      </Form>
    </StyledCard>
  );
}
