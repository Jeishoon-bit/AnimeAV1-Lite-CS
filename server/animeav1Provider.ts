import * as cheerio from 'cheerio';
import type {
  AnimeDetail,
  AnimeEpisode,
  AnimeSearchResult,
  CatalogSectionId,
  ExtractorLink,
  HomePageResponse,
  LoadLinksResponse,
  PosterKey,
  SearchPageResponse,
  ShowStatus,
  TvType,
} from '../src/types/anime.ts';

const MAIN_URL = (process.env.ANIMEAV1_BASE_URL || 'https://animeav1.com').replace(/\/$/, '');

const USER_AGENT =
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

const HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'es-ES,es;q=0.9',
};

const VIDEO_HOSTS = [
  'zilla-networks',
  'streamwish',
  'filemoon',
  'voe',
  'dood',
  'mp4upload',
  'ok.ru',
  'uqload',
  'vidhide',
  'lulustream',
  'mixdrop',
  'mega',
  'yourupload',
  'sendvid',
  'embed',
  'player',
] as const;

const SECTION_CONFIG: Record<CatalogSectionId, { path: string; title: string }> = {
  latest: { path: '/catalogo?order=latest&page=', title: 'Últimos Añadidos' },
  emision: { path: '/catalogo?status=emision&page=', title: 'En Emisión' },
  pelicula: { path: '/catalogo?type=pelicula&page=', title: 'Películas' },
};

interface CuratedAnimeEntry extends AnimeDetail {
  sectionTags: CatalogSectionId[];
}

function buildEpisodes(
  animeId: string,
  slug: string,
  count: number,
  duration = '24 min',
): AnimeEpisode[] {
  return Array.from({ length: count }, (_, idx) => {
    const epNum = idx + 1;
    return {
      id: `${animeId}-ep-${epNum}`,
      episode: epNum,
      name: count === 1 ? 'Película Completa' : `Episodio ${epNum}`,
      dataUrl: `${MAIN_URL}/ver/${slug}-${epNum}`,
      duration,
      dubStatus: 'Subtitulado',
    };
  });
}

const CURATED_CATALOG: CuratedAnimeEntry[] = [
  {
    id: 'kurogane-protocolo-cero',
    title: 'Kurogane: Protocolo Cero',
    url: `${MAIN_URL}/media/kurogane-protocolo-cero`,
    tvType: 'Anime',
    posterKey: 'hero_kurogane',
    backdropKey: 'hero_kurogane',
    plot: 'En un Tokio envuelto en lluvia constante y redes neuronales obsoletas, un espadachín cibernético sin registro intenta desmantelar el último servidor de memoria urbana antes del apagón total.',
    tags: ['Acción', 'Ciencia Ficción', 'Cyberpunk', 'Seinen'],
    showStatus: 'En emisión',
    year: 2026,
    studio: 'Studio Kuro',
    sectionTags: ['latest', 'emision'],
    episodes: buildEpisodes('kurogane-protocolo-cero', 'kurogane-protocolo-cero', 12, '24 min'),
    sourceMode: 'catalog',
  },
  {
    id: 'hoja-del-crepúsculo',
    title: 'La Hoja del Crepúsculo',
    url: `${MAIN_URL}/media/la-hoja-del-crepusculo`,
    tvType: 'Anime',
    posterKey: 'espada',
    backdropKey: 'espada',
    plot: 'Tras la caída del clan de las hojas rojas, Renji recorre las aldeas fronterizas cargando una katana forjada con meteorito para sellar las grietas del valle de Kioto.',
    tags: ['Acción', 'Fantasía', 'Histórico', 'Drama'],
    showStatus: 'En emisión',
    year: 2026,
    studio: 'Ufotable Works',
    sectionTags: ['latest', 'emision'],
    episodes: buildEpisodes('hoja-del-crepúsculo', 'la-hoja-del-crepusculo', 18, '24 min'),
    sourceMode: 'catalog',
  },
  {
    id: 'horizonte-orbita-9',
    title: 'Horizonte Órbita 9',
    url: `${MAIN_URL}/media/horizonte-orbita-9`,
    tvType: 'Anime',
    posterKey: 'orbita',
    backdropKey: 'orbita',
    plot: 'Una joven piloto de mantenimiento orbital descubre una señal anómala procedente de la estación abandonada Nova-3 mientras la Tierra atraviesa la mayor tormenta solar del siglo.',
    tags: ['Mecha', 'Espacio', 'Ciencia Ficción', 'Suspense'],
    showStatus: 'Finalizado',
    year: 2025,
    studio: 'Sunrise Orbital',
    sectionTags: ['latest'],
    episodes: buildEpisodes('horizonte-orbita-9', 'horizonte-orbita-9', 24, '24 min'),
    sourceMode: 'catalog',
  },
  {
    id: 'codice-de-la-torre-astral',
    title: 'Códice de la Torre Astral',
    url: `${MAIN_URL}/media/codice-de-la-torre-astral`,
    tvType: 'Anime',
    posterKey: 'alquimia',
    backdropKey: 'alquimia',
    plot: 'Dentro de una biblioteca mecánica que gira al ritmo de las constelaciones, el archivero Elian descifra manuscritos prohibidos capaces de reescribir la memoria del tiempo.',
    tags: ['Fantasía', 'Misterio', 'Aventura', 'Magia'],
    showStatus: 'En emisión',
    year: 2026,
    studio: 'Kyoto Atelier',
    sectionTags: ['latest', 'emision'],
    episodes: buildEpisodes('codice-de-la-torre-astral', 'codice-de-la-torre-astral', 10, '24 min'),
    sourceMode: 'catalog',
  },
  {
    id: 'el-velo-del-santuario',
    title: 'El Velo del Santuario Nevado',
    url: `${MAIN_URL}/media/el-velo-del-santuario`,
    tvType: 'AnimeMovie',
    posterKey: 'velo',
    backdropKey: 'velo',
    plot: 'Durante la noche más larga del invierno, una sacerdotisa enmascarada asciende las escalinatas del bosque de cedros para negociar una tregua entre los espíritus antiguos y la aldea.',
    tags: ['Sobrenatural', 'Drama', 'Fantasía', 'Película'],
    showStatus: 'Finalizado',
    year: 2025,
    studio: 'CoMix Wave',
    sectionTags: ['latest', 'pelicula'],
    episodes: buildEpisodes('el-velo-del-santuario', 'el-velo-del-santuario', 1, '1 h 52 min'),
    sourceMode: 'catalog',
  },
  {
    id: 'linea-roja-touge',
    title: 'Línea Roja: Paso Touge',
    url: `${MAIN_URL}/media/linea-roja-touge`,
    tvType: 'OVA',
    posterKey: 'velocidad',
    backdropKey: 'velocidad',
    plot: 'Tres noches de lluvia intensa en el puerto de montaña de Hakone ponen a prueba a los corredores nocturnos que compiten sin telemetría ni frenos asistidos.',
    tags: ['Carreras', 'Acción', 'Deportes', 'OVA'],
    showStatus: 'Finalizado',
    year: 2025,
    studio: 'Madhouse Garage',
    sectionTags: ['latest', 'pelicula'],
    episodes: buildEpisodes('linea-roja-touge', 'linea-roja-touge', 4, '32 min'),
    sourceMode: 'catalog',
  },
  {
    id: 'cronicas-del-acero-gris',
    title: 'Crónicas del Acero Gris',
    url: `${MAIN_URL}/media/cronicas-del-acero-gris`,
    tvType: 'Anime',
    posterKey: 'espada',
    backdropKey: 'espada',
    plot: 'Un herrero ambulante y su aprendiz buscan los cinco fragmentos de hierro celeste dispersos tras la guerra de los tres reinos.',
    tags: ['Aventura', 'Acción', 'Fantasía'],
    showStatus: 'En emisión',
    year: 2026,
    studio: 'Bones Guild',
    sectionTags: ['emision'],
    episodes: buildEpisodes('cronicas-del-acero-gris', 'cronicas-del-acero-gris', 14, '24 min'),
    sourceMode: 'catalog',
  },
  {
    id: 'ecos-de-la-estacion-kibo',
    title: 'Ecos de la Estación Kibo',
    url: `${MAIN_URL}/media/ecos-de-la-estacion-kibo`,
    tvType: 'AnimeMovie',
    posterKey: 'orbita',
    backdropKey: 'orbita',
    plot: 'Película recopilatoria y epílogo cinematográfico de la misión de rescate en órbita baja con animación remasterizada en AV1.',
    tags: ['Ciencia Ficción', 'Drama', 'Espacio'],
    showStatus: 'Finalizado',
    year: 2025,
    studio: 'Sunrise Orbital',
    sectionTags: ['pelicula'],
    episodes: buildEpisodes('ecos-de-la-estacion-kibo', 'ecos-de-la-estacion-kibo', 1, '1 h 44 min'),
    sourceMode: 'catalog',
  },
  {
    id: 'astrolabio-de-medianoche',
    title: 'El Astrolabio de Medianoche',
    url: `${MAIN_URL}/media/astrolabio-de-medianoche`,
    tvType: 'AnimeMovie',
    posterKey: 'alquimia',
    backdropKey: 'alquimia',
    plot: 'Cuando los engranajes de la gran torre dejan de girar, dos estudiantes de astronomía deben calibrar el péndulo solar antes del alba.',
    tags: ['Fantasía', 'Misterio', 'Película'],
    showStatus: 'Finalizado',
    year: 2024,
    studio: 'Kyoto Atelier',
    sectionTags: ['pelicula'],
    episodes: buildEpisodes('astrolabio-de-medianoche', 'astrolabio-de-medianoche', 1, '1 h 38 min'),
    sourceMode: 'catalog',
  },
];

function fixUrlNull(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return `${MAIN_URL}${trimmed}`;
  return `${MAIN_URL}/${trimmed}`;
}

function toProxiedPoster(rawUrl?: string): string | undefined {
  if (!rawUrl) return undefined;
  return `/api/image-proxy?url=${encodeURIComponent(rawUrl)}`;
}

export function isLikelyVideoHost(url: string): boolean {
  const lower = url.toLowerCase();
  return VIDEO_HOSTS.some((host) => lower.includes(host));
}

function detectHostLabel(url: string): string {
  const lower = url.toLowerCase();
  for (const host of VIDEO_HOSTS) {
    if (lower.includes(host)) {
      if (host === 'ok.ru') return 'OK.ru';
      if (host === 'zilla-networks') return 'Zilla';
      return host.charAt(0).toUpperCase() + host.slice(1);
    }
  }
  return 'Servidor Directo';
}

function assignFallbackPosterKey(seed: string): PosterKey {
  const keys: PosterKey[] = ['espada', 'orbita', 'alquimia', 'velo', 'velocidad', 'hero_kurogane'];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return keys[hash % keys.length];
}

function slugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.split('/').filter(Boolean).pop() || encodeURIComponent(url);
  } catch {
    return url.split('/').filter(Boolean).pop() || encodeURIComponent(url);
  }
}

async function fetchHtml(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (
      text.includes('Just a moment...') ||
      text.includes('cf-browser-verification') ||
      text.length < 200
    ) {
      return null;
    }
    return text;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseSearchResultsFromHtml(html: string, defaultType: TvType = 'Anime'): AnimeSearchResult[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const results: AnimeSearchResult[] = [];

  $('article, .anime-card, .grid > div').each((_, el) => {
    const node = $(el);
    const linkEl = node.find('a[href*="/media/"], a[href*="/anime/"], a').first();
    const href = fixUrlNull(linkEl.attr('href'));
    if (!href || href === MAIN_URL || href === `${MAIN_URL}/` || seen.has(href)) return;

    const headingTitle = node.find('h2, h3, .title').first().text().trim();
    const altTitle = (node.find('img').first().attr('alt') || '')
      .replace(/^Portada de\s+/i, '')
      .replace(/^Póster de\s+/i, '')
      .trim();
    const title = headingTitle || altTitle;
    if (!title) return;

    const img = node.find('img').first();
    const rawPoster =
      img.attr('data-src')?.trim() ||
      img.attr('srcset')?.trim().split(' ')[0] ||
      img.attr('src')?.trim();
    const posterUrl = toProxiedPoster(fixUrlNull(rawPoster));

    const typeLabel = node.find('.text-subs').first().text().trim().toLowerCase();
    let tvType: TvType = defaultType;
    if (typeLabel.includes('película') || typeLabel.includes('pelicula')) tvType = 'AnimeMovie';
    else if (typeLabel.includes('ova')) tvType = 'OVA';

    seen.add(href);
    const id = slugFromUrl(href);
    results.push({
      id,
      title,
      url: href,
      tvType,
      posterUrl,
      posterKey: assignFallbackPosterKey(id),
      status: 'En emisión',
      year: 2026,
      episodeCount: tvType === 'AnimeMovie' ? 1 : 12,
      genres: ['Anime', 'Subtitulado'],
    });
  });

  return results;
}

function toSearchResult(item: CuratedAnimeEntry): AnimeSearchResult {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    tvType: item.tvType,
    posterKey: item.posterKey,
    status: item.showStatus,
    year: item.year,
    episodeCount: item.episodes.length,
    genres: item.tags,
  };
}

export async function getMainPage(
  section: CatalogSectionId,
  page = 1,
): Promise<HomePageResponse> {
  const config = SECTION_CONFIG[section] ?? SECTION_CONFIG.latest;
  const targetUrl = `${MAIN_URL}${config.path}${page}`;
  const defaultType: TvType = section === 'pelicula' ? 'AnimeMovie' : 'Anime';

  const html = await fetchHtml(targetUrl);
  if (html) {
    const liveItems = parseSearchResultsFromHtml(html, defaultType);
    if (liveItems.length > 0) {
      return {
        section,
        sectionTitle: config.title,
        page,
        hasNext: liveItems.length >= 12,
        sourceMode: 'live',
        items: liveItems,
      };
    }
  }

  const filtered = CURATED_CATALOG.filter((item) => item.sectionTags.includes(section));
  const pageSize = 6;
  const start = (Math.max(1, page) - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize).map(toSearchResult);

  return {
    section,
    sectionTitle: config.title,
    page,
    hasNext: start + pageSize < filtered.length,
    sourceMode: 'catalog',
    items: slice,
  };
}

export async function searchAnime(query: string): Promise<SearchPageResponse> {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return {
      query: '',
      sourceMode: 'catalog',
      items: CURATED_CATALOG.map(toSearchResult),
    };
  }

  const searchUrl = `${MAIN_URL}/catalogo?search=${encodeURIComponent(cleanQuery).replace(/%20/g, '+')}`;
  const html = await fetchHtml(searchUrl);
  if (html) {
    const liveItems = parseSearchResultsFromHtml(html);
    if (liveItems.length > 0) {
      return {
        query: cleanQuery,
        sourceMode: 'live',
        items: liveItems,
      };
    }
  }

  const needle = cleanQuery.toLowerCase();
  const matched = CURATED_CATALOG.filter(
    (item) =>
      item.title.toLowerCase().includes(needle) ||
      item.plot.toLowerCase().includes(needle) ||
      item.tags.some((t) => t.toLowerCase().includes(needle)) ||
      item.studio.toLowerCase().includes(needle),
  ).map(toSearchResult);

  return {
    query: cleanQuery,
    sourceMode: 'catalog',
    items: matched,
  };
}

export async function loadAnimeDetail(idOrUrl: string): Promise<AnimeDetail | null> {
  const localMatch = CURATED_CATALOG.find(
    (item) => item.id === idOrUrl || item.url === idOrUrl || slugFromUrl(item.url) === idOrUrl,
  );

  const targetUrl = idOrUrl.startsWith('http')
    ? idOrUrl
    : localMatch?.url || `${MAIN_URL}/media/${idOrUrl}`;

  const html = await fetchHtml(targetUrl);
  if (html) {
    const $ = cheerio.load(html);
    const title = $('h1').first().text().trim();
    if (title) {
      const rawPoster =
        fixUrlNull($('meta[property="og:image"]').attr('content')) ||
        fixUrlNull($('img.poster, main img').first().attr('src'));
      const poster = toProxiedPoster(rawPoster);

      const description =
        $('p.synopsis, .description, main p').first().text().trim() ||
        $('meta[property="og:description"]').attr('content')?.trim() ||
        $('meta[name="description"]').attr('content')?.trim() ||
        'Sinopsis no disponible.';

      const tags: string[] = [];
      $('a[href*="genre"], a[href*="genero"], a[href*="categoria"], .genres a').each((_, el) => {
        const tag = $(el).text().trim();
        if (tag && !tags.includes(tag)) tags.push(tag);
      });

      const fullText = $.text();
      let showStatus: ShowStatus = 'Desconocido';
      if (/en emisi[oó]n/i.test(fullText)) showStatus = 'En emisión';
      else if (/finalizado/i.test(fullText)) showStatus = 'Finalizado';

      const seenEp = new Set<string>();
      const episodes: AnimeEpisode[] = [];
      const slug = slugFromUrl(targetUrl);

      $('a[href*="/ver/"], a[href*="/episodio/"], .episodes a, a[href*="/media/"]').each((_, el) => {
        const epEl = $(el);
        const epHref = fixUrlNull(epEl.attr('href'));
        if (!epHref || seenEp.has(epHref)) return;

        // Solo enlaces de episodio (evitar el enlace raíz del anime /media/<slug>)
        const isDirectMediaEp = /\/media\/[^/]+\/\d+\/?$/.test(epHref);
        const isWatchUrl = epHref.includes('/ver/') || epHref.includes('/episodio/');
        if (!isDirectMediaEp && !isWatchUrl) return;

        seenEp.add(epHref);
        const epText = epEl.text().trim();
        const urlNumMatch = /\/(\d+)\/?$/.exec(epHref);
        const textNumMatch = /(\d+)/.exec(epText);
        const epNum = urlNumMatch
          ? Number.parseInt(urlNumMatch[1], 10)
          : textNumMatch
            ? Number.parseInt(textNumMatch[1], 10)
            : episodes.length + 1;

        episodes.push({
          id: `${slug}-ep-${epNum}`,
          episode: epNum,
          name: epText && !/^\d+$/.test(epText) ? epText : `Episodio ${epNum}`,
          dataUrl: epHref,
          duration: '24 min',
          dubStatus: 'Subtitulado',
        });
      });

      episodes.sort((a, b) => a.episode - b.episode);

      if (episodes.length > 0) {
        return {
          id: slug,
          title,
          url: targetUrl,
          tvType: 'Anime',
          posterUrl: poster,
          posterKey: localMatch?.posterKey ?? assignFallbackPosterKey(slug),
          backdropKey: localMatch?.backdropKey ?? assignFallbackPosterKey(slug),
          plot: description,
          tags: tags.length > 0 ? tags : ['Anime', 'Subtitulado'],
          showStatus,
          year: 2026,
          studio: 'AnimeAV1',
          episodes,
          sourceMode: 'live',
        };
      }
    }
  }

  return localMatch ?? null;
}

export async function loadEpisodeLinks(
  episodeUrl: string,
  episodeTitle?: string,
): Promise<LoadLinksResponse> {
  const candidateUrls = new Set<string>();

  if (episodeUrl.startsWith('http')) {
    const html = await fetchHtml(episodeUrl);
    if (html) {
      const $ = cheerio.load(html);

      // 1. Iframes directos
      $('iframe[src]').each((_, el) => {
        const src = fixUrlNull($(el).attr('src'));
        if (src) candidateUrls.add(src);
      });

      // 2. Atributos data-url / data-embed / data-video / data-src
      $('[data-url], [data-embed], [data-video], [data-src]').each((_, el) => {
        const node = $(el);
        const raw =
          node.attr('data-url') ||
          node.attr('data-embed') ||
          node.attr('data-video') ||
          node.attr('data-src');
        const fixed = fixUrlNull(raw);
        if (fixed) candidateUrls.add(fixed);
      });

      // 3. Scripts con URLs de reproductor/stream
      const scriptRegex = /https?:\\\/\\\/[^"'\s\\<>]+|https?:\/\/[^"'\s<>]+/g;
      $('script').each((_, el) => {
        const content = $(el).html() || '';
        const matches = content.match(scriptRegex) || [];
        for (const rawMatch of matches) {
          const cleanUrl = rawMatch.replace(/\\\//g, '/');
          if (isLikelyVideoHost(cleanUrl)) {
            candidateUrls.add(cleanUrl);
          }
        }
      });
    }
  }

  const limitedLive = Array.from(candidateUrls).slice(0, 8);
  if (limitedLive.length > 0) {
    return {
      episodeUrl,
      episodeTitle: episodeTitle || 'Reproducción',
      sourceMode: 'live',
      links: limitedLive.map((url, idx) => ({
        id: `srv-live-${idx + 1}`,
        serverName: `${detectHostLabel(url)} #${idx + 1}`,
        host: detectHostLabel(url),
        url,
        playableUrl: url,
        quality: idx === 0 ? '1080p' : '720p',
        format: 'Embed',
        isDownloadable: true,
      })),
    };
  }

  // Fallback de servidores optimizados (máximo 8, reflejando la lógica de AnimeAV1Provider.kt)
  const epSlug = slugFromUrl(episodeUrl);
  const curatedServers: Array<{
    host: string;
    domain: string;
    quality: string;
    format: ExtractorLink['format'];
  }> = [
    { host: 'Streamwish', domain: 'streamwish.to', quality: '1080p AV1', format: 'AV1' },
    { host: 'Filemoon', domain: 'filemoon.sx', quality: '1080p HLS', format: 'HLS' },
    { host: 'Vidhide', domain: 'vidhidepro.com', quality: '720p AV1', format: 'AV1' },
    { host: 'Voe', domain: 'voe.sx', quality: '720p MP4', format: 'MP4' },
    { host: 'Lulustream', domain: 'lulustream.com', quality: '720p HLS', format: 'HLS' },
    { host: 'Mp4upload', domain: 'mp4upload.com', quality: '480p MP4', format: 'MP4' },
  ];

  const links: ExtractorLink[] = curatedServers.slice(0, 8).map((srv, idx) => ({
    id: `srv-${epSlug}-${idx + 1}`,
    serverName: srv.host,
    host: srv.host,
    url: `https://${srv.domain}/e/${epSlug}`,
    playableUrl: `/api/stream/${encodeURIComponent(epSlug)}?server=${encodeURIComponent(srv.host)}&quality=${encodeURIComponent(srv.quality)}`,
    quality: srv.quality,
    format: srv.format,
    isDownloadable: true,
  }));

  return {
    episodeUrl,
    episodeTitle: episodeTitle || 'Reproducción',
    sourceMode: 'catalog',
    links,
  };
}
