import { useEffect } from 'react';
import { Bookmark, Check, Play, X } from 'lucide-react';
import { PosterImage } from './PosterImage';
import type { AnimeDetail, AnimeEpisode, AnimeSearchResult } from '../types/anime';

interface AnimeDetailModalProps {
  detail: AnimeDetail | null;
  loading: boolean;
  error: string | null;
  inWatchlist: boolean;
  lastWatchedEpisode?: number;
  onClose: () => void;
  onToggleWatchlist: (item: AnimeSearchResult) => void;
  onPlayEpisode: (episode: AnimeEpisode) => void;
}

export function AnimeDetailModal({
  detail,
  loading,
  error,
  inWatchlist,
  lastWatchedEpisode,
  onClose,
  onToggleWatchlist,
  onPlayEpisode,
}: AnimeDetailModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const asSearchSummary = (d: AnimeDetail): AnimeSearchResult => ({
    id: d.id,
    title: d.title,
    url: d.url,
    tvType: d.tvType,
    posterUrl: d.posterUrl,
    posterKey: d.posterKey,
    status: d.showStatus,
    year: d.year,
    episodeCount: d.episodes.length,
    genres: d.tags,
  });

  const resumeEpisode = detail
    ? detail.episodes.find((ep) => ep.episode === lastWatchedEpisode) || detail.episodes[0]
    : undefined;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={detail ? detail.title : 'Detalles del anime'}
      className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 lg:p-10"
      onClick={onClose}
    >
      <div
        className="max-w-5xl mx-auto bg-[#111114] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80">
          <span className="text-xs font-medium text-zinc-400">
            Ficha de título · AnimeAV1 Lite
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {loading && (
          <div className="p-8 sm:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse">
            <div className="md:col-span-4 aspect-[3/4] rounded-xl bg-zinc-800" />
            <div className="md:col-span-8 space-y-4">
              <div className="h-8 w-2/3 bg-zinc-800 rounded" />
              <div className="h-4 w-1/2 bg-zinc-800 rounded" />
              <div className="h-24 w-full bg-zinc-800 rounded" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="p-10 text-center space-y-4">
            <p className="text-sm text-rose-400">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer"
            >
              Volver al catálogo
            </button>
          </div>
        )}

        {!loading && !error && detail && (
          <div className="p-6 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-4">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                  <PosterImage
                    posterKey={detail.posterKey}
                    posterUrl={detail.posterUrl}
                    alt={detail.title}
                    priority
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="md:col-span-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 tabular-nums">
                    <span className="text-rose-400 font-medium">{detail.showStatus}</span>
                    <span aria-hidden="true">·</span>
                    <span>{detail.year}</span>
                    <span aria-hidden="true">·</span>
                    <span>{detail.episodes.length} {detail.episodes.length === 1 ? 'episodio' : 'episodios'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{detail.studio}</span>
                  </div>

                  <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-zinc-50 text-balance">
                    {detail.title}
                  </h2>

                  <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                    {detail.plot}
                  </p>

                  <div className="pt-1 text-xs text-zinc-400">
                    <span className="text-zinc-500">Géneros: </span>
                    <span className="text-zinc-300">{detail.tags.join(' · ')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {resumeEpisode && (
                    <button
                      type="button"
                      onClick={() => onPlayEpisode(resumeEpisode)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
                      <span>
                        {lastWatchedEpisode
                          ? `Continuar Episodio ${lastWatchedEpisode}`
                          : `Reproducir ${resumeEpisode.name}`}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleWatchlist(asSearchSummary(detail))}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {inWatchlist ? (
                      <>
                        <Check className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                        <span>En Mi Lista</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Guardar en Mi Lista</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800/80 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-display text-lg font-semibold text-zinc-100">
                  Episodios disponibles
                </h3>
                <span className="text-xs text-zinc-400 tabular-nums">
                  Audio japonés · Subtitulado
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {detail.episodes.map((ep) => {
                  const isLastWatched = lastWatchedEpisode === ep.episode;
                  return (
                    <button
                      key={ep.id}
                      type="button"
                      onClick={() => onPlayEpisode(ep)}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        isLastWatched
                          ? 'bg-rose-950/30 border-rose-700/60 text-zinc-50'
                          : 'bg-zinc-900/70 hover:bg-zinc-800/90 border-zinc-800 text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-semibold text-zinc-400 tabular-nums shrink-0 w-7">
                          {String(ep.episode).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{ep.name}</p>
                          <p className="text-xs text-zinc-500 tabular-nums">
                            {ep.duration} · {isLastWatched ? 'Visto recientemente' : ep.dubStatus}
                          </p>
                        </div>
                      </div>
                      <Play className="w-4 h-4 text-zinc-400 shrink-0" aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
