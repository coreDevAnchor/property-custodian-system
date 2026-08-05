import { useEffect, useId, useState } from 'react';

export default function ThemeToggle() {
    const [dark, setDark] = useState(false);
    const maskId = useId();

    useEffect(() => {
        const appearance = localStorage.getItem('appearance') ?? 'light';

        setDark(appearance === 'dark');

        document.documentElement.classList.toggle('dark', appearance === 'dark');
    }, []);

    const toggle = () => {
        const next = !dark;

        setDark(next);

        localStorage.setItem('appearance', next ? 'dark' : 'light');

        document.documentElement.classList.toggle('dark', next);
    };

    return (
        <button
            onClick={toggle}
            className="relative h-9 w-full rounded-full border hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
            <span
                className="absolute top-1/2 -translate-y-1/2"
                style={{
                    left: dark ? 'calc(100% - 1.75rem)' : '0.5rem',
                    transition: 'left 500ms ease-in-out',
                }}
            >
                <svg viewBox="0 0 24 24" width={20} height={20}>
                    <mask id={maskId}>
                        <rect x="0" y="0" width="24" height="24" fill="white" />
                        <circle
                            cx={dark ? '16' : '32'}
                            cy="9"
                            r="6"
                            fill="black"
                            style={{ transition: 'cx 500ms ease-in-out' }}
                        />
                    </mask>

                    {/* rays — retract as it becomes the moon */}
                    <g
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{
                            transition: 'opacity 300ms ease-in-out, transform 500ms ease-in-out',
                            opacity: dark ? 0 : 1,
                            transformOrigin: '12px 12px',
                            transform: dark ? 'scale(0.5)' : 'scale(1)',
                        }}
                    >
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
                        <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
                        <line x1="4.2" y1="19.8" x2="5.6" y2="18.4" />
                        <line x1="18.4" y1="5.6" x2="19.8" y2="4.2" />
                    </g>

                    {/* body — carved into a crescent by the mask when dark, grows larger as moon */}
                    <circle
                        cx="12"
                        cy="12"
                        r={dark ? '7.5' : '5'}
                        fill="currentColor"
                        mask={`url(#${maskId})`}
                        style={{ transition: 'r 500ms ease-in-out' }}
                    />
                </svg>
            </span>
        </button>
    );
}