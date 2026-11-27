# AnimeAV1-Lite-CS

Extensión y repositorio minimalista de **AnimeAV1** para **Cloudstream 3**, optimizado para bajo consumo de RAM, carga rápida y compatibilidad con Android TV antiguos (`minSdk = 21`).

## Instalación en Cloudstream 3

En **Cloudstream** → **Ajustes** → **Extensiones** → **Añadir repositorio**, pega la URL de **`repo.json`** (no `plugins.json`):

```text
https://raw.githubusercontent.com/Jeishoon-bit/AnimeAV1-Lite-CS/main/repo.json
```

También puedes abrirlo con el enlace directo:

```text
cloudstreamrepo://raw.githubusercontent.com/Jeishoon-bit/AnimeAV1-Lite-CS/main/repo.json
```

### Usar el código corto `av1lite`

Cloudstream resuelve códigos cortos sin `https://` consultando `https://cutt.ly/<codigo>`. Para activar **`av1lite`**:

1. Entra en [cutt.ly](https://cutt.ly/) y acorta la URL:
   `https://raw.githubusercontent.com/Jeishoon-bit/AnimeAV1-Lite-CS/main/repo.json`
2. Personaliza el alias (custom alias) con el nombre **`av1lite`** (quedará `https://cutt.ly/av1lite`).
3. Después, en Cloudstream → **Añadir repositorio**, bastará con escribir **`av1lite`**.

## Optimizaciones incluidas

- **Lectura selectiva del DOM**: Evita concatenar todo el documento con `doc.text()` en fichas largas, leyendo solo las secciones de metadatos e información.
- **Expresiones regulares precompiladas**: Todas las `Regex` están declaradas en `companion object` para evitar asignaciones repetidas de memoria.
- **Parseo adaptado al HTML actual de AnimeAV1**:
  - Prioriza `h3, h2, .title` antes de `img[alt]` para obtener títulos limpios sin el prefijo `"Portada de ..."`.
  - Detecta episodios tanto en rutas `/media/<slug>/<episodio>` como en `/ver/` o `/episodio/`.
  - Extrae servidores de vídeo desde `iframe`, atributos `data-*` y payloads en `<script>` limitando a **6 extractores paralelos** con `amap` (sin bloquear hilos con `runBlocking`).
- **Búsqueda rápida (`quickSearch`) y timeouts ajustados**: Respuesta rápida limitada a 10 resultados al escribir desde el control remoto.

## Compilación local del plugin `.cs3`

```bash
gradle make makePluginsJson
```
