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
  Steps,
  Space,
  Modal,
  Result,
} from "antd";
import { UploadOutlined, CheckCircleFilled } from "@ant-design/icons";
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

type Area =
  | "beirut"
  | "mount_lebanon"
  | "north_lebanon"
  | "south_lebanon"
  | "bekaa";

type LandingFormValues = {
  full_name: string;
  phone_number: string;
  email: string;
  service_type: ServiceType;
  area: Area;
  location: string;
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

const AREA_LABELS: Record<Area, string> = {
  beirut: "Beirut (بيروت)",
  mount_lebanon: "Mount Lebanon (جبل لبنان) - Coming Soon",
  north_lebanon: "North Lebanon (لبنان الشمالي) - Coming Soon",
  south_lebanon: "South Lebanon (لبنان الجنوبي) - Coming Soon",
  bekaa: "Bekaa (البقاع) - Coming Soon",
};

const ENABLED_AREAS = ["beirut"];

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

const StyledSteps = styled(Steps)`
  margin-bottom: 24px;
`;

const steps = [
  {
    title: "Personal Info",
    description: "Basic information",
  },
  {
    title: "Location",
    description: "Your address",
  },
  {
    title: "Service",
    description: "Service details",
  },
];

const SuccessModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 12px;
    overflow: hidden;
  }
  .ant-modal-body {
    padding: 32px;
  }
  .ant-result-icon {
    margin-bottom: 24px;
  }
  .ant-result-title {
    font-size: 24px;
    font-weight: 600;
  }
  .ant-result-subtitle {
    font-size: 16px;
    margin-top: 8px;
  }
`;

export default function LandingForm() {
  const [form] = Form.useForm<LandingFormValues>();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate all fields first and get the validated values
      const formValues = await form.validateFields();

      // 1. Create profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            full_name: formValues.full_name,
            phone_number: formValues.phone_number,
            role: "patient",
            area: formValues.area,
            location: formValues.location,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error("Profile Error:", profileError);
        throw new Error("Failed to create profile");
      }

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
          service_type: formValues.service_type,
          details: formValues.details,
          status: "pending",
          image_id: imageId,
          created_at: new Date().toISOString(),
        },
      ]);

      if (requestError) {
        console.error("Request Error:", requestError);
        throw new Error("Failed to create request");
      }

      // Show success modal instead of message
      setShowSuccessModal(true);
      form.resetFields();
      setImageFile(null);
    } catch (error) {
      console.error("Error:", error);
      message.error(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === "done") {
      setImageFile(info.file.originFileObj as File);
    }
  };

  const next = async () => {
    try {
      // Validate current step fields before moving to next
      await form.validateFields(
        currentStep === 0
          ? ["full_name", "phone_number"]
          : currentStep === 1
          ? ["area", "location"]
          : ["service_type", "details"]
      );
      setCurrentStep(currentStep + 1);
    } catch {
      // Form validation failed, error message will be shown by the form itself
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setCurrentStep(0);
  };

  return (
    <>
      <StyledCard>
        <FormTitle level={2}>Welcome to MCHS</FormTitle>
        <FormDescription>
          Looking for professional nursing care? Fill out the form below and
          we'll get back to you.
        </FormDescription>

        <StyledSteps
          current={currentStep}
          items={steps}
          labelPlacement="vertical"
        />

        <Form<LandingFormValues>
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <div style={{ display: currentStep === 0 ? "block" : "none" }}>
            <Form.Item
              label="Full Name"
              name="full_name"
              rules={[
                { required: true, message: "Please input your full name!" },
              ]}
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
          </div>

          <div style={{ display: currentStep === 1 ? "block" : "none" }}>
            <Form.Item
              label="Area"
              name="area"
              rules={[{ required: true, message: "Please select your area!" }]}
            >
              <Select placeholder="Select your area">
                {(Object.entries(AREA_LABELS) as [Area, string][]).map(
                  ([value, label]) => (
                    <Select.Option
                      key={value}
                      value={value}
                      disabled={!ENABLED_AREAS.includes(value)}
                    >
                      {label}
                    </Select.Option>
                  )
                )}
              </Select>
            </Form.Item>

            <Form.Item
              label="Location Details"
              name="location"
              rules={[
                {
                  required: true,
                  message: "Please provide your location details!",
                },
              ]}
            >
              <TextArea
                rows={2}
                placeholder="Please provide detailed address (building, street, nearby landmarks)"
              />
            </Form.Item>
          </div>

          <div style={{ display: currentStep === 2 ? "block" : "none" }}>
            <Form.Item
              label="Service Type"
              name="service_type"
              rules={[
                { required: true, message: "Please select a service type!" },
              ]}
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
                  required: true,
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
          </div>

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              {currentStep > 0 && <Button onClick={prev}>Previous</Button>}
              {currentStep < steps.length - 1 && (
                <Button type="primary" onClick={next}>
                  Next
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button type="primary" htmlType="submit" loading={loading}>
                  Submit Request
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </StyledCard>

      <SuccessModal
        open={showSuccessModal}
        footer={null}
        closable={false}
        width={500}
        centered
      >
        <Result
          icon={
            <CheckCircleFilled style={{ color: "#52c41a", fontSize: 72 }} />
          }
          title="Request Submitted Successfully!"
          subTitle="One of our nurses will contact you soon to discuss your request."
          extra={[
            <Button key="check" type="primary" size="large">
              Check Request
            </Button>,
            <Button key="back" size="large" onClick={handleModalClose}>
              Back to Home
            </Button>,
          ]}
        />
      </SuccessModal>
    </>
  );
}
