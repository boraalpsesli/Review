import React from 'react';

type LogoProps = {
    className?: string;
    size?: number;
    withText?: boolean;
};

export default function Logo({ className = "", size = 32, withText = false }: LogoProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-primary"
            >
                <defs>
                    <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c084fc" /> {/* Purple-400 */}
                        <stop offset="100%" stopColor="#db2777" /> {/* Pink-600 */}
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Main Background Shape - Soft Rounded Rect */}
                <rect
                    x="5"
                    y="5"
                    width="90"
                    height="90"
                    rx="22"
                    fill="url(#logo-gradient)"
                    fillOpacity="0.1"
                    stroke="url(#logo-gradient)"
                    strokeWidth="2"
                />

                {/* Speech Bubble Shape */}
                <path
                    d="M50 20C33.4315 20 20 31.1929 20 45C20 54.1784 26.2489 62.3333 35.797 66.5205L32 78L44.8291 71.1895C46.5057 71.4552 48.2325 71.6 50 71.6C66.5685 71.6 80 60.4071 80 46.6C80 32.7929 66.5685 20 50 20Z"
                    stroke="url(#logo-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                />

                {/* Star */}
                <path
                    d="M50 28L52.5 35H60L54 39.5L56 47L50 42.5L44 47L46 39.5L40 35H47.5L50 28Z"
                    fill="url(#logo-gradient)"
                />

                {/* Chart Lines */}
                <path
                    d="M35 58V50M45 58V45M55 58V40M65 58V32"
                    stroke="url(#logo-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                />

                {/* Upward Arrow for Trend */}
                <path
                    d="M35 50L45 45L55 40L65 32"
                    stroke="url(#logo-gradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeOpacity="0.5"
                />
            </svg>
            {withText && (
                <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Insight<span className="text-white">Flow</span>
                </span>
            )}
        </div>
    );
}
