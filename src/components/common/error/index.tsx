import { Result } from "antd";

interface ErrorProps {
  message?: string;
}

export default function ErrorState({ message }: ErrorProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <Result status="error" title="Something went wrong" subTitle={message} />
    </div>
  );
}
