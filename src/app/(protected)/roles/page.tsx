"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Tree,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { roleService } from "@/services/role.service";
import { permissionsService } from "@/services/permissions.service";
import type { Role, CreateRoleRequest, UpdateRoleRequest } from "@/types/role";
import type { Permissions } from "@/modules/permissions/types";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/helpers";

const { Title } = Typography;

type TreeNode = { title: React.ReactNode; key: string; children?: TreeNode[] };

// Custom controlled wrapper so antd Form can manage checked keys
function PermissionTree({
  value = [],
  onChange,
  treeData,
}: {
  value?: string[];
  onChange?: (v: string[]) => void;
  treeData: TreeNode[];
}) {
  const allLeafKeys = treeData.flatMap(
    (g) => (g.children ?? []).map((c) => c.key),
  );

  const handleCheck = (
    checked: { checked: React.Key[]; halfChecked: React.Key[] } | React.Key[],
  ) => {
    const keys = Array.isArray(checked) ? checked : checked.checked;
    onChange?.(
      keys.filter((k) => !String(k).startsWith("group:")).map(String),
    );
  };

  return (
    <div
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: 6,
        padding: "8px 12px",
        maxHeight: 280,
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <a
          onClick={() =>
            onChange?.(allLeafKeys)
          }
          style={{ marginRight: 12, fontSize: 12 }}
        >
          Select all
        </a>
        <a onClick={() => onChange?.([])} style={{ fontSize: 12 }}>
          Clear
        </a>
      </div>
      <Tree
        checkable
        checkStrictly={false}
        treeData={treeData}
        checkedKeys={value}
        onCheck={handleCheck}
        selectable={false}
        defaultExpandAll
      />
    </div>
  );
}

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allPermissions, setAllPermissions] = useState<Permissions>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await roleService.list();
      setRoles(res.data);
    } catch {
      setError("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [rolesRes, permsRes] = await Promise.all([
          roleService.list(),
          permissionsService.list(),
        ]);
        if (!cancelled) {
          setRoles(rolesRes.data);
          setAllPermissions(permsRes.data);
        }
      } catch {
        if (!cancelled) setError("Failed to load roles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditTarget(role);
    setModalOpen(true);
  };

  const handleSubmit = async (values: CreateRoleRequest) => {
    setSubmitting(true);
    try {
      if (editTarget) {
        const body: UpdateRoleRequest = {
          name: values.name,
          description: values.description,
          permissions: values.permissions,
        };
        await roleService.update(editTarget.id, body);
        messageApi.success("Role updated successfully.");
      } else {
        await roleService.create(values);
        messageApi.success("Role created successfully.");
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Operation failed.";
      messageApi.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await roleService.delete(id);
      messageApi.success("Role deleted.");
      fetchRoles();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Delete failed.";
      messageApi.error(msg);
    }
  };

  // Build tree data grouped by permission prefix (user, role, audit-log, etc.)
  const permissionTreeData = (() => {
    const groups: Record<string, { key: string; label: string }[]> = {};
    Object.entries(allPermissions).forEach(([key, label]) => {
      const prefix = key.split(":")[0];
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push({ key, label });
    });
    return Object.entries(groups).map(([prefix, items]) => ({
      title: <strong style={{ textTransform: "capitalize" }}>{prefix}</strong>,
      key: `group:${prefix}`,
      children: items.map(({ key, label }) => ({
        title: (
          <span>
            <Tag style={{ marginRight: 6 }}>{key}</Tag>
            <span style={{ color: "#555" }}>{label}</span>
          </span>
        ),
        key,
      })),
    }));
  })();

  const columns: ColumnsType<Role> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Name", dataIndex: "name" },
    {
      title: "Description",
      dataIndex: "description",
      render: (v?: string) => v ?? "—",
      ellipsis: true,
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      render: (perms: string[] = []) =>
        perms.length === 0 ? (
          "—"
        ) : perms.includes("*") ? (
          <Tag color="gold">superadmin (*)</Tag>
        ) : (
          <Space size={[4, 4]} wrap>
            {perms.map((p) => (
              <Tag key={p}>{p}</Tag>
            ))}
          </Space>
        ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: 130,
      render: (v: string) => formatDate(v),
    },
    ...(
      hasPermission("role:update") || hasPermission("role:delete")
        ? [
            {
              title: "",
              key: "actions",
              width: 90,
              render: (_: unknown, record: Role) => (
                <Space>
                  {hasPermission("role:update") && (
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(record)}
                    />
                  )}
                  {hasPermission("role:delete") && (
                    <Popconfirm
                      title="Delete this role?"
                      description="This cannot be undone."
                      okText="Delete"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => handleDelete(record.id)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]
        : []
    ),
  ];

  return (
    <>
      {contextHolder}

      {/* Page header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Roles
          </Title>
        </Col>
        {hasPermission("role:create") && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Role
            </Button>
          </Col>
        )}
      </Row>

      {error && (
        <Alert type="error" title={error} style={{ marginBottom: 16 }} />
      )}

      <Card>
        <Table<Role>
          dataSource={roles}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ showSizeChanger: true, showTotal: (t) => `Total ${t} roles` }}
          scroll={{ x: 700 }}
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        title={editTarget ? "Edit Role" : "Create Role"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editTarget ? "Update" : "Create"}
        confirmLoading={submitting}
        width={560}
        afterOpenChange={(open) => {
          if (!open) return;
          if (editTarget) {
            form.setFieldsValue({
              name: editTarget.name,
              description: editTarget.description,
              permissions: editTarget.permissions ?? [],
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
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="Permissions"
            rules={[{ required: true, message: "At least one permission is required" }]}
          >
            <PermissionTree treeData={permissionTreeData} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

