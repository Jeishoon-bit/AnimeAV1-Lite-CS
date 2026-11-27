# AnimeAV1 Lite

Reescritura web en React, TypeScript y Express del catálogo **AnimeAV1 Lite** (`Jeishoon-bit/AnimeAV1-Lite-CS`), diseñada para carga rápida, bajo consumo de recursos y navegación sencilla en español.

## Funcionalidades principales

- **Catálogo por secciones**: *Últimos Añadidos*, *En Emisión* y *Películas* con paginación.
- **Búsqueda en vivo**: Filtrado por título, sinopsis, estudio o género desde `/api/search`.
- **Ficha de título y episodios**: Carga de sinopsis, estado (`En emisión` / `Finalizado`), géneros y lista ordenada de episodios (`/api/anime/:id`).
- **Extractor de servidores y reproductor**: Extracción de hasta 8 fuentes por episodio (`Streamwish`, `Filemoon`, `Vidhide`, `Voe`, `Lulustream`, `Mp4upload`, etc.), selector de servidor, atajos de teclado y descarga de lista `.m3u8`.
- **Mi Lista e historial local**: Guardado persistente en `localStorage` del último episodio visto y títulos favoritos.

## Scripts

```bash
npm install
npm run dev
npm run build
npm start
```
