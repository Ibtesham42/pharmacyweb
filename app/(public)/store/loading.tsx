import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/public/card-skeleton";

export default function Loading() {
  return (
    <div className="container py-8">
      <Skeleton className="mb-6 h-9 w-64" />
      <Skeleton className="mb-6 h-9 w-full max-w-lg" />
      <CardGridSkeleton count={8} />
    </div>
  );
}
