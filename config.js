/* Dire County loading screen tuning.
   You can change these values without touching the animation code. */
window.DIRE_LOADSCREEN = {
    eyes: {
        enabled: true,
        idleMinOpacity: 0.42,
        idleMaxOpacity: 0.95,
        pulseSeconds: 3.8,
        lightningFlareOpacity: 1.0,
        flareHoldMs: 130,
        flareFadeMs: 1200
    },

    lightning: {
        enabled: true,

        /* Random pause between ordinary storms (occasional tier). */
        minDelayMs: 6000,
        maxDelayMs: 18000,

        /* Chance that one storm produces a quick follow-up strike. */
        doubleStrikeChance: 0.34,

        /* Keep lightning away from the center logo most of the time. */
        sideBias: true,

        /* Overall brightness of the landscape during a strike. */
        sceneFlashBrightness: 1.32,

        /* Lightning path duration. */
        drawMs: 105,
        lingerMs: 135,

        /* Turn this off if you prefer no subtle idle eye glow. */
        eyesReactToLightning: true
    },

    /* Rare, more violent bursts on top of the normal lightning above.
       These fire 3-4 quick strikes back to back instead of just one or two. */
    megaStorm: {
        enabled: true,
        minDelayMs: 30000,
        maxDelayMs: 60000,
        minStrikes: 3,
        maxStrikes: 4,
        strikeGapMinMs: 130,
        strikeGapMaxMs: 340,
        intensityBoost: 1.22
    },

    /* Loading-screen music (local file for reliable RedM autoplay).
       Put your song at html/audio/johnny.mp3.
       Local audio avoids YouTube embed/origin/autoplay problems. */
    music: {
        enabled: true,
        source: 'local',
        localFile: 'audio/johnny.mp3',
        defaultVolume: 28,
        autoplay: true,
        loop: true,
        rememberVolume: true,
        showControls: true,
        fadeInMs: 1400,
        fadeOutMs: 900
    },

    /* Delayed thunder audio, timed to follow the flash like real distant thunder.
       Off by default because no audio file ships with this resource yet.
       Drop a short thunder .ogg/.mp3 into html/audio/thunder.mp3, then set
       enabled: true below (and adjust the path if you named it differently). */
    thunder: {
        enabled: false,
        src: 'audio/thunder.mp3',
        volume: 0.55,
        delayMinMs: 450,
        delayMaxMs: 1600,
        megaStormVolume: 0.75
    },

    /* Very slow drifting cloud/fog layer over the sky, on constantly.
       Meant to be almost invisible - just enough that the scene never looks
       like a still image even between lightning strikes. */
    clouds: {
        enabled: true,
        /* One full left-to-right pass, in seconds. Keep this between 60-90
           for a slow, barely-there drift. */
        driftSeconds: 78
    },

    /* Faint constant movement in the locomotive's smoke plume. */
    smoke: {
        enabled: true,
        /* Seconds for one full rise cycle of the smoke texture. */
        riseSeconds: 17,
        /* Seconds for one gentle side-to-side sway cycle. */
        swaySeconds: 9
    },

    /* Loading bar shown at the bottom of the screen. Hooks into FiveM's real
       loadProgress/shutdownLoadingScreen events automatically. In a plain
       browser preview (no game events firing) it gently animates on its own
       so it's still visible while you're testing. */
    loadingBar: {
        enabled: true,
        /* Fallback animation used only when no real game progress event has
           arrived yet - lets you preview the bar in a browser tab. */
        previewFallback: false
    },

    /* Tips shown below the loading bar. Add as many strings as you want to
       the "items" array below - nothing else needs to change, they'll be
       picked up automatically and cycled in order. */
    tips: {
        enabled: true,
        intervalSeconds: 5,
        items: [
            'Hydrate up, bitch, you might die!'
            'Wheres my vodka?'
        ]
    }
};
