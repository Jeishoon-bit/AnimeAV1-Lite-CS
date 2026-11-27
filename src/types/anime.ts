export type TvType = 'Anime' | 'AnimeMovie' | 'OVA';

export type ShowStatus = 'En emisión' | 'Finalizado' | 'Desconocido';

export type DubStatus = 'Subtitulado';

export type CatalogSectionId = 'latest' | 'emision' | 'pelicula';

export type PosterKey =
  | 'hero_kurogane'
  | 'espada'
  | 'orbita'
  | 'alquimia'
  | 'velo'
  | 'velocidad';

export interface AnimeSearchResult {
  id: string;
  title: string;
  url: string;
  tvType: TvType;
  posterUrl?: string;
  posterKey: PosterKey;
  status: ShowStatus;
  year: number;
  episodeCount: number;
  genres: string[];
}

export interface HomePageResponse {
  section: CatalogSectionId;
  sectionTitle: string;
  page: number;
  hasNext: boolean;
  sourceMode: 'live' | 'catalog';
  items: AnimeSearchResult[];
}

export interface SearchPageResponse {
  query: string;
  sourceMode: 'live' | 'catalog';
  items: AnimeSearchResult[];
}

export interface AnimeEpisode {
  id: string;
  episode: number;
  name: string;
  dataUrl: string;
  duration: string;
  dubStatus: DubStatus;
}

export interface AnimeDetail {
  id: string;
  title: string;
  url: string;
  tvType: TvType;
  posterUrl?: string;
  posterKey: PosterKey;
  backdropKey: PosterKey;
  plot: string;
  tags: string[];
  showStatus: ShowStatus;
  year: number;
  studio: string;
  episodes: AnimeEpisode[];
  sourceMode: 'live' | 'catalog';
}

export interface ExtractorLink {
  id: string;
  serverName: string;
  host: string;
  url: string;
  playableUrl: string;
  quality: string;
  format: 'AV1' | 'HLS' | 'MP4' | 'Embed';
  isDownloadable: boolean;
}

export interface LoadLinksResponse {
  episodeUrl: string;
  episodeTitle: string;
  sourceMode: 'live' | 'catalog';
  links: ExtractorLink[];
}
