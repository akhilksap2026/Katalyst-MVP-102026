// ksap-allow: documentation examples use source terminology, not product strings.
import { Skeleton } from "../../components/ui/skeleton";

export default function SkeletonStory() {
  return <div className="ksap-story">
    <p className="text-caption text-muted-foreground">Skeleton shimmer stops under reduced motion, which is handled globally.</p>
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="flex flex-col gap-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-32" /></div>
    </div>
    <div className="flex flex-col gap-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
  </div>;
}
