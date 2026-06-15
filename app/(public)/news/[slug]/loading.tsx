import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container max-w-3xl py-8">
      <Skeleton className="h-4 w-48" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-2/3" />
      </div>
      <Skeleton className="my-6 aspect-[16/9] w-full rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
