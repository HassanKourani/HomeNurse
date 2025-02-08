import { Button, Form, Input, Select } from "antd";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import styled from "styled-components";

const FilterContainer = styled.div`
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;

  .ant-form-item {
    margin-bottom: 16px;
  }

  @media (max-width: 576px) {
    padding: 16px;
  }
`;

export interface NurseFilterValues {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface NurseFiltersProps {
  onFilterChange: (values: NurseFilterValues) => void;
  onReset: () => void;
  initialValues: NurseFilterValues;
}

const roleOptions = [
  { value: "", label: "Select role", disabled: true },
  { value: "registered", label: "Registered Nurse (RN)" },
  { value: "physiotherapist", label: "Physiotherapist" },
];

export function NurseFilters({
  onFilterChange,
  onReset,
  initialValues,
}: NurseFiltersProps) {
  const [form] = Form.useForm();

  const handleReset = () => {
    onReset();
    setTimeout(() => {
      form.resetFields();
    }, 0);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          Reset
        </Button>
        <Button
          type="primary"
          icon={<FilterOutlined />}
          onClick={() => form.submit()}
        >
          Apply Filters
        </Button>
      </div>

      <FilterContainer>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFilterChange}
          initialValues={initialValues}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              form.submit();
            }
          }}
          preserve={false}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
              gap: "16px",
            }}
          >
            <Form.Item name="name" label="Name">
              <Input
                placeholder="Search by name"
                allowClear
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input
                placeholder="Search by email"
                allowClear
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
            <Form.Item name="phone" label="Phone Number">
              <Input
                placeholder="Search by phone number"
                allowClear
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
            <Form.Item name="role" label="Role">
              <Select
                placeholder="Select role"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={roleOptions}
              />
            </Form.Item>
          </div>
        </Form>
      </FilterContainer>
    </>
  );
}
