"use client";

import { Layout, theme } from "antd";

const { Content: AntContent } = Layout;

export default function Content({ children }: { children: React.ReactNode }) {
  const { token } = theme.useToken();

  return (
    <AntContent
      style={{
        margin: 24,
        padding: 24,
        minHeight: 280,
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        overflow: "auto",
      }}
    >
      {children}
    </AntContent>
  );
}
