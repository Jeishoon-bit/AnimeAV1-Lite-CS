# AnimeAV1-Lite-CS

Extensión y repositorio minimalista de **AnimeAV1** para **Cloudstream 3**, optimizado para bajo consumo de RAM, carga rápida y compatibilidad con Android TV antiguos (`minSdk = 21`).

## Optimizaciones incluidas

- **Lectura selectiva del DOM**: Evita concatenar todo el documento con `doc.text()` en fichas largas, leyendo solo las secciones de metadatos e información.
- **Expresiones regulares precompiladas**: Todas las `Regex` están declaradas en `companion object` para evitar asignaciones repetidas de memoria.
- **Parseo adaptado al HTML actual de AnimeAV1**:
  - Prioriza `h3, h2, .title` antes de `img[alt]` para obtener títulos limpios sin el prefijo `"Portada de ..."`.
  - Detecta episodios tanto en rutas `/media/<slug>/<episodio>` como en `/ver/` o `/episodio/`.
  - Extrae servidores de vídeo desde `iframe`, atributos `data-*` y payloads en `<script>` (Zilla, Voe, Mp4upload, Streamwish, Filemoon, Vidhide, Lulustream, etc.) limitando a **6 extractores paralelos** para no saturar TV Boxes antiguos.
- **Búsqueda rápida (`quickSearch`) y timeouts ajustados**: Respuesta rápida limitada a 10 resultados al escribir desde el control remoto.

## Instalación en Cloudstream 3

1. Abre **Cloudstream** → **Ajustes** → **Extensiones** → **Añadir repositorio**.
2. Pega la URL RAW de `repo.json` de tu repositorio de GitHub:
   `https://raw.githubusercontent.com/<tu-usuario>/AnimeAV1-Lite-CS/main/repo.json`
3. Instala **AnimeAV1 Lite** desde la lista del repositorio.

## Compilación local del plugin `.cs3`

```bash
./gradlew make makePluginsJson
```
