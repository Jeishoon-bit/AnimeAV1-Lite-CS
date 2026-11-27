package com.animeav1

import com.lagradost.cloudstream3.*
import com.lagradost.cloudstream3.utils.*
import org.jsoup.Jsoup
import org.jsoup.nodes.Element

class AnimeAV1Provider : MainAPI() {
    override var mainUrl = "https://animeav1.com"
    override var name = "AnimeAV1 Lite"
    override val hasMainPage = true
    override var lang = "es"
    override val hasQuickSearch = true
    override val hasDownloadSupport = true
    override val supportedTypes = setOf(
        TvType.Anime,
        TvType.AnimeMovie,
        TvType.OVA
    )

    // Timeouts optimizados para dispositivos rápidos y Android TV antiguos
    override val getMainPageTimeoutMs = 12_000L
    override val searchTimeoutMs = 12_000L
    override val quickSearchTimeoutMs = 8_000L
    override val loadTimeoutMs = 15_000L
    override val loadLinksTimeoutMs = 15_000L

    companion object {
        private const val USER_AGENT =
            "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"

        private val HEADERS = mapOf(
            "User-Agent" to USER_AGENT,
            "Accept" to "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language" to "es-ES,es;q=0.9"
        )

        // Regex precompilados en memoria única
        private val EPISODE_URL_NUM_REGEX = Regex("""/(\d+)/?$""")
        private val TEXT_NUM_REGEX = Regex("""(\d+)""")
        private val TITLE_PREFIX_REGEX = Regex("""^(?:Portada|Póster)\s+de\s+""", RegexOption.IGNORE_CASE)
        private val SCRIPT_URL_REGEX = Regex("""https?:\\/\\/[^"'\s\\<>]+|https?://[^"'\s<>]+""")

        private val STREAM_HOSTS_PRIORITY = listOf(
            "zilla-networks", "streamwish", "filemoon", "vidhide", "voe",
            "byselapuix", "lulustream", "dood", "ok.ru", "mp4upload",
            "uqload", "mixdrop", "yourupload", "sendvid", "embed", "player"
        )

        private val DOWNLOAD_ONLY_HOSTS = listOf("mega.nz", "1fichier", "transfer.it")

        private const val MAX_PARALLEL_EXTRACTORS = 6
        private const val MAX_QUICK_SEARCH_RESULTS = 10
    }

    override val mainPage = mainPageOf(
        "$mainUrl/catalogo?order=latest&page=" to "Últimos Añadidos",
        "$mainUrl/catalogo?status=emision&page=" to "En Emisión",
        "$mainUrl/catalogo?type=pelicula&page=" to "Películas",
        "$mainUrl/catalogo?type=ova&page=" to "OVAs"
    )

    override suspend fun getMainPage(page: Int, request: MainPageRequest): HomePageResponse {
        val url = "${request.data}$page"
        val doc = app.get(url, headers = HEADERS, timeout = 12L).document

        val targetType = when {
            request.data.contains("pelicula") -> TvType.AnimeMovie
            request.data.contains("ova") -> TvType.OVA
            else -> null
        }

        val requireOngoing = request.data.contains("status=emision")

        val items = parseCatalogCards(doc.select("article, .anime-card, .grid > div"), targetType, requireOngoing)

        return newHomePageResponse(
            list = HomePageList(
                name = request.name,
                list = items,
                isHorizontalImages = false
            ),
            hasNext = items.size >= 12
        )
    }

    private fun parseCatalogCards(
        elements: Iterable<Element>,
        targetType: TvType? = null,
        requireOngoing: Boolean = false,
        limit: Int = Int.MAX_VALUE
    ): List<SearchResponse> {
        val seenUrls = HashSet<String>(32)
        val results = ArrayList<SearchResponse>(24)

        for (element in elements) {
            if (results.size >= limit) break
            val item = element.toSearchResult() ?: continue

            // Filtrado estricto por categoría para evitar duplicados o mezcla entre tabs
            if (targetType != null && item.type != targetType) continue
            if (requireOngoing) {
                val badgeText = element.select(".text-subs, .type, .status").text().lowercase()
                if (badgeText.contains("finalizado") || badgeText.contains("película") || badgeText.contains("ova")) continue
            }

            if (seenUrls.add(item.url)) {
                results.add(item)
            }
        }
        return results
    }

    private fun Element.toSearchResult(): SearchResponse? {
        val linkEl = selectFirst("a[href*=/media/], a[href*=/anime/], a") ?: return null
        val href = fixUrlNull(linkEl.attr("href")) ?: return null
        if (href == mainUrl || href == "$mainUrl/") return null

        val headingTitle = selectFirst("h3, h2, .title")?.text()?.trim()
        val imgEl = selectFirst("img")
        val rawTitle = if (!headingTitle.isNullOrBlank()) {
            headingTitle
        } else {
            imgEl?.attr("alt")?.replace(TITLE_PREFIX_REGEX, "")?.trim()
        }
        val title = rawTitle?.takeIf { it.isNotBlank() } ?: return null

        val posterUrl = imgEl?.let { img ->
            val rawSrc = img.attr("data-src").ifBlank {
                img.attr("srcset").substringBefore(" ").ifBlank { img.attr("src") }
            }
            fixUrlNull(rawSrc)
        }

        val badgeText = selectFirst(".text-subs, .type")?.text()?.trim()?.lowercase().orEmpty()
        val tvType = when {
            badgeText.contains("película") || badgeText.contains("pelicula") -> TvType.AnimeMovie
            badgeText.contains("ova") -> TvType.OVA
            else -> TvType.Anime
        }

        return newAnimeSearchResponse(title, href, tvType) {
            this.posterUrl = posterUrl
        }
    }

    override suspend fun quickSearch(query: String): List<SearchResponse> {
        val clean = query.trim()
        if (clean.length < 2) return emptyList()
        val searchUrl = "$mainUrl/catalogo?search=${clean.replace(" ", "+")}"
        val doc = app.get(searchUrl, headers = HEADERS, timeout = 8L).document
        return parseCatalogCards(
            doc.select("article, .anime-card, .grid > div"),
            null,
            false,
            MAX_QUICK_SEARCH_RESULTS
        )
    }

    override suspend fun search(query: String): List<SearchResponse> {
        val clean = query.trim()
        if (clean.isEmpty()) return emptyList()
        val searchUrl = "$mainUrl/catalogo?search=${clean.replace(" ", "+")}"
        val doc = app.get(searchUrl, headers = HEADERS, timeout = 12L).document
        return parseCatalogCards(doc.select("article, .anime-card, .grid > div"))
    }

    // Integración ligera con AniList GraphQL para portadas HD, banners y sinopsis enriquecidas
    data class AniListCover(val extraLarge: String?, val large: String?)
    data class AniListMedia(val coverImage: AniListCover?, val bannerImage: String?, val description: String?, val averageScore: Int?)
    data class AniListData(val media: AniListMedia?)
    data class AniListResponse(val data: AniListData?)
    data class AniListMeta(val posterUrl: String?, val bannerUrl: String?, val description: String?, val score: Int?)

    private suspend fun fetchAniListMetadata(title: String): AniListMeta? {
        try {
            val cleanTitle = title.replace(Regex("""\s*\(?temporada.*?\)?""", RegexOption.IGNORE_CASE), "").trim()
            val query = "query (\$search: String) { Media(search: \$search, type: ANIME) { coverImage { extraLarge large } bannerImage description averageScore } }"
            val variables = mapOf("search" to cleanTitle)
            val payload = mapOf("query" to query, "variables" to variables)

            val res = app.post("https://graphql.anilist.co", json = payload, timeout = 5L).parsedSafe<AniListResponse>()
            val media = res?.data?.media ?: return null
            return AniListMeta(
                posterUrl = media.coverImage?.extraLarge ?: media.coverImage?.large,
                bannerUrl = media.bannerImage,
                description = media.description,
                score = media.averageScore
            )
        } catch (e: Exception) {
            return null
        }
    }

    override suspend fun load(url: String): LoadResponse? {
        val doc = app.get(url, headers = HEADERS, timeout = 15L).document

        val title = doc.selectFirst("h1")?.text()?.trim() ?: return null
        val poster = doc.selectFirst("meta[property=og:image]")?.attr("content")
            ?: doc.selectFirst("img.poster, main img")?.attr("src")
        val description = doc.selectFirst("p.synopsis, .description, main p")?.text()?.trim()
            ?.takeIf { it.isNotBlank() }
            ?: doc.selectFirst("meta[property=og:description]")?.attr("content")?.trim()
            ?: doc.selectFirst("meta[name=description]")?.attr("content")?.trim()

        val tags = doc.select("a[href*=genre], a[href*=genero], a[href*=categoria], .genres a")
            .mapNotNull { it.text().trim().takeIf(String::isNotBlank) }
            .distinct()

        val infoText = doc.selectFirst("main header, .anime-info, .details, main")?.text().orEmpty()
        val showStatus = when {
            infoText.contains("En emisión", ignoreCase = true) -> ShowStatus.Ongoing
            infoText.contains("Finalizado", ignoreCase = true) -> ShowStatus.Completed
            else -> null
        }

        val tvType = when {
            infoText.contains("Película", ignoreCase = true) || infoText.contains("pelicula", ignoreCase = true) -> TvType.AnimeMovie
            infoText.contains("OVA", ignoreCase = true) -> TvType.OVA
            else -> TvType.Anime
        }

        val seenEpisodes = HashSet<String>(32)
        val episodes = ArrayList<Episode>(24)

        for (epEl in doc.select("a[href*=/ver/], a[href*=/episodio/], .episodes a, a[href*=/media/]")) {
            val epHref = fixUrlNull(epEl.attr("href")) ?: continue
            val isDirectMediaEp = EPISODE_URL_NUM_REGEX.containsMatchIn(epHref) && epHref.contains("/media/")
            val isWatchPath = epHref.contains("/ver/") || epHref.contains("/episodio/")
            if (!isDirectMediaEp && !isWatchPath) continue
            if (!seenEpisodes.add(epHref)) continue

            val epText = epEl.text().trim()
            val epNum = EPISODE_URL_NUM_REGEX.find(epHref)?.groupValues?.getOrNull(1)?.toIntOrNull()
                ?: TEXT_NUM_REGEX.find(epText)?.groupValues?.getOrNull(1)?.toIntOrNull()

            episodes.add(
                newEpisode(epHref) {
                    this.name = if (epText.isNotBlank() && epText.toIntOrNull() == null) {
                        epText
                    } else {
                        "Episodio ${epNum ?: (episodes.size + 1)}"
                    }
                    this.episode = epNum
                }
            )
        }

        episodes.sortBy { it.episode ?: Int.MAX_VALUE }

        // Consultar AniList en paralelo para enriquecer portadas HD, banners y sinopsis
        val aniListMeta = fetchAniListMetadata(title)
        val finalPoster = aniListMeta?.posterUrl ?: fixUrlNull(poster)
        val finalBanner = aniListMeta?.bannerUrl
        val finalPlot = aniListMeta?.description?.let { Jsoup.parse(it).text() } ?: description

        return newAnimeLoadResponse(title, url, tvType) {
            this.posterUrl = finalPoster
            this.backgroundPosterUrl = finalBanner
            this.plot = finalPlot
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
        val streamCandidates = LinkedHashSet<String>(12)
        val backupCandidates = LinkedHashSet<String>(4)

        fun collectCandidate(raw: String?) {
            val fixed = fixUrlNull(raw) ?: return
            val lower = fixed.lowercase()
            if (DOWNLOAD_ONLY_HOSTS.any { lower.contains(it) }) {
                backupCandidates.add(fixed)
            } else if (isLikelyVideoHost(lower)) {
                streamCandidates.add(fixed)
            }
        }

        for (iframe in doc.select("iframe[src]")) {
            val src = fixUrlNull(iframe.attr("src")) ?: continue
            streamCandidates.add(src)
        }

        for (el in doc.select("[data-url], [data-embed], [data-video], [data-src]")) {
            val raw = el.attr("data-url")
                .ifBlank { el.attr("data-embed") }
                .ifBlank { el.attr("data-video") }
                .ifBlank { el.attr("data-src") }
            collectCandidate(raw)
        }

        for (script in doc.select("script")) {
            val content = script.data()
            if (content.length < 24) continue
            for (match in SCRIPT_URL_REGEX.findAll(content)) {
                val cleanUrl = match.value.replace("\\/", "/")
                collectCandidate(cleanUrl)
            }
        }

        val prioritized = (streamCandidates + backupCandidates).take(MAX_PARALLEL_EXTRACTORS)
        if (prioritized.isEmpty()) return false

        prioritized.amap { embedUrl ->
            loadExtractor(embedUrl, data, subtitleCallback, callback)
        }

        return true
    }

    private fun isLikelyVideoHost(lowerUrl: String): Boolean {
        return STREAM_HOSTS_PRIORITY.any { lowerUrl.contains(it) }
    }
}
