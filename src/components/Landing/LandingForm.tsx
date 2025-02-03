import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Upload,
  Select,
  message,
  Steps,
  Space,
  Modal,
  Result,
  Typography,
} from "antd";
import { UploadOutlined, CheckCircleFilled } from "@ant-design/icons";
import type { UploadChangeParam, UploadFile } from "antd/es/upload";
import styled from "styled-components";
import { motion } from "framer-motion";
import supabase from "../../utils/supabase";

const { TextArea } = Input;
const { Title, Text } = Typography;

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

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  padding: 2rem;
`;

const MainContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  display: flex;
  gap: 3rem;
  align-items: center;
  min-height: calc(100vh - 4rem);

  @media (max-width: 1200px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

const BannerSection = styled.div`
  flex: 1;
  padding: 2rem;

  @media (max-width: 1200px) {
    text-align: center;
    padding: 1rem;
  }
`;

const FormSection = styled.div`
  flex: 1;
  max-width: 600px;
  width: 100%;
`;

const MainTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  color: #1a3d7c;
  margin-bottom: 1.5rem;
  line-height: 1.2;

  span {
    display: block;
    background: linear-gradient(120deg, #1890ff, #096dd9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  @media (max-width: 1200px) {
    font-size: 2.5rem;
  }
`;

const Slogan = styled.p`
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const FeaturesList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 3rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;

  .icon {
    font-size: 24px;
    color: #1890ff;
  }

  .content {
    h3 {
      font-size: 1.1rem;
      color: #1a3d7c;
      margin-bottom: 0.5rem;
    }

    p {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }
`;

const StyledCard = styled(Card)`
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;

  .ant-card-body {
    padding: 32px;
  }

  .ant-form-item-label > label {
    color: #1a3d7c;
    font-weight: 500;
  }

  .ant-input,
  .ant-select-selector,
  .ant-input-textarea {
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    transition: all 0.3s;

    &:hover,
    &:focus {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }

  .ant-btn {
    border-radius: 8px;
    height: 40px;
    font-weight: 500;
  }
`;

const StyledSteps = styled(Steps)`
  margin-bottom: 32px;

  .ant-steps-item-title {
    font-weight: 500;
  }

  .ant-steps-item-description {
    font-size: 0.9rem;
  }

  .ant-steps-item-icon {
    background: #fff;
    border-color: #1890ff;
  }

  .ant-steps-item-active .ant-steps-item-icon {
    background: #1890ff;
  }
`;

const SuccessModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
  }

  .ant-modal-body {
    padding: 40px;
  }

  .ant-result-icon {
    margin-bottom: 32px;
  }

  .ant-result-title {
    font-size: 28px;
    font-weight: 600;
    color: #1890ff;
  }

  .ant-result-subtitle {
    font-size: 16px;
    margin-top: 16px;
    color: #666;
  }

  .ant-btn {
    height: 44px;
    padding: 0 32px;
    font-size: 16px;
    border-radius: 8px;
  }
`;

const MotionCard = motion(StyledCard);
const MotionFeatureItem = motion(FeatureItem);

const containerAnimation = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemAnimation = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 50 : -50,
    opacity: 0,
  }),
};

export default function LandingForm() {
  const [form] = Form.useForm<LandingFormValues>();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
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
      await form.validateFields(
        currentStep === 0
          ? ["full_name", "phone_number"]
          : currentStep === 1
          ? ["area", "location"]
          : ["service_type", "details"]
      );
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } catch {
      // Form validation failed
    }
  };

  const prev = () => {
    setDirection(-1);
    setCurrentStep(currentStep - 1);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setCurrentStep(0);
  };

  const renderFormStep = () => {
    const steps = [
      <motion.div
        key="step0"
        custom={direction}
        variants={stepVariants}
        initial="enter"
        animate={currentStep === 0 ? "center" : "exit"}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        style={{ display: currentStep === 0 ? "block" : "none" }}
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
      </motion.div>,

      <motion.div
        key="step1"
        custom={direction}
        variants={stepVariants}
        initial="enter"
        animate={currentStep === 1 ? "center" : "exit"}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        style={{ display: currentStep === 1 ? "block" : "none" }}
      >
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
      </motion.div>,

      <motion.div
        key="step2"
        custom={direction}
        variants={stepVariants}
        initial="enter"
        animate={currentStep === 2 ? "center" : "exit"}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        style={{ display: currentStep === 2 ? "block" : "none" }}
      >
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
      </motion.div>,
    ];

    return steps;
  };

  return (
    <PageWrapper>
      <MainContainer>
        <BannerSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MainTitle>
              Professional
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Healthcare
              </motion.span>
              At Your Doorstep
            </MainTitle>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Slogan>
              Experience premium medical care in the comfort of your home with
              our expert team of healthcare professionals.
            </Slogan>
          </motion.div>

          <motion.div
            variants={containerAnimation}
            initial="hidden"
            animate="show"
            className="features-container"
          >
            <FeaturesList>
              <MotionFeatureItem variants={itemAnimation}>
                <div className="icon">👨‍⚕️</div>
                <div className="content">
                  <h3>Expert Medical Staff</h3>
                  <p>
                    Qualified and experienced healthcare professionals at your
                    service.
                  </p>
                </div>
              </MotionFeatureItem>
              <MotionFeatureItem variants={itemAnimation}>
                <div className="icon">🏥</div>
                <div className="content">
                  <h3>24/7 Care Available</h3>
                  <p>Round-the-clock medical support when you need it most.</p>
                </div>
              </MotionFeatureItem>
              <MotionFeatureItem variants={itemAnimation}>
                <div className="icon">⚡</div>
                <div className="content">
                  <h3>Quick Response</h3>
                  <p>Fast and efficient service delivery to your location.</p>
                </div>
              </MotionFeatureItem>
              <MotionFeatureItem variants={itemAnimation}>
                <div className="icon">💯</div>
                <div className="content">
                  <h3>Quality Assured</h3>
                  <p>
                    Highest standards of medical care and patient satisfaction.
                  </p>
                </div>
              </MotionFeatureItem>
            </FeaturesList>
          </motion.div>
        </BannerSection>

        <FormSection>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              style={{ textAlign: "center", marginBottom: "32px" }}
            >
              <Title
                level={2}
                style={{ color: "#1a3d7c", marginBottom: "8px" }}
              >
                Request Medical Care
              </Title>
              <Text style={{ fontSize: "16px", color: "#666" }}>
                Fill out the form below and our healthcare professionals will
                contact you shortly
              </Text>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
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
                <div>{renderFormStep()}</div>

                <Form.Item>
                  <Space
                    style={{ width: "100%", justifyContent: "space-between" }}
                  >
                    {currentStep > 0 && (
                      <Button onClick={prev}>Previous</Button>
                    )}
                    {currentStep < steps.length - 1 && (
                      <Button type="primary" onClick={next}>
                        Next
                      </Button>
                    )}
                    {currentStep === steps.length - 1 && (
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                      >
                        Submit Request
                      </Button>
                    )}
                  </Space>
                </Form.Item>
              </Form>
            </motion.div>
          </MotionCard>
        </FormSection>
      </MainContainer>

      <SuccessModal
        open={showSuccessModal}
        footer={null}
        closable={false}
        width={560}
        centered
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
        >
          <Result
            icon={
              <CheckCircleFilled style={{ color: "#52c41a", fontSize: 84 }} />
            }
            title="Request Submitted Successfully!"
            subTitle="One of our professional nurses will contact you soon to discuss your request and provide personalized care options."
            extra={[
              <Button
                key="check"
                type="primary"
                size="large"
                style={{ marginBottom: 10, width: "100%" }}
              >
                Track Request Status
              </Button>,
              <Button
                key="back"
                size="large"
                onClick={handleModalClose}
                style={{ width: "100%" }}
              >
                Return to Home
              </Button>,
            ]}
          />
        </motion.div>
      </SuccessModal>
    </PageWrapper>
  );
}
