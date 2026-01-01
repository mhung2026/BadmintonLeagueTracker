import "./Skeleton.css";

export function SkeletonRow({ columns = 4 }) {
    return (
        <div className="skeleton-row">
            {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="skeleton-cell" />
            ))}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="skeleton-card">
            <div className="skeleton-header" />
            <div className="skeleton-body">
                <div className="skeleton-line skeleton-line-long" />
                <div className="skeleton-line skeleton-line-medium" />
                <div className="skeleton-line skeleton-line-short" />
            </div>
        </div>
    );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
    return (
        <div className="skeleton-table">
            <div className="skeleton-table-header">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="skeleton-header-cell" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} columns={columns} />
            ))}
        </div>
    );
}

export function SkeletonRanking({ count = 5 }) {
    return (
        <div className="skeleton-ranking">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="skeleton-ranking-item">
                    <div className="skeleton-rank" />
                    <div className="skeleton-avatar" />
                    <div className="skeleton-name" />
                    <div className="skeleton-points" />
                </div>
            ))}
        </div>
    );
}
