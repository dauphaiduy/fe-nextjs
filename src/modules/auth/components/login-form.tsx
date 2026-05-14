"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Form, Input, message } from "antd";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        username: values.username,
        password: values.password,
        redirect: false,
      });
      if (result?.error) {
        const errorMessages: Record<string, string> = {
          account_inactive: "Your account is inactive. Please contact the administrator.",
          admin_only: "This portal is for admin and staff accounts only.",
          invalid_credentials: "Invalid username or password.",
        };
        message.error(errorMessages[result.error] ?? "Login failed. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" onFinish={onFinish}>
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: "Please enter your username" }]}
      >
        <Input placeholder="Enter your username" />
      </Form.Item>
      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: "Please enter your password" }]}
      >
        <Input.Password placeholder="Enter your password" />
      </Form.Item>
      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="w-full"
        >
          Login
        </Button>
      </Form.Item>
    </Form>
  );
}
