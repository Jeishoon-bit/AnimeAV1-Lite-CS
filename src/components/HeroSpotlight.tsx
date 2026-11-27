import { Bookmark, Check, Play } from 'lucide-react';
import { PosterImage } from './PosterImage';
import type { AnimeSearchResult } from '../types/anime';

interface HeroSpotlightProps {
  featured: AnimeSearchResult;
  inWatchlist: boolean;
  onOpenDetail: (item: AnimeSearchResult) => void;
  onToggleWatchlist: (item: AnimeSearchResult) => void;
}

export function HeroSpotlight({
  featured,
  inWatchlist,
  onOpenDetail,
  onToggleWatchlist,
}: HeroSpotlightProps) {
  return (
    <section
      id="inicio"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 border-b border-zinc-800/70"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-between py-2">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-wide text-rose-400">
              Destacado de la temporada · Subtitulado al español
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-zinc-50 leading-[1.1] text-balance">
              {featured.title}
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-prose">
              {featured.id === 'kurogane-protocolo-cero'
                ? 'En un Tokio envuelto en lluvia constante y redes neuronales obsoletas, un espadachín cibernético sin registro intenta desmantelar el último servidor de memoria urbana antes del apagón total.'
                : 'Título destacado en el catálogo optimizado de AnimeAV1 Lite, listo para carga rápida, bajo consumo de memoria y selección directa entre múltiples servidores en español.'}
            </p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-400 tabular-nums pt-1">
              <span>{featured.status}</span>
              <span aria-hidden="true">·</span>
              <span>{featured.year}</span>
              <span aria-hidden="true">·</span>
              <span>
                {featured.episodeCount === 1
                  ? '1 parte'
                  : `${featured.episodeCount} episodios`}
              </span>
              <span aria-hidden="true">·</span>
              <span>{featured.genres.slice(0, 2).join(' / ')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-8">
            <button
              type="button"
              onClick={() => onOpenDetail(featured)}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current shrink-0" aria-hidden="true" />
              <span>Ver ahora</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleWatchlist(featured)}
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
                  <span>Añadir a Mi Lista</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <button
            type="button"
            onClick={() => onOpenDetail(featured)}
            className="group relative block w-full h-full min-h-[240px] sm:min-h-[320px] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 text-left cursor-pointer"
            aria-label={`Abrir ficha de ${featured.title}`}
          >
            <PosterImage
              posterKey={featured.posterKey}
              posterUrl={featured.posterUrl}
              alt={featured.title}
              priority
              className="w-full h-full lg:h-full aspect-video object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#09090B]/80 via-[#09090B]/15 to-transparent"
            />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
              <span className="text-xs font-medium text-zinc-200">
                Reproducción ligera AV1 · Hasta 8 servidores por episodio
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Full-width specification strip below the hero split */}
      <div className="mt-8 pt-6 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
        <div>
          <p className="text-xs text-zinc-500">Formato admitido</p>
          <p className="mt-1 font-medium text-zinc-200">Anime, Películas y OVAs</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Extracción optimizada</p>
          <p className="mt-1 font-medium text-zinc-200 tabular-nums">Máximo 8 enlaces paralelos</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500">Idioma de catálogo</p>
          <p className="mt-1 font-medium text-zinc-200">Subtitulado en Español (ES)</p>
        </div>
      </div>
    </section>
  );
}
