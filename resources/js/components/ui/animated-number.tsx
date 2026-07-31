import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
    from: number;
    to: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
}

export function AnimatedNumber({
    from,
    to,
    duration = 1000,
    decimals = 0,
    prefix = "",
    suffix = "",
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(from);

    const animationFrame = useRef<number | null>(null);

    useEffect(() => {
        const start = from;
        const end = to;

        const startTime = performance.now();

        function animate(now: number) {
            const progress = Math.min((now - startTime) / duration, 1);

            const value = start + (end - start) * progress;

            setDisplayValue(value);

            if (progress < 1) {
                animationFrame.current = requestAnimationFrame(animate);
            }
        }

        animationFrame.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrame.current) {
                cancelAnimationFrame(animationFrame.current);
            }
        };
    }, [from, to, duration]);

    return (
        <>
            {prefix}
            {displayValue.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
            })}
            {suffix}
        </>
    );
}