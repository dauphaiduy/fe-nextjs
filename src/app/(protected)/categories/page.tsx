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
  Popconfirm,
  Row,
  Space,
  Table,
  Typography,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { categoryService } from "@/services/category.service";
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/helpers";

const { Title } = Typography;

export default function CategoriesPage() {
  const { hasPermission } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchCategories = useCallback(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await categoryService.list();
        if (!cancelled) setData(res.data as unknown as Category[]);
      } catch {
        if (!cancelled) setError("Failed to load categories.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cancel = fetchCategories();
    return cancel;
  }, [fetchCategories]);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditTarget(category);
    setModalOpen(true);
  };

  const handleSubmit = async (values: CreateCategoryRequest) => {
    setSubmitting(true);
    try {
      if (editTarget) {
        const body: UpdateCategoryRequest = {
          name: values.name,
          description: values.description,
        };
        await categoryService.update(editTarget.id, body);
        messageApi.success("Category updated successfully.");
      } else {
        await categoryService.create(values);
        messageApi.success("Category created successfully.");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Operation failed.";
      messageApi.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await categoryService.delete(id);
      messageApi.success("Category deleted.");
      fetchCategories();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Delete failed.";
      messageApi.error(msg);
    }
  };

  const columns: ColumnsType<Category> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Name", dataIndex: "name", ellipsis: true },
    {
      title: "Description",
      dataIndex: "description",
      ellipsis: true,
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: 160,
      render: (v: string) => formatDate(v),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      width: 160,
      render: (v: string) => formatDate(v),
    },
    ...((hasPermission("category:update") || hasPermission("category:delete"))
      ? [
          {
            title: "",
            key: "actions",
            width: 100,
            render: (_: unknown, record: Category) => (
              <Space>
                {hasPermission("category:update") && (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record)}
                  />
                )}
                {hasPermission("category:delete") && (
                  <Popconfirm
                    title="Delete category?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDelete(record.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                  >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      {contextHolder}

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            Categories
          </Title>
        </Col>
        {hasPermission("category:create") && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Category
            </Button>
          </Col>
        )}
      </Row>

      {error && (
        <Alert type="error" message={error} style={{ marginBottom: 16 }} />
      )}

      <Card>
        <Table<Category>
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `Total ${t} categories` }}
        />
      </Card>

      <Modal
        title={editTarget ? "Edit Category" : "Create Category"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editTarget ? "Update" : "Create"}
        confirmLoading={submitting}
        width={480}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (!open) return;
          if (editTarget) {
            form.setFieldsValue({
              name: editTarget.name,
              description: editTarget.description,
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
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
