"use client";

import { Layout, Button, Space, Typography, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useUiStore } from "@/store/ui.store";
import { useAuth } from "@/hooks/useAuth";

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export default function Header() {
  const { token } = theme.useToken();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { user, logout } = useAuth();

  return (
    <AntHeader
      style={{
        padding: "0 16px",
        background: token.colorBgContainer,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Button
        type="text"
        icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={toggleSidebar}
        style={{ fontSize: 16, width: 48, height: 48 }}
      />
      <Space>
        <UserOutlined />
        <Text>{user?.name ?? user?.email ?? "User"}</Text>
        <Button type="text" icon={<LogoutOutlined />} onClick={logout} danger>
          Logout
        </Button>
      </Space>
    </AntHeader>
  );
}
