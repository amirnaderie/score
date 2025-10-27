export function SkeletonLoader() {
  return (
    <div className="space-y-6">
      {/* Skeleton for multiple account type sections */}
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          {/* Account Type Header Skeleton */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-6 animate-pulse mx-auto"></div>
          
          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 flex gap-x-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
            <div className="space-y-2 flex gap-x-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}