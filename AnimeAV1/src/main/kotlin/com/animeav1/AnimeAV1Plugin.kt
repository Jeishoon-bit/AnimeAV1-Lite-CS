package com.animeav1

import android.content.Context
import com.lagradost.cloudstream3.plugins.CloudstreamPlugin
import com.lagradost.cloudstream3.plugins.Plugin

@CloudstreamPlugin
class AnimeAV1Plugin : Plugin() {
    override fun load(context: Context) {
        registerMainAPI(AnimeAV1Provider())
    }
}
