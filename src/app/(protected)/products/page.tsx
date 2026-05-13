"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadFile, UploadProps } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { productService } from "@/services/product.service";
import { categoryService } from "@/services/category.service";
import type { Product, CreateProductRequest, UpdateProductRequest, ProductListQuery, ProductStatus } from "@/types/product";
import type { Category } from "@/types/category";
import type { PaginatedData } from "@/types/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/utils/helpers";
import { uploadFile } from "@/utils/upload";

const { Title } = Typography;
const { Option } = Select;

const PRODUCT_STATUSES: ProductStatus[] = ["ACTIVE", "INACTIVE"];

export default function ProductsPage() {
  const { hasPermission } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();

  const [data, setData] = useState<PaginatedData<Product> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<ProductListQuery>({ page: 1, limit: 10 });

  const [categories, setCategories] = useState<Category[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const [filterForm] = Form.useForm();

  const fetchProducts = useCallback((q: ProductListQuery) => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productService.list(q);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setError("Failed to load products.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const cancel = fetchProducts(query);
    return cancel;
  }, [query, fetchProducts]);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .list()
      .then((r) => {
        if (!cancelled) setCategories(r.data as unknown as Category[]);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditTarget(product);
    setModalOpen(true);
  };

  const handleSubmit = async (values: CreateProductRequest) => {
    setSubmitting(true);
    try {
      const images = fileList
        .filter((f) => f.status === "done" && f.url)
        .map((f) => f.url as string);

      if (editTarget) {
        const body: UpdateProductRequest = {
          name: values.name,
          description: values.description,
          price: values.price,
          stock: values.stock,
          status: values.status,
          images,
          categoryId: values.categoryId,
        };
        await productService.update(editTarget.id, body);
        messageApi.success("Product updated successfully.");
      } else {
        await productService.create({ ...values, images });
        messageApi.success("Product created successfully.");
      }
      setModalOpen(false);
      setFileList([]);
      fetchProducts(query);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Operation failed.";
      messageApi.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;
    try {
      onProgress?.({ percent: 30 });
      const url = await uploadFile(file as File, "products");
      onProgress?.({ percent: 100 });
      onSuccess?.(url);
      setFileList((prev) =>
        prev.map((f) =>
          f.uid === (file as File & { uid?: string }).uid
            ? { ...f, status: "done", url }
            : f,
        ),
      );
    } catch (err) {
      onError?.(err as Error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await productService.delete(id);
      messageApi.success("Product deleted.");
      fetchProducts(query);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Delete failed.";
      messageApi.error(msg);
    }
  };

  const handleFilter = (values: ProductListQuery) => {
    setQuery({ ...values, page: 1, limit: query.limit });
  };

  const handleReset = () => {
    filterForm.resetFields();
    setQuery({ page: 1, limit: 10 });
  };

  const columns: ColumnsType<Product> = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "Image",
      dataIndex: "images",
      width: 80,
      render: (images: string[]) =>
        images?.[0] ? (
          <Image
            src={images[0]}
            alt="product"
            width={48}
            height={48}
            style={{ objectFit: "cover", borderRadius: 4 }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              background: "#f0f0f0",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              color: "#999",
            }}
          >
            No img
          </div>
        ),
    },
    { title: "Name", dataIndex: "name", ellipsis: true },
    {
      title: "Price",
      dataIndex: "price",
      width: 110,
      render: (v: string) => `$${parseFloat(v).toFixed(2)}`,
    },
    { title: "Stock", dataIndex: "stock", width: 80 },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (v: ProductStatus) => (
        <Tag color={v === "ACTIVE" ? "success" : "error"}>{v}</Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "categoryId",
      width: 140,
      render: (_: number, record: Product) =>
        record.category?.name ??
        categories.find((c) => c.id === record.categoryId)?.name ??
        String(record.categoryId),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      width: 140,
      render: (v: string) => formatDate(v),
    },
    ...((hasPermission("product:update") || hasPermission("product:delete"))
      ? [
          {
            title: "",
            key: "actions",
            width: 100,
            render: (_: unknown, record: Product) => (
              <Space>
                {hasPermission("product:update") && (
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(record)}
                  />
                )}
                {hasPermission("product:delete") && (
                  <Popconfirm
                    title="Delete product?"
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
            Products
          </Title>
        </Col>
        {hasPermission("product:create") && (
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Add Product
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
          <Form.Item name="name">
            <Input placeholder="Name" allowClear style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="Status" allowClear style={{ width: 130 }}>
              {PRODUCT_STATUSES.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="categoryId">
            <Select placeholder="Category" allowClear style={{ width: 150 }}>
              {categories.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.name}
                </Option>
              ))}
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
        <Alert type="error" message={error} style={{ marginBottom: 16 }} />
      )}

      <Card>
        <Table<Product>
          dataSource={data?.items ?? []}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: query.page,
            pageSize: query.limit,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
            onChange: (page, pageSize) =>
              setQuery((q) => ({ ...q, page, limit: pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editTarget ? "Edit Product" : "Create Product"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText={editTarget ? "Update" : "Create"}
        confirmLoading={submitting}
        width={560}
        destroyOnHidden
        afterOpenChange={(open) => {
          if (!open) return;
          if (editTarget) {
            form.setFieldsValue({
              name: editTarget.name,
              description: editTarget.description,
              price: parseFloat(editTarget.price),
              stock: editTarget.stock,
              status: editTarget.status,
              categoryId: editTarget.categoryId,
            });
            setFileList(
              editTarget.images.map((url, i) => ({
                uid: String(-i - 1),
                name: url.split("/").pop() ?? `image-${i + 1}`,
                status: "done",
                url,
              })),
            );
          } else {
            form.resetFields();
            setFileList([]);
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: "Price is required" }]}
              >
                <InputNumber min={0} style={{ width: "100%" }} prefix="$" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stock" label="Stock" initialValue={0}>
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                initialValue="ACTIVE"
                rules={[{ required: true, message: "Status is required" }]}
              >
                <Select>
                  {PRODUCT_STATUSES.map((s) => (
                    <Option key={s} value={s}>
                      {s}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="categoryId"
                label="Category"
                rules={[{ required: true, message: "Category is required" }]}
              >
                <Select placeholder="Select a category">
                  {categories.map((c) => (
                    <Option key={c.id} value={c.id}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Images">
            <Upload
              listType="picture-card"
              fileList={fileList}
              customRequest={handleUpload}
              onChange={({ fileList: next }) => setFileList(next)}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
              }}
              accept="image/*"
              multiple
            >
              <button type="button" style={{ border: 0, background: "none", cursor: "pointer" }}>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
