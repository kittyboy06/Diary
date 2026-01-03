import React from 'react';

export default function Skeleton({ className, ...props }) {
    return (
        <div
            className={`animate-pulse bg-neutral-200 dark:bg-slate-700 rounded-md ${className}`}
            {...props}
        />
    );
}
