import { Skeleton } from "@/components/common/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 px-6 py-8">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
