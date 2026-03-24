import Skeleton from './Skeleton';

export default function TransactionCardSkeleton() {
  return (
    <div className="border-l-4 border-l-gray-300 p-6 flex flex-col gap-4 dark:border-l-gray-600">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <Skeleton width="w-32" height="h-4" className="mb-2" />
          <Skeleton width="w-40" height="h-3" />
        </div>
        <Skeleton width="w-6" height="h-6" />
      </div>
      <div className="h-px bg-gray-300 opacity-30 dark:bg-gray-600"></div>
      <div>
        <Skeleton width="w-32" height="h-3" className="mb-2" />
        <Skeleton width="w-full" height="h-10" />
      </div>
    </div>
  );
}
