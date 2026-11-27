import { useState } from 'react';
import { Film } from 'lucide-react';
import { POSTER_ASSETS, resolvePosterSrc } from '../lib/posters';
import type { PosterKey } from '../types/anime';

interface PosterImageProps {
  posterKey: PosterKey;
  posterUrl?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function PosterImage({
  posterKey,
  posterUrl,
  alt,
  className = '',
  priority = false,
}: PosterImageProps) {
  const initialSrc = resolvePosterSrc(posterKey, posterUrl);
  const fallbackAsset = POSTER_ASSETS[posterKey];
  const [src, setSrc] = useState(initialSrc);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (src !== fallbackAsset) {
      setSrc(fallbackAsset);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 p-4 text-center ${className}`}
        aria-label={alt}
      >
        <Film className="w-7 h-7 mb-2 text-zinc-500" aria-hidden="true" />
        <span className="text-xs font-medium text-zinc-300 line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={handleError}
      className={className}
    />
  );
}
