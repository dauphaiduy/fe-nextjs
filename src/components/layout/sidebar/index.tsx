"use client";

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui.store";

const { Sider } = Layout;

const navItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
  { key: "/users", icon: <UserOutlined />, label: "Users" },
  { key: "/roles", icon: <TeamOutlined />, label: "Roles" },
  { key: "/permissions", icon: <SafetyOutlined />, label: "Permissions" },
  { key: "/audit-logs", icon: <FileTextOutlined />, label: "Audit Logs" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const selectedKey =
    navItems.find((item) => pathname.startsWith(item.key))?.key ?? "/dashboard";

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      onCollapse={(collapsed) => {
        if (collapsed !== sidebarCollapsed) toggleSidebar();
      }}
      style={{
        overflow: "auto",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          height: 32,
          margin: 16,
          background: "rgba(255,255,255,0.2)",
          borderRadius: 6,
        }}
      />
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={navItems}
        onClick={({ key }) => router.push(key)}
      />
    </Sider>
  );
}
