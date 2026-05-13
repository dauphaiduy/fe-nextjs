"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { userService } from "@/services/user.service";
import { roleService } from "@/services/role.service";
import type { User, CreateUserRequest, UpdateUserRequest, UserListQuery } from "@/types/user";
import type { Role } from "@/types/role";
import type { PaginatedData } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/helpers";

const { Title } = Typography;
const { Option } = Select;

const ACCOUNT_TYPES = ["LOCAL", "GOOGLE", "GITHUB"] as const;

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();

  // Table state
  const [data, setData] = useState<PaginatedData<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<UserListQuery>({ page: 1, limit: 10 });

  // Roles for dropdown
  const [roles, setRoles] = useState<Role[]>([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  const fetchUsers = useCallback(async (q: UserListQuery) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.list(q);
      setData(res.data);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userService.list(query);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setError("Failed to load users.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    roleService.list().then((r) => { if (!cancelled) setRoles(r.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [query]);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditTarget(user);
    setModalOpen(true);
  };

  const handleSubmit = async (values: CreateUserRequest & { isActive?: boolean }) => {
    setSubmitting(true);
    try {
      if (editTarget) {
        const { ...updateValues } = values;
        const body: UpdateUserRequest = {
          email: updateValues.email,
          username: updateValues.username,
          name: updateValues.name,
          accountType: updateValues.accountType,
          roleId: updateValues.roleId,
          isActive: updateValues.isActive ?? editTarget.isActive,
        };
        if (updateValues.password) body.password = updateValues.password;
        await userService.update(editTarget.id, body);
        messageApi.success("User updated successfully.");
      } else {
        await userService.create(values);
        messageApi.success("User created successfully.");
      }
      setModalOpen(false);
      fetchUsers(query);
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? "Operation failed.";
      messageApi.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilter = (values: UserListQuery) => {
    const next: UserListQuery = { ...values, page: 1, limit: query.limit };
    setQuery(next);
  };

  const handleReset = () => {
    filterForm.resetFields();
    setQuery({ page: 1, limit: 10 });
  };

  const columns: ColumnsType<User> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Email", dataIndex: "email", ellipsis: true },
    {
      title: "Username",
      dataIndex: "username",
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Name",
      dataIndex: "name",
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      width: 90,
      render: (v: boolean) => (
        <Tag color={v ? "success" : "error"}>{v ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Account",
      dataIndex: "accountType",
      width: 90,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Role",
      dataIndex: "roleId",
      width: 110,
      render: (id: number) =>
        roles.find((r) => r.id === id)?.name ?? String(id),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: 130,
      render: (v: string) => formatDate(v),
    },
    ...(hasPermission("user:update")
      ? [
          {
            title: "",
            key: "actions",
            width: 60,
            render: (_: unknown, record: User) => (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {contextHolder}

      {/* Page header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Users
          </Title>
        </Col>
        {hasPermission("user:create") && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add User
            </Button>
          </Col>
        )}
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={filterForm}
          layout="inline"
          onFinish={handleFilter}
          style={{ gap: 8, flexWrap: "wrap" }}
        >
          <Form.Item name="email">
            <Input placeholder="Email" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="username">
            <Input placeholder="Username" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="name">
            <Input placeholder="Name" allowClear style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="accountType">
            <Select placeholder="Account type" allowClear style={{ width: 140 }}>
              {ACCOUNT_TYPES.map((t) => (
                <Option key={t} value={t}>
                  {t}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="roleId">
            <Select placeholder="Role" allowClear style={{ width: 130 }}>
              {roles.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="isActive">
            <Select placeholder="Status" allowClear style={{ width: 110 }}>
              <Option value={true}>Active</Option>
              <Option value={false}>Inactive</Option>
            </Select>
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

      {error && (
        <Alert type="error" title={error} style={{ marginBottom: 16 }} />
      )}

      {/* Table */}
      <Card>
        <Table<User>
          dataSource={data?.items ?? []}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            current: query.page,
            pageSize: query.limit,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} users`,
            onChange: (page, pageSize) =>
              setQuery((q) => ({ ...q, page, limit: pageSize })),
          }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editTarget ? "Edit User" : "Create User"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editTarget ? "Update" : "Create"}
        confirmLoading={submitting}
        width={520}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (!open) return;
          if (editTarget) {
            form.setFieldsValue({
              email: editTarget.email,
              username: editTarget.username,
              name: editTarget.name,
              accountType: editTarget.accountType,
              roleId: editTarget.roleId,
              isActive: editTarget.isActive,
            });
          } else {
            form.resetFields();
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="username" label="Username">
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Full Name">
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label={editTarget ? "New Password (leave blank to keep)" : "Password"}
            rules={
              editTarget
                ? []
                : [{ required: true, message: "Password is required" }]
            }
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="accountType"
            label="Account Type"
            rules={[{ required: true, message: "Account type is required" }]}
            initialValue="LOCAL"
          >
            <Select>
              {ACCOUNT_TYPES.map((t) => (
                <Option key={t} value={t}>
                  {t}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="roleId"
            label="Role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select placeholder="Select a role">
              {roles.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {editTarget && (
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}
