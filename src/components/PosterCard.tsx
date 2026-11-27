import { Bookmark, Check } from 'lucide-react';
import { PosterImage } from './PosterImage';
import type { AnimeSearchResult } from '../types/anime';

interface PosterCardProps {
  item: AnimeSearchResult;
  inWatchlist: boolean;
  lastEpisode?: number;
  onSelect: (item: AnimeSearchResult) => void;
  onToggleWatchlist: (item: AnimeSearchResult) => void;
}

function formatTvType(type: AnimeSearchResult['tvType']): string {
  if (type === 'AnimeMovie') return 'Película';
  if (type === 'OVA') return 'OVA';
  return 'Serie';
}

export function PosterCard({
  item,
  inWatchlist,
  lastEpisode,
  onSelect,
  onToggleWatchlist,
}: PosterCardProps) {
  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 transition-transform duration-200 group-hover:-translate-y-0.5">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="block w-full h-full text-left cursor-pointer"
          aria-label={`Ver detalles de ${item.title}`}
        >
          <PosterImage
            posterKey={item.posterKey}
            posterUrl={item.posterUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity"
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(item);
          }}
          aria-label={inWatchlist ? `Quitar ${item.title} de Mi Lista` : `Guardar ${item.title} en Mi Lista`}
          className="absolute top-2.5 right-2.5 w-9 h-9 rounded-lg bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-700/70 flex items-center justify-center text-zinc-200 transition-colors cursor-pointer"
        >
          {inWatchlist ? (
            <Check className="w-4 h-4 text-rose-400" aria-hidden="true" />
          ) : (
            <Bookmark className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="mt-3 space-y-1">
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="block w-full text-left cursor-pointer"
        >
          <h3 className="font-display text-base font-semibold text-zinc-100 group-hover:text-rose-400 transition-colors line-clamp-1">
            {item.title}
          </h3>
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-400 tabular-nums truncate">
          <span>{formatTvType(item.tvType)}</span>
          <span aria-hidden="true">·</span>
          <span>{item.status}</span>
          <span aria-hidden="true">·</span>
          <span>
            {item.episodeCount === 1 ? '1 parte' : `${item.episodeCount} ep.`}
          </span>
          {lastEpisode ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-rose-400">Ep. {lastEpisode}</span>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
