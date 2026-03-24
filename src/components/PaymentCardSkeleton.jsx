import Skeleton from './Skeleton';

export default function PaymentCardSkeleton() {
  return (
    <div className="border-l-4 border-l-gray-300 p-6 flex flex-col gap-4 dark:border-l-gray-600">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <Skeleton width="w-32" height="h-4" className="mb-2" />
        </div>
        <Skeleton width="w-16" height="h-6" />
      </div>
      <div className="h-px bg-gray-300 opacity-30 dark:bg-gray-600"></div>
      <div>
        <Skeleton width="w-24" height="h-3" className="mb-3" />
        <div className="flex gap-2">
          <Skeleton width="w-20" height="h-8" />
          <Skeleton width="w-20" height="h-8" />
          <Skeleton width="w-20" height="h-8" />
        </div>
      </div>
    </div>
  );
}
