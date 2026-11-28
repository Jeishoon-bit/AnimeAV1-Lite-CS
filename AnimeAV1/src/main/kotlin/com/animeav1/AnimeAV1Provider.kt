package com.animeav1

import com.lagradost.cloudstream3.*
import com.lagradost.cloudstream3.LoadResponse.Companion.addAniListId
import com.lagradost.cloudstream3.LoadResponse.Companion.addMalId
import com.lagradost.cloudstream3.utils.*
import com.fasterxml.jackson.annotation.JsonProperty
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import java.net.URLEncoder
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

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
        private val EPISODE_URL_NUM_REGEX = Regex("""/(\d+(?:\.\d+)?)/?$""")
        private val TEXT_NUM_REGEX = Regex("""(\d+(?:\.\d+)?)""")
        private val SCRIPT_EPISODES_START_REGEX = Regex("""episodes\s*:\s*\[""")
        private val SCRIPT_EPISODE_NUMBER_REGEX = Regex("""number\s*:\s*"?(\d+(?:\.\d+)?)"?""")
        private val SCRIPT_STATUS_REGEX = Regex("""status\s*:\s*(\d+)""")
        private val SCRIPT_CATEGORY_SLUG_REGEX = Regex("""category\s*:\s*\{[^}]*slug\s*:\s*"([^"]+)"""")
        private val SCRIPT_NEXT_DATE_REGEX = Regex("""nextDate\s*:\s*"(\d{4}-\d{2}-\d{2})"""")
        private val SEASON_TITLE_REGEX = Regex("""\s*\(?temporada.*?\)?""", RegexOption.IGNORE_CASE)
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
        "$mainUrl/catalogo?order=latest_added&page=" to "Últimos Añadidos",
        "$mainUrl/catalogo?status=emision&order=latest_released&page=" to "En Emisión",
        "$mainUrl/catalogo?category=pelicula&order=latest_added&page=" to "Películas",
        "$mainUrl/catalogo?category=ova&order=latest_added&page=" to "OVAs",
        "$mainUrl/catalogo?category=especial&order=latest_added&page=" to "Especiales",
        "$mainUrl/catalogo?order=popular&page=" to "Más Populares"
    )

    override suspend fun getMainPage(page: Int, request: MainPageRequest): HomePageResponse {
        val url = "${request.data}$page"
        val doc = app.get(url, headers = HEADERS, timeout = 12L).document

        val defaultType = when {
            request.data.contains("pelicula") -> TvType.AnimeMovie
            request.data.contains("ova") -> TvType.OVA
            else -> TvType.Anime
        }

        val items = parseCatalogCards(doc.select("div.grid article, article.group\\/item"), defaultType)

        return newHomePageResponse(
            list = HomePageList(
                name = request.name,
                list = items,
                isHorizontalImages = false
            ),
            hasNext = items.isNotEmpty()
        )
    }

    private fun parseCatalogCards(
        elements: Iterable<Element>,
        defaultType: TvType = TvType.Anime,
        limit: Int = Int.MAX_VALUE
    ): List<SearchResponse> {
        val seenUrls = HashSet<String>(32)
        val results = ArrayList<SearchResponse>(24)

        for (element in elements) {
            if (results.size >= limit) break
            val item = element.toSearchResult(defaultType) ?: continue
            if (seenUrls.add(item.url)) {
                results.add(item)
            }
        }
        return results
    }

    private fun Element.toSearchResult(defaultType: TvType = TvType.Anime): SearchResponse? {
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
            badgeText.contains("película") || badgeText.contains("pelicula") || badgeText.contains("movie") -> TvType.AnimeMovie
            badgeText.contains("ova") -> TvType.OVA
            else -> defaultType
        }

        return newAnimeSearchResponse(title, href, tvType) {
            this.posterUrl = posterUrl
        }
    }

    override suspend fun quickSearch(query: String): List<SearchResponse> {
        val clean = query.trim()
        if (clean.length < 2) return emptyList()
        val encoded = URLEncoder.encode(clean, "UTF-8")
        val searchUrl = "$mainUrl/catalogo?search=$encoded"
        val doc = app.get(searchUrl, headers = HEADERS, timeout = 8L).document
        return parseCatalogCards(
            doc.select("div.grid article, article.group\\/item"),
            TvType.Anime,
            MAX_QUICK_SEARCH_RESULTS
        )
    }

    override suspend fun search(query: String): List<SearchResponse> {
        val clean = query.trim()
        if (clean.isEmpty()) return emptyList()
        val encoded = URLEncoder.encode(clean, "UTF-8")
        val searchUrl = "$mainUrl/catalogo?search=$encoded"
        val doc = app.get(searchUrl, headers = HEADERS, timeout = 12L).document
        return parseCatalogCards(doc.select("div.grid article, article.group\\/item"))
    }

    // Integración ligera con AniList GraphQL para portadas HD, banners, sinopsis y próximo episodio en emisión
    data class AniListCover(val extraLarge: String?, val large: String?)
    data class AniListNextAiring(val airingAt: Long?, val timeUntilAiring: Long?, val episode: Int?)
    data class AniListMedia(
        val id: Int?,
        val coverImage: AniListCover?,
        val bannerImage: String?,
        val description: String?,
        val averageScore: Int?,
        val nextAiringEpisode: AniListNextAiring?
    )
    data class AniListData(@JsonProperty("Media") val media: AniListMedia?)
    data class AniListResponse(val data: AniListData?)
    data class AniListMeta(
        val id: Int?,
        val posterUrl: String?,
        val bannerUrl: String?,
        val description: String?,
        val score: Int?,
        val nextAiring: NextAiring?
    )

    private suspend fun queryAniList(query: String, variables: Map<String, Any>): AniListMeta? {
        return try {
            val payload = mapOf("query" to query, "variables" to variables)
            val res = app.post("https://graphql.anilist.co", json = payload, timeout = 5L).parsedSafe<AniListResponse>()
            val media = res?.data?.media ?: return null

            val nowSec = System.currentTimeMillis() / 1000L
            val nextAiringObj = media.nextAiringEpisode?.let { next ->
                val ep = next.episode
                val unixSec = next.airingAt
                    ?: next.timeUntilAiring?.takeIf { it > 0L }?.let { nowSec + it }
                if (ep != null && unixSec != null && unixSec > nowSec) {
                    NextAiring(episode = ep, unixTime = unixSec)
                } else {
                    null
                }
            }

            AniListMeta(
                id = media.id,
                posterUrl = media.coverImage?.extraLarge ?: media.coverImage?.large,
                bannerUrl = media.bannerImage,
                description = media.description,
                score = media.averageScore,
                nextAiring = nextAiringObj
            )
        } catch (e: Exception) {
            null
        }
    }

    private suspend fun fetchAniListMetadata(title: String, malId: Int? = null): AniListMeta? {
        if (malId != null) {
            queryAniList(
                query = "query (\$idMal: Int) { Media(idMal: \$idMal, type: ANIME) { id coverImage { extraLarge large } bannerImage description averageScore nextAiringEpisode { airingAt timeUntilAiring episode } } }",
                variables = mapOf("idMal" to malId)
            )?.let { return it }
        }

        val cleanTitle = title.replace(SEASON_TITLE_REGEX, "").trim()
        if (cleanTitle.isEmpty()) return null
        return queryAniList(
            query = "query (\$search: String) { Media(search: \$search, type: ANIME) { id coverImage { extraLarge large } bannerImage description averageScore nextAiringEpisode { airingAt timeUntilAiring episode } } }",
            variables = mapOf("search" to cleanTitle)
        )
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

        val svelteData = doc.select("script")
            .firstOrNull { it.data().contains("episodes:[") }
            ?.data()
            .orEmpty()

        val infoText = doc.selectFirst("main header, .anime-info, .details, main")?.text().orEmpty()
        val scriptStatus = SCRIPT_STATUS_REGEX.find(svelteData)?.groupValues?.getOrNull(1)?.toIntOrNull()
        val showStatus = when (scriptStatus) {
            2 -> ShowStatus.Ongoing
            0 -> ShowStatus.Completed
            else -> when {
                infoText.contains("En emisión", ignoreCase = true) -> ShowStatus.Ongoing
                infoText.contains("Finalizado", ignoreCase = true) -> ShowStatus.Completed
                else -> null
            }
        }

        val scriptCategory = SCRIPT_CATEGORY_SLUG_REGEX.find(svelteData)?.groupValues?.getOrNull(1)?.lowercase()
        val tvType = when (scriptCategory) {
            "pelicula" -> TvType.AnimeMovie
            "ova" -> TvType.OVA
            "tv-anime", "ona", "especial" -> TvType.Anime
            else -> when {
                infoText.contains("Película", ignoreCase = true) || infoText.contains("pelicula", ignoreCase = true) -> TvType.AnimeMovie
                infoText.contains("OVA", ignoreCase = true) -> TvType.OVA
                else -> TvType.Anime
            }
        }

        val cleanBaseUrl = url.substringBefore('?').substringBefore('#').trimEnd('/')
        val seenEpisodes = HashSet<String>(64)
        val sortableEpisodes = ArrayList<Pair<Double, Episode>>(64)

        // 1. Extraer lista completa de episodios desde el payload embebido en <script> (evita el límite de 50 en DOM)
        for (script in doc.select("script")) {
            val scriptData = script.data()
            if (!scriptData.contains("episodes")) continue
            val epSlice = extractScriptEpisodesSlice(scriptData) ?: continue
            for (match in SCRIPT_EPISODE_NUMBER_REGEX.findAll(epSlice)) {
                val rawNum = match.groupValues[1]
                val sortNum = rawNum.toDoubleOrNull() ?: continue
                val epHref = "$cleanBaseUrl/$rawNum"
                if (!seenEpisodes.add(epHref)) continue

                sortableEpisodes.add(
                    sortNum to newEpisode(epHref) {
                        this.name = "Episodio $rawNum"
                        this.episode = sortNum.toInt()
                    }
                )
            }
            if (sortableEpisodes.isNotEmpty()) break
        }

        // 2. Complementar con enlaces directos del DOM sin duplicar
        for (epEl in doc.select("a[href*=/ver/], a[href*=/episodio/], .episodes a, a[href*=/media/], a[href*=@]")) {
            val rawHref = fixUrlNull(epEl.attr("href")) ?: continue
            val epHref = rawHref.substringBefore('?').substringBefore('#').trimEnd('/')
            val isDirectMediaEp = EPISODE_URL_NUM_REGEX.containsMatchIn(epHref) && epHref.contains("/media/")
            val isWatchPath = epHref.contains("/ver/") || epHref.contains("/episodio/")
            if (!isDirectMediaEp && !isWatchPath) continue
            if (!seenEpisodes.add(epHref)) continue

            val epText = epEl.text().trim()
            val rawNum = EPISODE_URL_NUM_REGEX.find(epHref)?.groupValues?.getOrNull(1)
                ?: TEXT_NUM_REGEX.find(epText)?.groupValues?.getOrNull(1)
            val sortNum = rawNum?.toDoubleOrNull() ?: Double.MAX_VALUE
            val epInt = rawNum?.toDoubleOrNull()?.toInt()

            sortableEpisodes.add(
                sortNum to newEpisode(epHref) {
                    this.name = if (epText.isNotBlank() && epText.toIntOrNull() == null) {
                        epText
                    } else {
                        "Episodio ${rawNum ?: (sortableEpisodes.size + 1)}"
                    }
                    this.episode = epInt
                }
            )
        }

        // 3. Fallback si no se encontraron episodios ni en script ni en DOM
        if (sortableEpisodes.isEmpty()) {
            val fallbackCount = if (tvType == TvType.AnimeMovie || tvType == TvType.OVA) 1 else 12
            for (i in 1..fallbackCount) {
                sortableEpisodes.add(
                    i.toDouble() to newEpisode("$cleanBaseUrl/$i") {
                        this.name = if (fallbackCount == 1) "Película / OVA Completa" else "Episodio $i"
                        this.episode = i
                    }
                )
            }
        }

        sortableEpisodes.sortBy { it.first }
        val episodes = sortableEpisodes.map { it.second }

        val slug = cleanBaseUrl.substringAfterLast('/')
        val malId = if (slug.isNotBlank() && svelteData.isNotEmpty()) {
            Regex("""slug\s*:\s*"${Regex.escape(slug)}"\s*,\s*malId\s*:\s*(\d+)""")
                .find(svelteData)?.groupValues?.getOrNull(1)?.toIntOrNull()
        } else {
            null
        }

        // Consultar AniList para portadas HD, banners, sinopsis y próximo estreno en emisión
        val aniListMeta = fetchAniListMetadata(title, malId)
        val nowSeconds = System.currentTimeMillis() / 1000L

        val fallbackNextAiring = if (aniListMeta?.nextAiring == null && showStatus == ShowStatus.Ongoing) {
            val nextDateStr = SCRIPT_NEXT_DATE_REGEX.find(svelteData)?.groupValues?.getOrNull(1)
            val parsedUnix = nextDateStr?.let { parseUtcDateToUnixSeconds(it) }
            if (parsedUnix != null && parsedUnix > nowSeconds) {
                val nextEpNumber = (episodes.maxOfOrNull { it.episode ?: 0 } ?: 0) + 1
                NextAiring(episode = nextEpNumber, unixTime = parsedUnix)
            } else {
                null
            }
        } else {
            null
        }

        val resolvedNextAiring = if (showStatus != ShowStatus.Completed) {
            (aniListMeta?.nextAiring ?: fallbackNextAiring)?.takeIf { it.unixTime > nowSeconds }
        } else {
            null
        }

        val countdownBanner = resolvedNextAiring?.let {
            formatAiringCountdown(it.episode, it.unixTime, nowSeconds)
        }

        val finalPoster = aniListMeta?.posterUrl ?: fixUrlNull(poster)
        val finalBanner = aniListMeta?.bannerUrl
        val basePlot = aniListMeta?.description?.let { Jsoup.parse(it).text() } ?: description
        val finalPlot = when {
            countdownBanner != null && !basePlot.isNullOrBlank() -> "$countdownBanner\n\n$basePlot"
            countdownBanner != null -> countdownBanner
            else -> basePlot
        }

        return newAnimeLoadResponse(title, url, tvType) {
            this.posterUrl = finalPoster
            this.backgroundPosterUrl = finalBanner
            this.plot = finalPlot
            this.tags = tags
            this.showStatus = showStatus
            this.nextAiring = resolvedNextAiring
            addMalId(malId)
            addAniListId(aniListMeta?.id)
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

    private fun extractScriptEpisodesSlice(scriptData: String): String? {
        val startMatch = SCRIPT_EPISODES_START_REGEX.find(scriptData) ?: return null
        val openBracketIndex = startMatch.range.last
        var depth = 0
        var inString = false
        var stringChar = '\u0000'
        var escaped = false

        for (i in openBracketIndex until scriptData.length) {
            val ch = scriptData[i]
            if (escaped) {
                escaped = false
                continue
            }
            if (inString) {
                if (ch == '\\') {
                    escaped = true
                } else if (ch == stringChar) {
                    inString = false
                }
                continue
            }
            when (ch) {
                '"', '\'' -> {
                    inString = true
                    stringChar = ch
                }
                '[' -> depth++
                ']' -> {
                    depth--
                    if (depth == 0) {
                        return scriptData.substring(openBracketIndex, i + 1)
                    }
                }
            }
        }
        return null
    }

    private fun parseUtcDateToUnixSeconds(dateStr: String): Long? {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val parsed = sdf.parse(dateStr) ?: return null
            (parsed.time / 1000L) + 43_200L // mediodía UTC aproximado si no hay hora exacta
        } catch (e: Exception) {
            null
        }
    }

    private fun formatAiringCountdown(episode: Int, airingAtSeconds: Long, nowSeconds: Long): String? {
        val remaining = airingAtSeconds - nowSeconds
        if (remaining <= 0L) return null

        val days = remaining / 86_400L
        val hours = (remaining % 86_400L) / 3_600L
        val minutes = (remaining % 3_600L) / 60L

        val timeText = when {
            days > 0L -> "${days}d ${hours}h ${minutes}m"
            hours > 0L -> "${hours}h ${minutes}m"
            minutes > 0L -> "${minutes}m"
            else -> "menos de 1m"
        }
        return "⏳ Próximo capítulo (Ep. $episode): en $timeText"
    }

    private fun isLikelyVideoHost(lowerUrl: String): Boolean {
        return STREAM_HOSTS_PRIORITY.any { lowerUrl.contains(it) }
    }
}
