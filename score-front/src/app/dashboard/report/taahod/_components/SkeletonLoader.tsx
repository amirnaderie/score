export function SkeletonLoader() {
  return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 flex gap-x-3">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
          <div className="space-y-2 flex gap-x-3">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
  );
}