"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
  Spin,
  Alert,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { dashboardService } from "@/services/dashboard.service";
import type { AuditLog, DashboardSummary, UserTrend } from "@/types/api";
import { formatDateTime } from "@/utils/helpers";

const { Title } = Typography;

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [userTrend, setUserTrend] = useState<UserTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [summaryRes, logsRes, trendRes] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getRecentLogs(10),
          dashboardService.getUserTrend(7),
        ]);
        setSummary(summaryRes.data);
        setRecentLogs(logsRes.data);
        setUserTrend(trendRes.data);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const logColumns: ColumnsType<AuditLog> = [
    {
      title: "Action",
      dataIndex: "action",
      width: 80,
      render: (v: string) => {
        const color: Record<string, string> = {
          GET: "blue",
          POST: "green",
          PATCH: "orange",
          PUT: "orange",
          DELETE: "red",
        };
        return <Tag color={color[v] ?? "default"}>{v}</Tag>;
      },
    },
    { title: "Resource", dataIndex: "resource", ellipsis: true },
    {
      title: "Status",
      dataIndex: "statusCode",
      width: 80,
      render: (v: number) => (
        <Tag color={v < 400 ? "success" : "error"}>{v}</Tag>
      ),
    },
    {
      title: "IP",
      dataIndex: "ipAddress",
      width: 130,
      render: (v?: string) => v ?? "—",
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      width: 160,
      render: (v: string) => formatDateTime(v),
    },
  ];

  const maxCount = Math.max(...(userTrend.map((d) => d.count) || [1]), 1);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert type="error" title={error} />;
  }

  return (
    <>
      <Title level={4} style={{ marginBottom: 24 }}>
        Dashboard
      </Title>

      {/* Summary Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={summary?.totalUsers}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active Users"
              value={summary?.activeUsers}
              styles={{ content: { color: "#3f8600" } }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Inactive Users"
              value={summary?.inactiveUsers}
              styles={{ content: { color: "#cf1322" } }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card>
            <Statistic
              title="Total Roles"
              value={summary?.totalRoles}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <Card>
            <Statistic
              title="Total Audit Logs"
              value={summary?.totalAuditLogs}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* User Trend Chart */}
      <Card title="User Registrations (Last 7 Days)" style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            height: 140,
            paddingBottom: 24,
          }}
        >
          {userTrend.map((d) => (
            <Tooltip
              key={d.date}
              title={`${d.date}: ${d.count} registration${d.count !== 1 ? "s" : ""}`}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11, color: "#888" }}>{d.count}</span>
                <div
                  style={{
                    width: "100%",
                    height: Math.max(4, (d.count / maxCount) * 100),
                    background: "#1677ff",
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: 11, color: "#888" }}>
                  {d.date.slice(5)}
                </span>
              </div>
            </Tooltip>
          ))}
        </div>
      </Card>

      {/* Recent Audit Logs */}
      <Card title="Recent Activity" style={{ marginTop: 24 }}>
        <Table<AuditLog>
          dataSource={recentLogs}
          columns={logColumns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      </Card>
    </>
  );
}

