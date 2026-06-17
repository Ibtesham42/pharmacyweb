import { Skeleton } from "@/components/ui/skeleton";
import { CardGridSkeleton } from "@/components/public/card-skeleton";

export default function Loading() {
  return (
    <div className="container py-8">
      <Skeleton className="mb-6 h-9 w-72" />
      <CardGridSkeleton count={6} />
    </div>
  );
}
