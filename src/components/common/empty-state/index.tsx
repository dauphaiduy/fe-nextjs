import { Empty } from "antd";

interface EmptyStateProps {
  description?: string;
}

export default function EmptyState({ description }: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <Empty description={description} />
    </div>
  );
}
