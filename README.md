<p align="center">
  <img src="crow.jpg" width="160" height="160" alt="AnimeAV1 Lite Logo" style="border-radius: 50%;">
</p>

<h1 align="center">AnimeAV1-Lite-CS</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Cloudstream-Extension-7c3aed?style=flat-square&logo=android&logoColor=white" alt="Cloudstream">
  <img src="https://img.shields.io/badge/Theme-Black%20%26%20Purple-a855f7?style=flat-square" alt="Theme">
  <img src="https://img.shields.io/badge/RAM-Optimized-purple?style=flat-square" alt="Optimized">
  <img src="https://img.shields.io/badge/Android%20TV-Compatible-blueviolet?style=flat-square" alt="Android TV">
</p>

---

Extensión y repositorio minimalista de **AnimeAV1** para **Cloudstream 3**, optimizado para bajo consumo de RAM, carga rápida, integración con AniList y compatibilidad con Android TV antiguos (`minSdk = 21`).

## 📥 Instalación en Cloudstream 3

En **Cloudstream** → **Ajustes** → **Extensiones** → **Añadir repositorio**, pega la URL de **`repo.json`**:

```text
https://raw.githubusercontent.com/Jeishoon-bit/AnimeAV1-Lite-CS/main/repo.json
```

También puedes abrirlo con el enlace directo:

```text
cloudstreamrepo://raw.githubusercontent.com/Jeishoon-bit/AnimeAV1-Lite-CS/main/repo.json
```

## 🚀 Optimizaciones incluidas

- **Lectura selectiva del DOM**: Evita concatenar todo el documento con `doc.text()` en fichas largas, leyendo solo las secciones de metadatos e información.
- **AniList GraphQL Integración**: Portadas en alta resolución, banners panorámicos (`backgroundPosterUrl`) y calificaciones integradas automáticamente.
- **Categorías estrictas**: Separación limpia entre *Últimos*, *En Emisión*, *Películas* y *OVAs*.
- **Extractores paralelos seguros**: Extracción de vídeo con `amap` limitada a 6 hilos simultáneos para proteger dispositivos de bajos recursos y Android TV antiguos.

## 🛠️ Compilación local del plugin `.cs3`

```bash
gradle make makePluginsJson
```
