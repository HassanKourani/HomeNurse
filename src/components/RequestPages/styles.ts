import styled from "styled-components";
import { motion } from "framer-motion";
import { Table, Card, Button } from "antd";

export const PageContainer = styled(motion.div)`
  padding: 24px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%);
  min-height: 100vh;
  padding-top: 72px;
`;

export const HeaderSection = styled.div`
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  .title-section {
    h2 {
      margin: 0;
      color: #1a3d7c;
    }

    p {
      margin: 8px 0 0;
      color: #666;
      font-size: 16px;
    }
  }

  .actions-section {
    display: flex;
    gap: 12px;
  }

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: stretch;
    text-align: center;

    .actions-section {
      justify-content: center;
    }
  }
`;

const BaseStyledTable = styled(Table)`
  .ant-table {
    background: transparent;
    overflow-x: auto;
  }

  .ant-table-wrapper {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ant-table-thead > tr > th {
    background: rgba(24, 144, 255, 0.05);
    color: #1a3d7c;
    font-weight: 600;
    border-bottom: 2px solid #f0f0f0;
    padding: 16px;
    white-space: nowrap;
  }

  .ant-table-tbody > tr > td {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .ant-table-tbody > tr:hover > td {
    background: rgba(24, 144, 255, 0.02);
  }

  .ant-pagination {
    margin: 16px 0;
  }

  @media (max-width: 1024px) {
    td {
      white-space: nowrap;

      &.details-column {
        max-width: 200px;
        white-space: normal;
      }
    }
  }

  @media (max-width: 576px) {
    display: none;
  }
`;

export const StyledTable = BaseStyledTable as typeof Table;

export const MobileCardView = styled.div`
  display: none;

  @media (max-width: 576px) {
    display: block;
  }
`;

export const StyledCard = styled(Card)`
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  .ant-card-body {
    padding: 16px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      color: #1a3d7c;
      font-weight: 600;
    }
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: #666;
      font-size: 14px;
    }

    .value {
      color: #1a3d7c;
      font-weight: 500;
    }
  }

  .card-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
`;

export const ActionButton = styled(Button)`
  height: 40px;
  padding: 0 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;

  &.ant-btn-primary {
    background: linear-gradient(120deg, #1890ff, #096dd9);
    border: none;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.25);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
    }
  }

  &.ant-btn-default {
    border: 1px solid #d9d9d9;

    &:hover {
      border-color: #1890ff;
      color: #1890ff;
    }
  }
`;
