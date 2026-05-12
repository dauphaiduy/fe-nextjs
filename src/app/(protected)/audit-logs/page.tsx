"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { auditLogService } from "@/services/audit-log.service";
import type { AuditLog, AuditLogQuery, PaginatedData } from "@/types/api";
import { formatDateTime } from "@/utils/helpers";

const { Title } = Typography;

const ACTION_OPTIONS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export default function AuditLogsPage() {
  const [data, setData] = useState<PaginatedData<AuditLog> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<AuditLogQuery>({ page: 1, limit: 20 });
  const [filterForm] = Form.useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await auditLogService.list(query);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setError("Failed to load audit logs.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleFilter = (values: AuditLogQuery) => {
    const next: AuditLogQuery = {
      page: 1,
      limit: query.limit,
      userId: values.userId,
      action: values.action,
      resource: values.resource,
      statusCode: values.statusCode,
      from: values.from,
      to: values.to,
    };
    setQuery(next);
  };

  const handleReset = () => {
    filterForm.resetFields();
    setQuery({ page: 1, limit: 20 });
  };

  const columns: ColumnsType<AuditLog> = [
    { title: "ID", dataIndex: "id", width: 70 },
    {
      title: "Action",
      dataIndex: "action",
      width: 90,
      render: (v: string) => {
        const color: Record<string, string> = {
          GET: "blue",
          POST: "green",
          PUT: "orange",
          PATCH: "gold",
          DELETE: "red",
        };
        return <Tag color={color[v] ?? "default"}>{v}</Tag>;
      },
    },
    {
      title: "Resource",
      dataIndex: "resource",
      ellipsis: true,
      render: (resource: string, record: AuditLog) =>
        record.resourceId ? `${resource}/${record.resourceId}` : resource,
    },
    {
      title: "Status",
      dataIndex: "statusCode",
      width: 90,
      render: (v?: number) => {
        if (v === undefined) return "-";
        return <Tag color={v < 400 ? "success" : "error"}>{v}</Tag>;
      },
    },
    {
      title: "User",
      dataIndex: "userId",
      width: 90,
      render: (v?: number) => v ?? "System",
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      width: 150,
      render: (v?: string) => v ?? "-",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: 180,
      render: (v: string) => formatDateTime(v),
    },
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Audit Logs
          </Title>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form
          form={filterForm}
          layout="inline"
          onFinish={handleFilter}
          style={{ gap: 8, flexWrap: "wrap" }}
        >
          <Form.Item name="userId">
            <InputNumber placeholder="User ID" min={1} style={{ width: 120 }} />
          </Form.Item>

          <Form.Item name="action">
            <Select placeholder="Action" allowClear style={{ width: 130 }}>
              {ACTION_OPTIONS.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="resource">
            <Input placeholder="Resource" allowClear style={{ width: 200 }} />
          </Form.Item>

          <Form.Item name="statusCode">
            <InputNumber
              placeholder="Status"
              min={100}
              max={599}
              style={{ width: 120 }}
            />
          </Form.Item>

          <Form.Item name="from">
            <Input
              placeholder="From (ISO date)"
              allowClear
              style={{ width: 180 }}
            />
          </Form.Item>

          <Form.Item name="to">
            <Input placeholder="To (ISO date)" allowClear style={{ width: 180 }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                Search
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {error && <Alert type="error" title={error} style={{ marginBottom: 16 }} />}

      <Card>
        <Table<AuditLog>
          dataSource={data?.items ?? []}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 980 }}
          pagination={{
            current: query.page,
            pageSize: query.limit,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} logs`,
            onChange: (page, pageSize) =>
              setQuery((q) => ({ ...q, page, limit: pageSize })),
          }}
        />
      </Card>
    </>
  );
}
