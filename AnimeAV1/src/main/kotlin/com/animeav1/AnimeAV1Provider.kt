package com.animeav1

import com.lagradost.cloudstream3.*
import com.lagradost.cloudstream3.utils.*
import org.jsoup.nodes.Element

class AnimeAV1Provider : MainAPI() {
    override var mainUrl = "https://animeav1.com"
    override var name = "AnimeAV1 Lite"
    override val hasMainPage = true
    override var lang = "es"
    override val hasDownloadSupport = true
    override val supportedTypes = setOf(
        TvType.Anime,
        TvType.AnimeMovie,
        TvType.OVA
    )

    companion object {
        private const val USER_AGENT =
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"

        private val HEADERS = mapOf(
            "User-Agent" to USER_AGENT,
            "Accept" to "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language" to "es-ES,es;q=0.9"
        )
    }

    override val mainPage = mainPageOf(
        "$mainUrl/catalogo?order=latest&page=" to "Últimos Añadidos",
        "$mainUrl/catalogo?status=emision&page=" to "En Emisión",
        "$mainUrl/catalogo?type=pelicula&page=" to "Películas"
    )

    override suspend fun getMainPage(page: Int, request: MainPageRequest): HomePageResponse {
        val url = "${request.data}$page"
        val doc = app.get(url, headers = HEADERS, timeout = 15L).document

        val items = doc.select("article, .anime-card, .grid > div").mapNotNull { element ->
            element.toSearchResult()
        }.distinctBy { it.url }

        return newHomePageResponse(
            list = HomePageList(
                name = request.name,
                list = items,
                isHorizontalImages = false
            ),
            hasNext = items.isNotEmpty()
        )
    }

    private fun Element.toSearchResult(): SearchResponse? {
        val linkEl = selectFirst("a[href*=/media/], a[href*=/anime/], a") ?: return null
        val href = fixUrlNull(linkEl.attr("href")) ?: return null
        if (href == mainUrl || href == "$mainUrl/") return null

        val title = selectFirst("h2, h3, .title, img")?.let {
            it.text().ifBlank { it.attr("alt") }
        }?.trim() ?: return null

        val posterUrl = selectFirst("img")?.let { img ->
            fixUrlNull(
                img.attr("data-src").ifBlank {
                    img.attr("srcset").substringBefore(" ").ifBlank { img.attr("src") }
                }
            )
        }

        return newAnimeSearchResponse(title, href, TvType.Anime) {
            this.posterUrl = posterUrl
        }
    }

    override suspend fun search(query: String): List<SearchResponse> {
        val searchUrl = "$mainUrl/catalogo?search=${query.trim().replace(" ", "+")}"
        val doc = app.get(searchUrl, headers = HEADERS, timeout = 15L).document

        return doc.select("article, .anime-card, .grid > div")
            .mapNotNull { it.toSearchResult() }
            .distinctBy { it.url }
    }

    override suspend fun load(url: String): LoadResponse? {
        val doc = app.get(url, headers = HEADERS, timeout = 15L).document

        val title = doc.selectFirst("h1")?.text()?.trim() ?: return null
        val poster = doc.selectFirst("meta[property=og:image]")?.attr("content")
            ?: doc.selectFirst("img.poster, main img")?.attr("src")
        val description = doc.selectFirst("meta[property=og:description]")?.attr("content")
            ?: doc.selectFirst("p.synopsis, .description, main p")?.text()?.trim()

        val tags = doc.select("a[href*=genre], a[href*=genero], .genres a")
            .map { it.text().trim() }
            .filter { it.isNotBlank() }

        val statusText = doc.text()
        val showStatus = when {
            statusText.contains("En emisión", ignoreCase = true) -> ShowStatus.Ongoing
            statusText.contains("Finalizado", ignoreCase = true) -> ShowStatus.Completed
            else -> null
        }

        val episodes = doc.select("a[href*=/ver/], a[href*=/episodio/], .episodes a")
            .mapNotNull { epEl ->
                val epHref = fixUrlNull(epEl.attr("href")) ?: return@mapNotNull null
                val epText = epEl.text().trim()
                val epNum = Regex("""(\d+)""").find(epText)?.groupValues?.getOrNull(1)?.toIntOrNull()
                newEpisode(epHref) {
                    this.name = if (epText.isNotBlank()) epText else "Episodio ${epNum ?: ""}"
                    this.episode = epNum
                }
            }
            .distinctBy { it.data }
            .sortedBy { it.episode ?: 0 }

        return newAnimeLoadResponse(title, url, TvType.Anime) {
            this.posterUrl = fixUrlNull(poster)
            this.plot = description
            this.tags = tags
            this.showStatus = showStatus
            addEpisodes(DubStatus.Subbed, episodes)
        }
    }

    override suspend fun loadLinks(
        data: String,
        isCasting: Boolean,
        subtitleCallback: (SubtitleFile) -> Unit,
        callback: (ExtractorLink) -> Unit
    ): Boolean {
        val doc = app.get(data, headers = HEADERS, timeout = 15L).document
        val candidateUrls = LinkedHashSet<String>()

        // 1. Buscar iframes directos
        doc.select("iframe[src]").forEach { iframe ->
            val src = fixUrlNull(iframe.attr("src"))
            if (!src.isNullOrBlank()) candidateUrls.add(src)
        }

        // 2. Buscar botones o atributos data-url / data-embed / data-video
        doc.select("[data-url], [data-embed], [data-video], [data-src]").forEach { el ->
            val raw = el.attr("data-url")
                .ifBlank { el.attr("data-embed") }
                .ifBlank { el.attr("data-video") }
                .ifBlank { el.attr("data-src") }
            val fixed = fixUrlNull(raw)
            if (!fixed.isNullOrBlank()) candidateUrls.add(fixed)
        }

        // 3. Extraer URLs embebidas en scripts ligeros (JSON / arrays de servidores)
        val scriptRegex = Regex("""https?:\\/\\/[^"'\s\\]+|https?://[^"'\s]+""")
        doc.select("script").forEach { script ->
            val content = script.data()
            if (content.contains("embed", true) || content.contains("player", true) || content.contains("stream", true)) {
                scriptRegex.findAll(content).forEach { match ->
                    val cleanUrl = match.value.replace("\\/", "/")
                    if (isLikelyVideoHost(cleanUrl)) {
                        candidateUrls.add(cleanUrl)
                    }
                }
            }
        }

        // Procesar los servidores encontrados en paralelo (máximo 8 para no saturar TV antiguos)
        candidateUrls.take(8).apmap { embedUrl ->
            loadExtractor(embedUrl, data, subtitleCallback, callback)
        }

        return candidateUrls.isNotEmpty()
    }

    private fun isLikelyVideoHost(url: String): Boolean {
        val lower = url.lowercase()
        return listOf(
            "streamwish", "filemoon", "voe", "dood", "mp4upload",
            "ok.ru", "uqload", "vidhide", "lulustream", "mixdrop",
            "mega", "yourupload", "sendvid", "embed", "player"
        ).any { lower.contains(it) }
    }
}
