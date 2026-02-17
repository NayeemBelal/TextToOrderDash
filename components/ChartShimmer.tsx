'use client';

export function ChartShimmer() {
  return (
    <div className="animate-pulse">
      {/* Hero Shimmer */}
      <div className="mb-8">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
        <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-3"></div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Chart Shimmer */}
      <div className="relative">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-black">
          <div className="relative">
            {/* Y-axis shimmer labels */}
            <div className="absolute left-0 top-0 flex flex-col justify-between h-[320px] pr-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`y-${i}`}
                  className="h-3 w-8 bg-gray-200 dark:bg-gray-800 rounded"
                  style={{
                    animation: `shimmer 1.5s ease-in-out ${i * 0.1}s infinite`,
                  }}
                ></div>
              ))}
            </div>

            {/* Chart bars with padding for Y-axis */}
            <div className="pl-10 pr-2">
              <div className="h-[320px] flex items-end justify-between gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t"
                    style={{
                      height: `${Math.random() * 60 + 40}%`,
                      animation: `shimmer 1.5s ease-in-out ${i * 0.1}s infinite`,
                    }}
                  ></div>
                ))}
              </div>

              {/* X-axis shimmer labels */}
              <div className="flex justify-between mt-2 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={`x-${i}`}
                    className="flex-1 h-3 bg-gray-200 dark:bg-gray-800 rounded"
                    style={{
                      animation: `shimmer 1.5s ease-in-out ${i * 0.1}s infinite`,
                    }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
