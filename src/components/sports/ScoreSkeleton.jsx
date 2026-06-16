/**
 * ScoreSkeleton — animated loading skeleton for sports cards.
 * Renders `count` skeleton placeholders while data is being fetched.
 */

export default function ScoreSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="sports-glass-card p-4 space-y-3 animate-pulse"
          aria-hidden="true"
        >
          {/* Header row: badge + status */}
          <div className="flex justify-between items-center">
            <div className="h-5 w-16 bg-white/10 rounded-full" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>

          {/* Teams */}
          <div className="space-y-3 py-2">
            {[0, 1].map(t => (
              <div key={t} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-white/10" />
                  <div className="h-4 w-28 bg-white/10 rounded" />
                </div>
                <div className="h-5 w-16 bg-white/10 rounded" />
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-between pt-1">
            <div className="h-3 w-32 bg-white/10 rounded" />
            <div className="h-3 w-16 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
