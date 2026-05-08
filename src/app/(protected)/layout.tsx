"use client";

import { Layout } from "antd";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import Content from "@/components/layout/content";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar />
      <Layout>
        <Header />
        <Content>{children}</Content>
      </Layout>
    </Layout>
  );
}
