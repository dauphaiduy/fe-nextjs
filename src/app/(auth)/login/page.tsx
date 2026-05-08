import LoginForm from "@/modules/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold">Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}
