import Skeleton from './Skeleton';

export default function HistoryCardSkeleton() {
  return (
    <div className="border-l-4 border-l-gray-300 p-6 flex flex-col gap-4 dark:border-l-gray-600">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <Skeleton width="w-20" height="h-6" className="mb-2" />
        </div>
        <Skeleton width="w-6" height="h-6" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton width="w-32" height="h-3" />
        <Skeleton width="w-40" height="h-3" />
      </div>
    </div>
  );
}
