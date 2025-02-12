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

type Area =
  | "beirut"
  | "near_beirut"
  | "mount_lebanon"
  | "north_lebanon"
  | "south_lebanon"
  | "bekaa";

const AREA_LABELS: Record<Area, string> = {
  beirut: "Beirut (بيروت)",
  near_beirut:
    "Near Beirut - Khalde, Bchamoun, Aramoun (ضواحي بيروت - خلدة، بشامون، عرمون)",
  mount_lebanon: "Mount Lebanon (جبل لبنان) - Coming Soon",
  north_lebanon: "North Lebanon (لبنان الشمالي) - Coming Soon",
  south_lebanon: "South Lebanon (لبنان الجنوبي) - Coming Soon",
  bekaa: "Bekaa (البقاع) - Coming Soon",
};

export interface FilterValues {
  patientName: string;
  contact: string;
  area: string;
  status: string;
}

interface RequestFiltersProps {
  onFilterChange: (values: FilterValues) => void;
  onReset: () => void;
  initialValues: FilterValues;
  showStatus?: boolean;
  statusOptions?: Array<{ value: string; label: string }>;
}

export function RequestFilters({
  onFilterChange,
  onReset,
  initialValues,
  showStatus = true,
  statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "accepted", label: "Accepted" },
  ],
}: RequestFiltersProps) {
  const [form] = Form.useForm();

  const handleReset = () => {
    form.resetFields();
    onReset();
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
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
              gap: "16px",
            }}
          >
            <Form.Item name="patientName" label="Patient Name">
              <Input
                placeholder="Search by patient name"
                allowClear
                onPressEnter={() => form.submit()}
              />
            </Form.Item>
            <Form.Item name="area" label="Area">
              <Select
                placeholder="Select service area"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={[
                  { value: "", label: "Select service area", disabled: true },
                  ...Object.entries(AREA_LABELS).map(([value, label]) => ({
                    value,
                    label,
                    disabled: label.includes("Coming Soon"),
                  })),
                ]}
              />
            </Form.Item>
            {showStatus && (
              <Form.Item name="status" label="Status">
                <Select
                  placeholder="Select request status"
                  allowClear
                  options={[
                    {
                      value: "",
                      label: "Select request status",
                      disabled: true,
                    },
                    ...statusOptions,
                  ]}
                />
              </Form.Item>
            )}
          </div>
        </Form>
      </FilterContainer>
    </>
  );
}
