import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { AnimeDetailModal } from './components/AnimeDetailModal';
import { HeroSpotlight } from './components/HeroSpotlight';
import { PlayerModal } from './components/PlayerModal';
import { PosterCard } from './components/PosterCard';
import { TopBar, type NavTab } from './components/TopBar';
import {
  loadWatchHistory,
  loadWatchlist,
  recordWatchProgress,
  saveWatchlist,
  type WatchProgress,
} from './lib/watchlist';
import type {
  AnimeDetail,
  AnimeEpisode,
  AnimeSearchResult,
  CatalogSectionId,
  HomePageResponse,
  SearchPageResponse,
} from './types/anime';

const SECTION_TABS: Array<{ id: CatalogSectionId; label: string }> = [
  { id: 'latest', label: 'Últimos Añadidos' },
  { id: 'emision', label: 'En Emisión' },
  { id: 'pelicula', label: 'Películas' },
];

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('latest');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [catalogItems, setCatalogItems] = useState<AnimeSearchResult[]>([]);
  const [featuredItem, setFeaturedItem] = useState<AnimeSearchResult | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [watchlist, setWatchlist] = useState<AnimeSearchResult[]>(() => loadWatchlist());
  const [history, setHistory] = useState<Record<string, WatchProgress>>(() =>
    loadWatchHistory(),
  );

  // Detail modal state
  const [detailData, setDetailData] = useState<AnimeDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Player modal state
  const [playerEpisode, setPlayerEpisode] = useState<AnimeEpisode | null>(null);

  const fetchCatalog = useCallback(async (section: CatalogSectionId, pageNum: number) => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await fetch(`/api/catalog?section=${section}&page=${pageNum}`);
      if (!res.ok) throw new Error('No se pudo cargar el catálogo.');
      const data = (await res.json()) as HomePageResponse;
      setCatalogItems(data.items);
      setHasNext(data.hasNext);
      if (section === 'latest' && pageNum === 1 && data.items.length > 0) {
        setFeaturedItem(data.items[0]);
      }
    } catch (err) {
      setCatalogError(
        err instanceof Error ? err.message : 'Error de conexión al cargar el catálogo.',
      );
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const fetchSearch = useCallback(async (query: string) => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Error al buscar títulos.');
      const data = (await res.json()) as SearchPageResponse;
      setCatalogItems(data.items);
      setHasNext(false);
    } catch (err) {
      setCatalogError(err instanceof Error ? err.message : 'No se pudo completar la búsqueda.');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'watchlist') {
      setCatalogLoading(false);
      setCatalogError(null);
      return;
    }
    if (activeQuery) {
      fetchSearch(activeQuery);
      return;
    }
    fetchCatalog(activeTab, page);
  }, [activeTab, activeQuery, page, fetchCatalog, fetchSearch]);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    setActiveQuery('');
    setSearchInput('');
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSearch = () => {
    if (activeTab === 'watchlist') {
      setActiveTab('latest');
    }
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setActiveQuery('');
      return;
    }
    if (activeTab === 'watchlist') {
      setActiveTab('latest');
    }
    setPage(1);
    setActiveQuery(trimmed);
  };

  const clearSearch = () => {
    setSearchInput('');
    setActiveQuery('');
    setPage(1);
  };

  const handleToggleWatchlist = (item: AnimeSearchResult) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.id === item.id);
      const next = exists ? prev.filter((w) => w.id !== item.id) : [item, ...prev];
      saveWatchlist(next);
      return next;
    });
  };

  const handleOpenDetail = async (item: AnimeSearchResult) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailData(null);

    try {
      const params = new URLSearchParams({ url: item.url });
      const res = await fetch(`/api/anime/${encodeURIComponent(item.id)}?${params.toString()}`);
      if (!res.ok) throw new Error('No se pudo cargar la ficha del anime.');
      const data = (await res.json()) as AnimeDetail;
      setDetailData(data);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'Error al cargar los episodios.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePlayEpisode = (episode: AnimeEpisode) => {
    if (!detailData) return;
    setPlayerEpisode(episode);
    const updated = recordWatchProgress({
      animeId: detailData.id,
      animeTitle: detailData.title,
      episode: episode.episode,
      episodeTitle: episode.name,
      updatedAt: Date.now(),
    });
    setHistory(updated);
  };

  const displayedItems = activeTab === 'watchlist' ? watchlist : catalogItems;
  const watchlistIds = new Set(watchlist.map((item) => item.id));

  const showHero =
    activeTab === 'latest' && page === 1 && !activeQuery && featuredItem !== null;

  const sectionHeading = activeQuery
    ? `Resultados para “${activeQuery}”`
    : activeTab === 'watchlist'
      ? 'Mi Lista guardada'
      : SECTION_TABS.find((t) => t.id === activeTab)?.label || 'Últimos Añadidos';

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-zinc-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSearch={handleOpenSearch}
      />

      <main className="flex-1">
        {showHero && featuredItem && (
          <HeroSpotlight
            featured={featuredItem}
            inWatchlist={watchlistIds.has(featuredItem.id)}
            onOpenDetail={handleOpenDetail}
            onToggleWatchlist={handleToggleWatchlist}
          />
        )}

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Toolbar: Segmented section filters + search bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
            <div className="space-y-3">
              <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-50">
                {sectionHeading}
              </h2>

              {activeTab !== 'watchlist' && !activeQuery && (
                <div
                  role="tablist"
                  aria-label="Categorías del catálogo"
                  className="inline-flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg"
                >
                  {SECTION_TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="tab"
                        aria-selected={isActive}
                        type="button"
                        onClick={() => {
                          setActiveTab(tab.id);
                          setPage(1);
                        }}
                        className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-zinc-800 text-zinc-50'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 w-full lg:w-96"
              role="search"
              aria-label="Buscar anime"
            >
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Buscar serie, película o género…"
                  aria-label="Buscar serie, película o género"
                  className="w-full pl-10 pr-9 py-2.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:border-rose-500 focus:outline-none"
                />
                {(searchInput || activeQuery) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 text-sm font-medium text-zinc-100 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ir
              </button>
            </form>
          </div>

          {/* Content area: loading / error / empty / grid */}
          {catalogLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="space-y-3 animate-pulse">
                  <div className="aspect-[3/4] rounded-xl bg-zinc-900 border border-zinc-800/60" />
                  <div className="h-4 w-3/4 bg-zinc-900 rounded" />
                  <div className="h-3 w-1/2 bg-zinc-900 rounded" />
                </div>
              ))}
            </div>
          ) : catalogError ? (
            <div className="py-16 text-center space-y-4 border border-zinc-800 rounded-2xl bg-zinc-900/40">
              <p className="text-sm text-rose-400">{catalogError}</p>
              <button
                type="button"
                onClick={() =>
                  activeQuery
                    ? fetchSearch(activeQuery)
                    : fetchCatalog(activeTab === 'watchlist' ? 'latest' : activeTab, page)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="py-16 px-6 text-center space-y-3 border border-zinc-800/80 rounded-2xl bg-zinc-900/30">
              <p className="font-display text-lg font-semibold text-zinc-200">
                {activeTab === 'watchlist'
                  ? 'Tu lista está vacía'
                  : 'No se encontraron títulos'}
              </p>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                {activeTab === 'watchlist'
                  ? 'Guarda cualquier serie, película u OVA desde el catálogo para retomarlo al instante.'
                  : 'Prueba con otro término de búsqueda o vuelve al catálogo principal.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectTab('latest')}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg cursor-pointer"
                >
                  Explorar catálogo
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {displayedItems.map((item) => (
                  <PosterCard
                    key={item.id}
                    item={item}
                    inWatchlist={watchlistIds.has(item.id)}
                    lastEpisode={history[item.id]?.episode}
                    onSelect={handleOpenDetail}
                    onToggleWatchlist={handleToggleWatchlist}
                  />
                ))}
              </div>

              {activeTab !== 'watchlist' && !activeQuery && (page > 1 || hasNext) && (
                <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span>Anterior</span>
                  </button>
                  <span className="text-xs text-zinc-400 tabular-nums">
                    Página {page}
                  </span>
                  <button
                    type="button"
                    disabled={!hasNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-zinc-200 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <span>AnimeAV1 Lite · Catálogo optimizado en español</span>
          <span>Compatible con navegación por teclado</span>
        </div>
      </footer>

      {detailOpen && (
        <AnimeDetailModal
          detail={detailData}
          loading={detailLoading}
          error={detailError}
          inWatchlist={detailData ? watchlistIds.has(detailData.id) : false}
          lastWatchedEpisode={detailData ? history[detailData.id]?.episode : undefined}
          onClose={() => setDetailOpen(false)}
          onToggleWatchlist={handleToggleWatchlist}
          onPlayEpisode={handlePlayEpisode}
        />
      )}

      {detailData && playerEpisode && (
        <PlayerModal
          anime={detailData}
          episode={playerEpisode}
          onClose={() => setPlayerEpisode(null)}
          onSelectEpisode={handlePlayEpisode}
        />
      )}
    </div>
  );
}

export default App;
