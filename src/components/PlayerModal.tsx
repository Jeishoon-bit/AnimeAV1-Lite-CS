import { useEffect, useRef, useState } from 'react';
import {
  ChevronRight,
  Download,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { POSTER_ASSETS } from '../lib/posters';
import type {
  AnimeDetail,
  AnimeEpisode,
  ExtractorLink,
  LoadLinksResponse,
} from '../types/anime';

interface PlayerModalProps {
  anime: AnimeDetail;
  episode: AnimeEpisode;
  onClose: () => void;
  onSelectEpisode: (ep: AnimeEpisode) => void;
}

function formatSeconds(sec: number): string {
  const mins = Math.floor(sec / 60);
  const rem = Math.floor(sec % 60);
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

const SAMPLE_SUBTITLES = [
  '“Incluso si apagan la red central, la memoria de este distrito sigue intacta.”',
  '“Cambio de canal a frecuencia auxiliar. Codec AV1 sincronizado.”',
  '“No mires atrás hasta cruzar la última pasarela antes del amanecer.”',
  '“Señal estable. Todos los sectores responden en baja latencia.”',
];

export function PlayerModal({
  anime,
  episode,
  onClose,
  onSelectEpisode,
}: PlayerModalProps) {
  const [linksData, setLinksData] = useState<LoadLinksResponse | null>(null);
  const [selectedLink, setSelectedLink] = useState<ExtractorLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Playback state for built-in lite preview player
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progressSec, setProgressSec] = useState(0);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const totalSec = anime.tvType === 'AnimeMovie' ? 6720 : 1440;
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setProgressSec(0);
    setIsPlaying(true);

    const params = new URLSearchParams({
      url: episode.dataUrl,
      title: `${anime.title} - ${episode.name}`,
    });

    fetch(`/api/links?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('No se pudieron extraer los servidores del episodio.');
        return (await res.json()) as LoadLinksResponse;
      })
      .then((data) => {
        if (!active) return;
        setLinksData(data);
        setSelectedLink(data.links[0] || null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!active) return;
        setError(err.message || 'Error al cargar fuentes de vídeo.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [anime.title, episode.dataUrl, episode.name]);

  useEffect(() => {
    if (!isPlaying || loading || linksData?.sourceMode === 'live') return;
    tickRef.current = window.setInterval(() => {
      setProgressSec((prev) => (prev + 1 >= totalSec ? 0 : prev + 1));
    }, 1000);
    return () => {
      if (tickRef.current !== null) window.clearInterval(tickRef.current);
    };
  }, [isPlaying, loading, linksData?.sourceMode, totalSec]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'BUTTON' && tag !== 'INPUT') {
          e.preventDefault();
          setIsPlaying((p) => !p);
        }
      } else if (e.key === 'ArrowRight') {
        setProgressSec((p) => Math.min(totalSec, p + 10));
      } else if (e.key === 'ArrowLeft') {
        setProgressSec((p) => Math.max(0, p - 10));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, totalSec]);

  const nextEpisode = anime.episodes.find((ep) => ep.episode === episode.episode + 1);
  const subtitleIndex = Math.floor(progressSec / 6) % SAMPLE_SUBTITLES.length;

  const handleDownloadManifest = () => {
    if (!selectedLink) return;
    const m3uContent = [
      '#EXTM3U',
      `#EXTINF:-1,${anime.title} - ${episode.name} (${selectedLink.serverName} · ${selectedLink.quality})`,
      selectedLink.url,
    ].join('\n');
    const blob = new Blob([m3uContent], { type: 'application/x-mpegURL' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${anime.id}-ep-${episode.episode}.m3u8`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setDownloadNotice(`Lista guardada (${selectedLink.serverName})`);
    window.setTimeout(() => setDownloadNotice(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reproductor: ${anime.title} ${episode.name}`}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col overflow-y-auto"
    >
      {/* Top player header */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-8 py-4 border-b border-zinc-800/80">
        <div className="min-w-0">
          <p className="text-xs text-zinc-400 truncate">
            {anime.title} · {episode.dubStatus}
          </p>
          <h2 className="font-display text-base sm:text-lg font-semibold text-zinc-50 truncate">
            {episode.name}
          </h2>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {nextEpisode && (
            <button
              type="button"
              onClick={() => onSelectEpisode(nextEpisode)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Siguiente episodio</span>
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reproductor"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main video stage */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-rose-500 animate-spin" />
              <p className="text-sm">Extrayendo servidores de vídeo…</p>
            </div>
          ) : error ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          ) : linksData?.sourceMode === 'live' && selectedLink ? (
            <iframe
              src={selectedLink.playableUrl}
              title={`${anime.title} ${episode.name}`}
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="relative w-full h-full flex flex-col justify-between select-none">
              <img
                src={POSTER_ASSETS[anime.backdropKey]}
                alt={`${anime.title} - ${episode.name}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  isPlaying ? 'opacity-55' : 'opacity-35'
                }`}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60"
              />

              <div className="relative z-10 p-5 flex items-center justify-between text-xs text-zinc-300">
                <span>
                  {selectedLink?.serverName} · {selectedLink?.quality}
                </span>
                <span className="font-mono tabular-nums text-zinc-400">
                  {selectedLink?.format}
                </span>
              </div>

              {/* Center play/pause */}
              <div className="relative z-10 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pausar reproducción' : 'Reanudar reproducción'}
                  className="w-16 h-16 rounded-full bg-rose-600/95 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-current" aria-hidden="true" />
                  ) : (
                    <Play className="w-7 h-7 fill-current ml-0.5" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Subtitles + controls bar */}
              <div className="relative z-10 p-4 sm:p-5 space-y-4">
                <p className="text-center text-sm sm:text-base font-medium text-zinc-100 drop-shadow max-w-2xl mx-auto">
                  {SAMPLE_SUBTITLES[subtitleIndex]}
                </p>

                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={totalSec}
                    value={progressSec}
                    aria-label="Progreso del episodio"
                    onChange={(e) => setProgressSec(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer h-1.5"
                  />

                  <div className="flex items-center justify-between text-xs text-zinc-300 tabular-nums">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsPlaying((p) => !p)}
                        className="hover:text-white cursor-pointer"
                      >
                        {isPlaying ? 'Pausar' : 'Reproducir'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMuted((m) => !m)}
                        aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                        className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <Volume2 className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                      <span className="font-mono">
                        {formatSeconds(progressSec)} / {formatSeconds(totalSec)}
                      </span>
                    </div>
                    <span className="text-zinc-400">
                      Atajos: Espacio · Flechas ±10s · Esc
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Server selector + Download action (preserves 8-server extraction cap & download support) */}
        {!loading && linksData && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-400">
                Servidores extraídos ({linksData.links.length} de 8 máx.)
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {linksData.links.map((srv) => {
                  const isActive = selectedLink?.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedLink(srv)}
                      className={`px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isActive
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {srv.serverName} · {srv.quality}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedLink?.isDownloadable && (
              <div className="flex items-center gap-3 shrink-0">
                {downloadNotice && (
                  <span className="text-xs text-rose-400">{downloadNotice}</span>
                )}
                <button
                  type="button"
                  onClick={handleDownloadManifest}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Descargar lista M3U8</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
