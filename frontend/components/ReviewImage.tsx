"use client";

import { User } from "lucide-react";
import { useState } from "react";

interface ReviewImageProps {
    src?: string;
    alt: string;
    authorName?: string;
}

export default function ReviewImage({ src, alt, authorName }: ReviewImageProps) {
    const [error, setError] = useState(false);

    if (error || !src) {
        return (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {authorName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
            onError={() => setError(true)}
        />
    );
}
