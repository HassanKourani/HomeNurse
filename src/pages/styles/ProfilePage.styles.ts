import styled from "styled-components";
import { motion } from "framer-motion";
import { Button, Card } from "antd";

export const PageContainer = styled(motion.div)`
  padding: 16px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  min-height: 100vh;
  position: relative;
  padding-top: 24px;

  @media (min-width: 768px) {
    padding: 24px;
    padding-top: 72px;
  }
`;

export const BackButton = styled(Button)`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid #e6e6e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: white;
    border-color: #1890ff;
  }

  @media (min-width: 768px) {
    top: 24px;
    left: 24px;
  }
`;

export const StyledCard = styled(Card)`
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;

  .ant-card-head {
    border-bottom: none;
    padding-bottom: 0;
  }

  .ant-card-body {
    padding: 24px;
  }
`;
