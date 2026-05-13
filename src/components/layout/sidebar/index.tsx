"use client";

import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  ShoppingOutlined,
} from "@ant-design/icons";
import { usePathname, useRouter } from "next/navigation";
import { useUiStore } from "@/store/ui.store";
import { useAuth } from "@/hooks/useAuth";

const { Sider } = Layout;

const navItems = [
  { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard", permission: "dashboard:read" },
  { key: "/users", icon: <UserOutlined />, label: "Users", permission: "user:read" },
  { key: "/roles", icon: <TeamOutlined />, label: "Roles", permission: "role:read" },
  { key: "/audit-logs", icon: <FileTextOutlined />, label: "Audit Logs", permission: "audit-log:read" },
  { key: "/categories", icon: <AppstoreOutlined />, label: "Categories", permission: "category:read" },
  { key: "/products", icon: <ShoppingOutlined />, label: "Products", permission: "product:read" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { hasPermission } = useAuth();

  const visibleItems = navItems.filter((item) => hasPermission(item.permission));

  const selectedKey =
    visibleItems.find((item) => pathname.startsWith(item.key))?.key ?? visibleItems[0]?.key ?? "";

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
        items={visibleItems}
        onClick={({ key }) => router.push(key)}
      />
    </Sider>
  );
}
