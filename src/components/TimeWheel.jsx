import React, { useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';

export default function TimeWheel({ value, max, onChange, color = 'indigo' }) {
    const constraintsRef = useRef(null);
    const centerRef = useRef(null);

    const handlePointerDown = (event) => {
        handleRotate(event);
    };

    const handlePointerMove = (event) => {
        if (event.buttons === 1) { // Only if primary button is pressed
            handleRotate(event);
        }
    };

    const handleRotate = (event) => {
        if (!centerRef.current) return;

        const rect = centerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle
        // event.clientX might be touches[0].clientX if touch event
        const clientX = event.clientX || (event.touches ? event.touches[0].clientX : 0);
        const clientY = event.clientY || (event.touches ? event.touches[0].clientY : 0);

        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        // Angle in radians (top is -PI/2 in standard atan2, but we want 0 at top)
        // Standard atan2: 0 is Right, PI/2 is Bottom, PI is Left, -PI/2 is Top
        // We want Top = 0.
        // Rotation = atan2(y, x) + 90deg works.

        let angleRad = Math.atan2(deltaY, deltaX);
        let angleDeg = angleRad * (180 / Math.PI) + 90;

        // Normalize to 0-360
        if (angleDeg < 0) angleDeg += 360;

        // Map to value
        // 360 deg = max value
        // val = (angle / 360) * max
        let val = Math.round((angleDeg / 360) * max);
        if (val === max) val = 0; // Wrap 12/24/60 to 0 if needed, or handle differently

        onChange(val);
    };

    // Calculate rotation for current value for the visual hand
    const rotation = (value / max) * 360;

    return (
        <div
            className="relative w-48 h-48 md:w-56 md:h-56 mx-auto touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            ref={centerRef}
        >
            {/* Clock Face Background */}
            <div className="absolute inset-0 rounded-full bg-neutral-100 dark:bg-slate-800 shadow-inner border border-neutral-200 dark:border-slate-700" />

            {/* Numbers/Ticks (Optional, simplified for now) */}
            {[...Array(12)].map((_, i) => {
                const deg = i * 30;
                const isMain = i % 3 === 0;
                return (
                    <div
                        key={i}
                        className="absolute w-full h-full flex justify-center pt-2 pointer-events-none"
                        style={{ transform: `rotate(${deg}deg)` }}
                    >
                        <div className={`w-0.5 ${isMain ? 'h-3 bg-neutral-400' : 'h-1.5 bg-neutral-300'} rounded-full`} />
                    </div>
                );
            })}

            {/* Clock Hand Container - Rotates */}
            <motion.div
                className="absolute inset-0 flex justify-center"
                animate={{ rotate: rotation }}
                transition={{ type: "spring", stiffness: 150, damping: 20 }}
            >
                {/* The Hand */}
                <div className="h-[50%] w-1 bg-gradient-to-t from-transparent via-indigo-500 to-indigo-600 origin-bottom relative top-0 rounded-full">
                    {/* Knob at tip */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-900 border-4 border-indigo-500 rounded-full shadow-lg" />
                </div>
            </motion.div>

            {/* Center Pivot */}
            <div className="absolute inset-0 m-auto w-3 h-3 bg-indigo-500 rounded-full shadow-lg" />

            {/* Display Value in Middle (Optional aesthetic) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-12 opacity-20">
                <span className="text-4xl font-bold">{value}</span>
            </div>
        </div>
    );
}
