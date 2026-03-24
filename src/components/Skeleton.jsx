export default function Skeleton({ width = 'w-full', height = 'h-4', className = '' }) {
  return (
    <div className={`${width} ${height} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse rounded ${className}`}
      style={{
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite'
      }}
    />
  );
}
