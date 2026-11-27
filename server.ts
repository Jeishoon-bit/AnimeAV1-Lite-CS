import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';
import {
  getMainPage,
  loadAnimeDetail,
  loadEpisodeLinks,
  searchAnime,
} from './server/animeav1Provider.ts';
import type { CatalogSectionId } from './src/types/anime.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number.parseInt(process.env.APP_PORT || '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/catalog', async (req, res) => {
    const rawSection = String(req.query.section || 'latest');
    const section: CatalogSectionId =
      rawSection === 'emision' || rawSection === 'pelicula' ? rawSection : 'latest';
    const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);

    try {
      const data = await getMainPage(section, page);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'No se pudo cargar el catálogo.' });
    }
  });

  app.get('/api/search', async (req, res) => {
    const q = String(req.query.q || '');
    try {
      const data = await searchAnime(q);
      res.json(data);
    } catch {
      res.status(500).json({ error: 'Error al buscar en el catálogo.' });
    }
  });

  app.get('/api/anime/:id', async (req, res) => {
    const target = req.query.url ? String(req.query.url) : req.params.id;
    try {
      const detail = await loadAnimeDetail(target);
      if (!detail) {
        res.status(404).json({ error: 'Título no encontrado.' });
        return;
      }
      res.json(detail);
    } catch {
      res.status(500).json({ error: 'Error al cargar la ficha del anime.' });
    }
  });

  app.get('/api/links', async (req, res) => {
    const episodeUrl = String(req.query.url || '');
    const title = req.query.title ? String(req.query.title) : undefined;
    if (!episodeUrl) {
      res.status(400).json({ error: 'Falta la URL del episodio.' });
      return;
    }
    try {
      const result = await loadEpisodeLinks(episodeUrl, title);
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Error al extraer los servidores de vídeo.' });
    }
  });

  // Proxy de portadas restringido únicamente a animeav1.com y cdn.animeav1.com
  app.get('/api/image-proxy', async (req, res) => {
    const rawUrl = String(req.query.url || '');
    try {
      const parsed = new URL(rawUrl);
      const allowedHosts = new Set(['cdn.animeav1.com', 'animeav1.com', 'www.animeav1.com']);
      if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname)) {
        res.status(400).end();
        return;
      }
      const upstream = await fetch(parsed.toString(), {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
          Referer: 'https://animeav1.com/',
        },
      });
      if (!upstream.ok) {
        res.status(upstream.status).end();
        return;
      }
      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buf);
    } catch {
      res.status(400).end();
    }
  });

  // Endpoint de descarga de información / lista M3U8 ligera para modo TV/offline
  app.get('/api/stream/:slug', (req, res) => {
    const slug = req.params.slug;
    const server = String(req.query.server || 'Streamwish');
    const quality = String(req.query.quality || '1080p AV1');
    res.json({
      slug,
      server,
      quality,
      codec: 'AV1 / H.264 Lite',
      subtitles: 'Español (Subtitulado)',
      streamReady: true,
    });
  });

  if (IS_PROD) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AnimeAV1 Lite listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
