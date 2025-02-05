import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Upload,
  Select,
  Steps,
  Space,
  Modal,
  Result,
  Typography,
  Dropdown,
} from "antd";
import {
  UploadOutlined,
  CheckCircleFilled,
  GlobalOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { motion } from "framer-motion";
import supabase from "../../utils/supabase";
import { useNotification } from "../../utils/NotificationProvider";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../utils/i18n";

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
  padding: 0 16px;
  box-sizing: border-box;

  @media (max-width: 576px) {
    padding: 0 8px;
  }
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
  max-width: 100%;
  overflow: hidden;

  .ant-card-body {
    padding: 32px;
    @media (max-width: 576px) {
      padding: 24px 16px;
    }
  }

  .ant-form-item {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .ant-form-item-control-input {
    width: 100%;
    max-width: 100%;
  }

  .ant-form-item-control-input-content {
    width: 100%;
    max-width: 100%;
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
    max-width: 100%;

    &:hover,
    &:focus {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }

  .ant-select {
    width: 100% !important;
    max-width: 100% !important;
  }

  .ant-select-selector {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    padding: 4px 11px !important;
  }

  .ant-select-selection-item {
    line-height: 1.5715;
    padding-right: 20px !important;
    max-width: calc(100% - 24px) !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .ant-select-dropdown {
    max-width: 100vw;

    .ant-select-item {
      white-space: normal;
      padding: 8px 12px;
      min-height: 32px;
      height: auto;
      line-height: 1.5715;
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

const LanguageSwitcher = styled(Button)`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #1a3d7c;
  color: white;

  .anticon {
    font-size: 16px;
  }
`;

const GlobalStyle = styled.div`
  .ant-form {
    direction: ${(props) => props.dir};
  }

  .ant-form-item-label {
    text-align: ${(props) => (props.dir === "rtl" ? "right" : "left")};
  }

  .ant-modal-content {
    direction: ${(props) => props.dir};
  }

  .ant-result {
    direction: ${(props) => props.dir};
  }
`;

const FixedWidthSelect = styled(Select)`
  && {
    display: block;
    width: 100%;

    .ant-select-selector {
      width: 100% !important;
      height: 32px !important;
      padding: 0 11px !important;
    }

    .ant-select-selection-item {
      position: absolute;
      left: 11px;
      right: 24px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 32px;
    }

    .ant-select-selection-placeholder {
      line-height: 32px;
    }
  }
`;

export default function LandingForm() {
  const [form] = Form.useForm<LandingFormValues>();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const notification = useNotification();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const steps = [
    {
      title: t("form.steps.personalInfo.title"),
      description: t("form.steps.personalInfo.description"),
    },
    {
      title: t("form.steps.location.title"),
      description: t("form.steps.location.description"),
    },
    {
      title: t("form.steps.service.title"),
      description: t("form.steps.service.description"),
    },
  ];

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("preferred-language", lang);
    form.resetFields();
  };

  useEffect(() => {
    // Load saved language from localStorage or use browser language
    const savedLanguage = localStorage.getItem("preferred-language");
    if (savedLanguage && ["en", "ar", "fr"].includes(savedLanguage)) {
      changeLanguage(savedLanguage);
    } else {
      const browserLang = navigator.language.split("-")[0];
      const defaultLang = ["en", "ar", "fr"].includes(browserLang)
        ? browserLang
        : "en";
      changeLanguage(defaultLang);
    }
  }, []);

  const languageMenu = {
    items: [
      {
        key: "en",
        label: t("language.en"),
      },
      {
        key: "ar",
        label: t("language.ar"),
      },
      {
        key: "fr",
        label: t("language.fr"),
      },
    ],
    onClick: ({ key }: { key: string }) => changeLanguage(key),
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      console.log("handleSubmit - starting submission");
      console.log("handleSubmit - imageFile:", imageFile);

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
      console.log("handleSubmit - profile created:", profileData);

      // 2. Upload image if exists
      let imageId = null;
      if (imageFile) {
        console.log("handleSubmit - starting image upload");
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `request-images/${fileName}`;
        console.log("handleSubmit - uploading to path:", filePath);

        const { error: uploadError, data } = await supabase.storage
          .from("request-images")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Upload Error:", uploadError);
          throw uploadError;
        }
        imageId = data.path;
        console.log("handleSubmit - image uploaded successfully:", imageId);
      }

      // 3. Create request
      const { data: requestData, error: requestError } = await supabase
        .from("requests")
        .insert([
          {
            patient_id: profileData.id,
            service_type: formValues.service_type,
            details: formValues.details,
            status: "pending",
            image_id: imageId,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (requestError) {
        console.error("Request Error:", requestError);
        throw new Error("Failed to create request");
      }

      setRequestId(requestData.id);
      setShowSuccessModal(true);
      form.resetFields();
      setImageFile(null);
    } catch (error) {
      console.error("Error:", error);
      notification.error({
        message: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred. Please try again.",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
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
          label={t("form.fields.fullName.label")}
          name="full_name"
          rules={[
            { required: true, message: t("form.fields.fullName.placeholder") },
          ]}
        >
          <Input placeholder={t("form.fields.fullName.placeholder")} />
        </Form.Item>

        <Form.Item
          label={t("form.fields.phoneNumber.label")}
          name="phone_number"
          rules={[
            {
              required: true,
              message: t("form.fields.phoneNumber.placeholder"),
            },
            {
              pattern: /^\+?[1-9]\d{1,14}$/,
              message: "Please enter a valid phone number!",
            },
          ]}
        >
          <Input placeholder={t("form.fields.phoneNumber.placeholder")} />
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
          label={t("form.fields.area.label")}
          name="area"
          rules={[
            { required: true, message: t("form.fields.area.placeholder") },
          ]}
        >
          <Select placeholder={t("form.fields.area.placeholder")}>
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
          label={t("form.fields.location.label")}
          name="location"
          rules={[
            {
              required: true,
              message: t("form.fields.location.placeholder"),
            },
          ]}
        >
          <TextArea
            rows={2}
            placeholder={t("form.fields.location.placeholder")}
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
          label={t("form.fields.serviceType.label")}
          name="service_type"
          rules={[
            {
              required: true,
              message: t("form.fields.serviceType.placeholder"),
            },
          ]}
        >
          <FixedWidthSelect
            placeholder={t("form.fields.serviceType.placeholder")}
          >
            {(
              Object.entries(SERVICE_TYPE_LABELS) as [ServiceType, string][]
            ).map(([value, label]) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </FixedWidthSelect>
        </Form.Item>

        <Form.Item
          label={t("form.fields.details.label")}
          name="details"
          rules={[
            {
              required: true,
              message: t("form.fields.details.placeholder"),
            },
          ]}
        >
          <TextArea
            rows={4}
            placeholder={t("form.fields.details.placeholder")}
          />
        </Form.Item>

        <Form.Item
          label={
            t("form.fields.document.label") +
            " (" +
            t("form.fields.optional") +
            ")"
          }
          tooltip={t("form.fields.document.tooltip")}
        >
          <Upload
            maxCount={1}
            beforeUpload={(file) => {
              setImageFile(file);
              return false;
            }}
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf,.odt,.ods"
          >
            <Button icon={<UploadOutlined />}>
              {t("form.fields.document.upload")}
            </Button>
          </Upload>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            {t("form.fields.document.supportedFormats", {
              defaultValue:
                "Supported formats: Images (JPG, PNG), Documents (PDF, DOC, DOCX), Spreadsheets (XLS, XLSX), Text files (TXT, RTF)",
            })}
          </div>
        </Form.Item>
      </motion.div>,
    ];

    return steps;
  };

  return (
    <GlobalStyle dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <PageWrapper>
        <Dropdown menu={languageMenu} trigger={["click"]}>
          <LanguageSwitcher type="text">
            <GlobalOutlined />
            {t(`language.${i18n.language}`)}
          </LanguageSwitcher>
        </Dropdown>

        <MainContainer>
          <BannerSection>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MainTitle>
                {t("title.part1")}
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  {t("title.part2")}
                </motion.span>
                {t("title.part3")}
              </MainTitle>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Slogan>{t("slogan")}</Slogan>
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
                    <h3>{t("features.expertStaff.title")}</h3>
                    <p>{t("features.expertStaff.description")}</p>
                  </div>
                </MotionFeatureItem>
                <MotionFeatureItem variants={itemAnimation}>
                  <div className="icon">🏥</div>
                  <div className="content">
                    <h3>{t("features.247Care.title")}</h3>
                    <p>{t("features.247Care.description")}</p>
                  </div>
                </MotionFeatureItem>
                <MotionFeatureItem variants={itemAnimation}>
                  <div className="icon">⚡</div>
                  <div className="content">
                    <h3>{t("features.quickResponse.title")}</h3>
                    <p>{t("features.quickResponse.description")}</p>
                  </div>
                </MotionFeatureItem>
                <MotionFeatureItem variants={itemAnimation}>
                  <div className="icon">💯</div>
                  <div className="content">
                    <h3>{t("features.qualityAssured.title")}</h3>
                    <p>{t("features.qualityAssured.description")}</p>
                  </div>
                </MotionFeatureItem>
              </FeaturesList>
            </motion.div>
          </BannerSection>

          <FormSection>
            <MotionCard>
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
                  {t("form.title")}
                </Title>
                <Text style={{ fontSize: "16px", color: "#666" }}>
                  {t("form.subtitle")}
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
                        <Button onClick={prev}>
                          {t("form.buttons.previous")}
                        </Button>
                      )}
                      {currentStep < steps.length - 1 && (
                        <Button type="primary" onClick={next}>
                          {t("form.buttons.next")}
                        </Button>
                      )}
                      {currentStep === steps.length - 1 && (
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={loading}
                        >
                          {t("form.buttons.submit")}
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
              title={t("success.title")}
              subTitle={t("success.subtitle")}
              extra={[
                <Button
                  key="check"
                  type="primary"
                  size="large"
                  onClick={() => navigate(`/request/${requestId}`)}
                  style={{ marginBottom: 10, width: "100%" }}
                >
                  {t("success.buttons.track")}
                </Button>,
                <Button
                  key="back"
                  size="large"
                  onClick={handleModalClose}
                  style={{ width: "100%" }}
                >
                  {t("success.buttons.home")}
                </Button>,
              ]}
            />
          </motion.div>
        </SuccessModal>
      </PageWrapper>
    </GlobalStyle>
  );
}
