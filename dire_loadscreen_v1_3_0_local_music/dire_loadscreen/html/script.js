(() => {
    'use strict';

    const config = window.DIRE_LOADSCREEN || {};
    const eyesConfig = config.eyes || {};
    const lightningConfig = config.lightning || {};
    const megaStormConfig = config.megaStorm || {};
    const thunderConfig = config.thunder || {};
    const musicConfig = config.music || {};
    const cloudsConfig = config.clouds || {};
    const smokeConfig = config.smoke || {};
    const loadingBarConfig = config.loadingBar || {};
    const tipsConfig = config.tips || {};

    const artboard = document.getElementById('artboard');
    const redEyes = document.getElementById('redEyes');
    const stormGlow = document.getElementById('stormGlow');
    const cloudLayer = document.getElementById('cloudLayer');
    const smokeLayer = document.getElementById('smokeLayer');
    const loadingBarFill = document.getElementById('loadingBarFill');
    const tipText = document.getElementById('tipText');
    const musicControls = document.getElementById('musicControls');
    const musicToggle = document.getElementById('musicToggle');
    const musicToggleIcon = document.getElementById('musicToggleIcon');
    const musicVolume = document.getElementById('musicVolume');
    const musicVolumeValue = document.getElementById('musicVolumeValue');
    const musicStatus = document.getElementById('musicStatus');
    const loadingMusic = document.getElementById('loadingMusic');

    const boltGlowPath = document.getElementById('boltGlowPath');
    const boltCorePath = document.getElementById('boltCorePath');
    const branchGlowPath = document.getElementById('branchGlowPath');
    const branchCorePath = document.getElementById('branchCorePath');

    const W = 1672;
    const H = 941;

    /* Native pixel size of the generated overlay textures - used to work out
       exactly one tile's width/height at runtime so the drift loops are
       always seamless, at any viewport size or aspect ratio. */
    const CLOUD_IMG_W = 1700;
    const CLOUD_IMG_H = 941;
    const SMOKE_IMG_W = 480;
    const SMOKE_IMG_H = 560;

    let stormTimer = null;
    let flareTimer = null;
    let megaStormTimer = null;
    let cloudAnim = null;
    let smokeAnim = null;
    let resizeTimer = null;
    let tipTimer = null;
    let tipIndex = 0;
    let previewFallbackTimer = null;
    let realProgressReceived = false;
    let musicFadeTimer = null;
    let musicPlaying = false;
    let musicVolumeLevel = 28;
    let userPausedMusic = false;

    const random = (min, max) => min + Math.random() * (max - min);
    const randomInt = (min, max) => Math.floor(random(min, max + 1));

    function setCssConfig() {
        const root = document.documentElement;
        root.style.setProperty('--eye-min', String(eyesConfig.idleMinOpacity ?? 0.34));
        root.style.setProperty('--eye-max', String(eyesConfig.idleMaxOpacity ?? 0.72));
        root.style.setProperty('--eye-speed', `${eyesConfig.pulseSeconds ?? 3.8}s`);
        root.style.setProperty('--scene-flash-brightness', String(lightningConfig.sceneFlashBrightness ?? 1.32));
        root.style.setProperty('--smoke-sway-speed', `${smokeConfig.swaySeconds ?? 9}s`);

        if (eyesConfig.enabled === false) {
            redEyes.style.display = 'none';
        }
        if (cloudsConfig.enabled === false && cloudLayer) {
            cloudLayer.style.display = 'none';
        }
        if (smokeConfig.enabled === false && smokeLayer) {
            smokeLayer.style.display = 'none';
        }
    }

    /*
       Build a jagged lightning bolt in artwork coordinates. The bolt prefers the
       open sky on either side of the logo, and it never needs an image asset.
    */
    function buildBolt() {
        const useLeft = Math.random() < 0.5;
        const sideBias = lightningConfig.sideBias !== false;

        let startX;
        if (sideBias) {
            startX = useLeft ? random(95, 565) : random(1110, 1590);
        } else {
            startX = random(80, 1590);
        }

        const startY = random(-15, 70);
        const endY = random(300, 500);
        const segments = randomInt(8, 13);
        const direction = random(-0.23, 0.23);

        const points = [{ x: startX, y: startY }];
        let x = startX;
        let y = startY;

        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const nextY = startY + (endY - startY) * t;
            const drift = (endY - startY) * direction / segments;
            const jitter = random(-42, 42) * (1 - t * 0.28);

            x += drift + jitter;
            y = nextY;

            /* Nudge the bolt away from the main logo if it wanders inward. */
            if (sideBias && y > 95 && y < 610) {
                if (useLeft && x > 630) x -= random(35, 90);
                if (!useLeft && x < 1040) x += random(35, 90);
            }

            x = Math.max(35, Math.min(W - 35, x));
            points.push({ x, y });
        }

        const mainPath = pointsToPath(points);

        /* Create one shorter branch from the middle third. */
        const branchIndex = randomInt(Math.floor(segments * 0.38), Math.floor(segments * 0.7));
        const root = points[branchIndex];
        const branchPoints = [{ x: root.x, y: root.y }];
        let bx = root.x;
        let by = root.y;
        const branchSegments = randomInt(3, 5);
        const branchDir = Math.random() < 0.5 ? -1 : 1;

        for (let i = 1; i <= branchSegments; i++) {
            bx += branchDir * random(20, 54) + random(-12, 12);
            by += random(24, 48);
            branchPoints.push({ x: bx, y: by });
        }

        return {
            mainPath,
            branchPath: pointsToPath(branchPoints),
            strikeX: Math.max(0, Math.min(100, (startX / W) * 100)),
            strikeY: Math.max(0, Math.min(100, ((startY + 120) / H) * 100))
        };
    }

    function pointsToPath(points) {
        if (!points.length) return '';
        let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
        for (let i = 1; i < points.length; i++) {
            d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
        }
        return d;
    }

    function preparePath(path, d) {
        path.setAttribute('d', d);
        const length = Math.max(1, path.getTotalLength());
        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;
        path.style.opacity = '0';
        return length;
    }

    function animatePath(path, length, duration, delay = 0, peakOpacity = 1) {
        return path.animate(
            [
                { strokeDashoffset: length, opacity: 0 },
                { strokeDashoffset: 0, opacity: peakOpacity, offset: 0.70 },
                { strokeDashoffset: 0, opacity: 0, offset: 1 }
            ],
            {
                duration,
                delay,
                easing: 'linear',
                fill: 'forwards'
            }
        );
    }

    function flashScene(strikeX, strikeY, strength = 1) {
        stormGlow.style.setProperty('--strike-x', `${strikeX}%`);
        stormGlow.style.setProperty('--strike-y', `${strikeY}%`);

        artboard.classList.add('scene-flash');
        stormGlow.style.opacity = String(Math.min(1, 0.76 + strength * 0.16));

        setTimeout(() => {
            artboard.classList.remove('scene-flash');
            stormGlow.style.opacity = '';
        }, 90 + Math.round(strength * 35));
    }

    function flareEyes() {
        if (eyesConfig.enabled === false || lightningConfig.eyesReactToLightning === false) return;

        clearTimeout(flareTimer);
        redEyes.classList.add('lightning-flare');

        const hold = eyesConfig.flareHoldMs ?? 130;
        const fade = eyesConfig.flareFadeMs ?? 1200;

        flareTimer = setTimeout(() => {
            redEyes.classList.remove('lightning-flare');
            redEyes.style.transitionDuration = `${fade}ms`;
        }, hold);
    }

    /* Distant, delayed thunder to follow a flash. Disabled until a real audio
       file is provided - see the "thunder" block in config.js. */
    function playThunder(isMega = false) {
        if (thunderConfig.enabled !== true || !thunderConfig.src) return;

        const delay = randomInt(thunderConfig.delayMinMs ?? 450, thunderConfig.delayMaxMs ?? 1600);

        setTimeout(() => {
            try {
                const audio = new Audio(thunderConfig.src);
                audio.volume = isMega
                    ? (thunderConfig.megaStormVolume ?? 0.75)
                    : (thunderConfig.volume ?? 0.55);
                const playPromise = audio.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => { /* autoplay blocked or file missing - ignore */ });
                }
            } catch (err) {
                /* Missing/blocked audio should never break the loading screen. */
            }
        }, delay);
    }

    async function strike(intensity = 1, isMega = false) {
        const bolt = buildBolt();

        const mainGlowLength = preparePath(boltGlowPath, bolt.mainPath);
        const mainCoreLength = preparePath(boltCorePath, bolt.mainPath);
        const branchGlowLength = preparePath(branchGlowPath, bolt.branchPath);
        const branchCoreLength = preparePath(branchCorePath, bolt.branchPath);

        const drawMs = lightningConfig.drawMs ?? 105;
        const lingerMs = lightningConfig.lingerMs ?? 135;
        const total = drawMs + lingerMs;

        /* Small precursor glow, then the main landscape flash. */
        flashScene(bolt.strikeX, bolt.strikeY, 0.45 * intensity);

        setTimeout(() => {
            animatePath(boltGlowPath, mainGlowLength, total, 0, 0.96);
            animatePath(boltCorePath, mainCoreLength, total, 0, 1.0);
            animatePath(branchGlowPath, branchGlowLength, total * 0.82, drawMs * 0.16, 0.72);
            animatePath(branchCorePath, branchCoreLength, total * 0.82, drawMs * 0.16, 0.86);

            flashScene(bolt.strikeX, bolt.strikeY, 1.0 * intensity);
            flareEyes();
            playThunder(isMega);
        }, 58);

        /* A very fast second illumination makes the strike feel less synthetic. */
        setTimeout(() => {
            flashScene(bolt.strikeX, bolt.strikeY, 0.62 * intensity);
        }, 150);

        await new Promise(resolve => setTimeout(resolve, total + 190));
    }

    async function runStorm() {
        await strike(1);

        if (Math.random() < (lightningConfig.doubleStrikeChance ?? 0.34)) {
            await new Promise(resolve => setTimeout(resolve, randomInt(145, 430)));
            await strike(0.86);
        }

        scheduleNextStorm();
    }

    function scheduleNextStorm(initial = false) {
        if (lightningConfig.enabled === false) return;

        clearTimeout(stormTimer);
        const minDelay = lightningConfig.minDelayMs ?? 6000;
        const maxDelay = lightningConfig.maxDelayMs ?? 18000;
        const delay = initial ? random(1600, 3800) : random(minDelay, maxDelay);

        stormTimer = setTimeout(runStorm, delay);
    }

    /* Rare, heavier bursts: several strikes in quick succession instead of
       the usual single/double strike above. */
    async function runMegaStorm() {
        const count = randomInt(megaStormConfig.minStrikes ?? 3, megaStormConfig.maxStrikes ?? 4);
        const boost = megaStormConfig.intensityBoost ?? 1.22;

        for (let i = 0; i < count; i++) {
            await strike(boost, true);
            if (i < count - 1) {
                const gap = randomInt(megaStormConfig.strikeGapMinMs ?? 130, megaStormConfig.strikeGapMaxMs ?? 340);
                await new Promise(resolve => setTimeout(resolve, gap));
            }
        }

        scheduleNextMegaStorm();
    }

    function scheduleNextMegaStorm(initial = false) {
        if (megaStormConfig.enabled === false) return;

        clearTimeout(megaStormTimer);
        const minDelay = megaStormConfig.minDelayMs ?? 30000;
        const maxDelay = megaStormConfig.maxDelayMs ?? 60000;
        const delay = initial ? random(18000, 32000) : random(minDelay, maxDelay);

        megaStormTimer = setTimeout(runMegaStorm, delay);
    }

    /* ---------- Constant ambient motion: clouds + smoke ---------- */

    function startCloudDrift() {
        if (cloudsConfig.enabled === false || !cloudLayer || !artboard) return;
        if (cloudAnim) cloudAnim.cancel();

        const rect = artboard.getBoundingClientRect();
        if (!rect.height) return;
        const tileWidthPx = rect.height * (CLOUD_IMG_W / CLOUD_IMG_H);
        const durationMs = (cloudsConfig.driftSeconds ?? 78) * 1000;

        cloudAnim = cloudLayer.animate(
            [
                { backgroundPositionX: '0px' },
                { backgroundPositionX: `${tileWidthPx}px` }
            ],
            { duration: durationMs, iterations: Infinity, easing: 'linear' }
        );
    }

    function startSmokeDrift() {
        if (smokeConfig.enabled === false || !smokeLayer) return;
        if (smokeAnim) smokeAnim.cancel();

        const rect = smokeLayer.getBoundingClientRect();
        if (!rect.width) return;
        const tileHeightPx = rect.width * (SMOKE_IMG_H / SMOKE_IMG_W);
        const durationMs = (smokeConfig.riseSeconds ?? 17) * 1000;

        smokeAnim = smokeLayer.animate(
            [
                { backgroundPositionY: '0px' },
                { backgroundPositionY: `${-tileHeightPx}px` }
            ],
            { duration: durationMs, iterations: Infinity, easing: 'linear' }
        );
    }

    /* ---------- Loading-screen music (local HTML audio) ---------- */

    function clampVolume(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return 28;
        return Math.max(0, Math.min(100, Math.round(number)));
    }

    function setMusicStatus(message) {
        if (musicStatus) musicStatus.textContent = message || '';
    }

    function updateMusicButton() {
        if (!musicToggle || !musicToggleIcon) return;

        musicToggle.classList.toggle('is-playing', musicPlaying);
        musicToggle.setAttribute('aria-pressed', musicPlaying ? 'true' : 'false');
        musicToggle.setAttribute('aria-label', musicPlaying ? 'Pause loading music' : 'Play loading music');
        musicToggle.title = musicPlaying ? 'Pause music' : 'Play music';
        musicToggleIcon.textContent = musicPlaying ? 'Ⅱ' : '♪';
    }

    function updateVolumeUi(value) {
        const volume = clampVolume(value);
        musicVolumeLevel = volume;
        if (musicVolume) musicVolume.value = String(volume);
        if (musicVolumeValue) musicVolumeValue.value = `${volume}%`;
        if (musicVolumeValue) musicVolumeValue.textContent = `${volume}%`;
        if (musicControls) musicControls.style.setProperty('--music-volume', `${volume}%`);
    }

    function saveMusicVolume(value) {
        if (musicConfig.rememberVolume === false) return;
        try {
            localStorage.setItem('dire_loadscreen_music_volume', String(clampVolume(value)));
        } catch (err) {
            /* Storage is optional; failure should not affect playback. */
        }
    }

    function loadSavedMusicVolume() {
        let volume = clampVolume(musicConfig.defaultVolume ?? 28);
        if (musicConfig.rememberVolume !== false) {
            try {
                const saved = localStorage.getItem('dire_loadscreen_music_volume');
                if (saved !== null && saved !== '') volume = clampVolume(saved);
            } catch (err) {
                /* Ignore unavailable storage. */
            }
        }
        return volume;
    }

    function stopMusicFade() {
        if (musicFadeTimer) {
            clearInterval(musicFadeTimer);
            musicFadeTimer = null;
        }
    }

    function setAudioVolumeFraction(fraction) {
        if (!loadingMusic) return;
        loadingMusic.volume = Math.max(0, Math.min(1, fraction));
    }

    function fadeMusicTo(targetFraction, durationMs, pauseAtEnd = false) {
        if (!loadingMusic) return;
        stopMusicFade();

        const target = Math.max(0, Math.min(1, targetFraction));
        const duration = Math.max(0, Number(durationMs) || 0);
        const start = loadingMusic.volume;

        if (duration <= 0 || Math.abs(start - target) < 0.005) {
            setAudioVolumeFraction(target);
            if (pauseAtEnd && target <= 0.001) loadingMusic.pause();
            return;
        }

        const began = performance.now();
        musicFadeTimer = setInterval(() => {
            const elapsed = performance.now() - began;
            const t = Math.min(1, elapsed / duration);
            const eased = 1 - Math.pow(1 - t, 2);
            setAudioVolumeFraction(start + (target - start) * eased);

            if (t >= 1) {
                stopMusicFade();
                if (pauseAtEnd && target <= 0.001) loadingMusic.pause();
            }
        }, 30);
    }

    function applyMusicVolume(value, persist = true) {
        const volume = clampVolume(value);
        updateVolumeUi(volume);

        if (loadingMusic) {
            const target = volume / 100;
            /* While actively playing, slider changes should be immediate. */
            setAudioVolumeFraction(target);
            loadingMusic.muted = volume === 0;
        }

        if (persist) saveMusicVolume(volume);
    }

    async function tryPlayMusic(markAsUserAction = false) {
        if (!loadingMusic) return;
        if (markAsUserAction) userPausedMusic = false;

        try {
            loadingMusic.muted = musicVolumeLevel === 0;
            const target = musicVolumeLevel / 100;
            const fadeInMs = Math.max(0, Number(musicConfig.fadeInMs) || 0);

            if (fadeInMs > 0 && loadingMusic.paused) {
                setAudioVolumeFraction(0);
            } else {
                setAudioVolumeFraction(target);
            }

            const result = loadingMusic.play();
            if (result && typeof result.then === 'function') await result;
            musicPlaying = true;
            updateMusicButton();
            setMusicStatus('Loading music playing');

            if (fadeInMs > 0) fadeMusicTo(target, fadeInMs, false);
        } catch (err) {
            musicPlaying = false;
            updateMusicButton();
            if (musicControls) musicControls.classList.add('music-error');
            setMusicStatus('Autoplay was blocked - press the music button to start');
        }
    }

    function pauseMusic(userAction = true) {
        if (!loadingMusic) return;
        if (userAction) userPausedMusic = true;
        stopMusicFade();
        loadingMusic.pause();
        musicPlaying = false;
        updateMusicButton();
        setMusicStatus('Loading music paused');
    }

    function fadeOutMusic() {
        if (!loadingMusic || loadingMusic.paused) return;
        userPausedMusic = true;
        const fadeOutMs = Math.max(0, Number(musicConfig.fadeOutMs) || 0);
        fadeMusicTo(0, fadeOutMs, true);
        musicPlaying = false;
        updateMusicButton();
    }

    function toggleMusic() {
        if (!loadingMusic) return;
        if (loadingMusic.paused) {
            userPausedMusic = false;
            tryPlayMusic(true);
        } else {
            pauseMusic(true);
        }
    }

    function initMusic() {
        if (musicConfig.enabled === false || String(musicConfig.source || 'local').toLowerCase() !== 'local') {
            if (musicControls) musicControls.style.display = 'none';
            return;
        }

        if (!loadingMusic) {
            if (musicControls) musicControls.style.display = 'none';
            return;
        }

        if (musicConfig.showControls === false && musicControls) {
            musicControls.style.display = 'none';
        }

        musicVolumeLevel = loadSavedMusicVolume();
        updateVolumeUi(musicVolumeLevel);
        updateMusicButton();

        const src = String(musicConfig.localFile || 'audio/johnny.mp3').trim();
        loadingMusic.src = src;
        loadingMusic.loop = musicConfig.loop !== false;
        loadingMusic.preload = 'auto';
        loadingMusic.volume = musicVolumeLevel / 100;
        loadingMusic.muted = musicVolumeLevel === 0;

        loadingMusic.addEventListener('play', () => {
            musicPlaying = true;
            updateMusicButton();
        });
        loadingMusic.addEventListener('pause', () => {
            musicPlaying = false;
            updateMusicButton();
        });
        loadingMusic.addEventListener('error', () => {
            musicPlaying = false;
            updateMusicButton();
            if (musicControls) musicControls.classList.add('music-error');
            setMusicStatus(`Music file not found or unreadable: ${src}`);
        });

        if (musicToggle) musicToggle.addEventListener('click', toggleMusic);

        if (musicVolume) {
            const handleVolume = () => {
                applyMusicVolume(musicVolume.value, true);
                if (loadingMusic.paused && musicVolumeLevel > 0 && !userPausedMusic) tryPlayMusic(true);
            };
            musicVolume.addEventListener('input', handleVolume);
            musicVolume.addEventListener('change', handleVolume);
        }

        if (musicConfig.autoplay !== false) {
            /* CEF/RedM normally allows local loadscreen media autoplay. Calling
               play() explicitly gives us a clean fallback status if it does not. */
            tryPlayMusic(false);
        }
    }

    /* ---------- Loading bar ---------- */

    function setProgress(fraction) {
        if (!loadingBarFill) return;
        const pct = Math.max(0, Math.min(100, fraction * 100));
        loadingBarFill.style.width = `${pct}%`;
    }

    /* Only used until a real progress event shows up, so the bar isn't just
       sitting dead at 0% while previewing html/index.html in a browser tab. */
    function startPreviewFallback() {
        if (loadingBarConfig.previewFallback === false) return;

        let fake = 0;
        previewFallbackTimer = setInterval(() => {
            if (realProgressReceived) {
                clearInterval(previewFallbackTimer);
                return;
            }
            fake += (92 - fake) * 0.045;
            setProgress(fake / 100);
        }, 220);
    }

    function handleGameMessage(event) {
        const data = event.data || {};

        switch (data.eventName) {
            case 'loadProgress':
                realProgressReceived = true;
                if (previewFallbackTimer) clearInterval(previewFallbackTimer);
                if (typeof data.loadFraction === 'number') setProgress(data.loadFraction);
                break;
            case 'shutdownLoadingScreen':
            case 'shutdownLoadingScreenNui':
                realProgressReceived = true;
                if (previewFallbackTimer) clearInterval(previewFallbackTimer);
                setProgress(1);
                fadeOutMusic();
                break;
            default:
                break;
        }
    }

    function initLoadingBar() {
        if (loadingBarConfig.enabled === false || !loadingBarFill) return;
        window.addEventListener('message', handleGameMessage);
        startPreviewFallback();
    }

    /* ---------- Tips ---------- */

    function showTip(index, items) {
        if (!tipText) return;

        tipText.classList.remove('visible');
        setTimeout(() => {
            tipText.textContent = items[index % items.length];
            void tipText.offsetWidth; /* restart the fade-in transition */
            tipText.classList.add('visible');
        }, 300);
    }

    function initTips() {
        if (tipsConfig.enabled === false || !tipText) return;

        const items = (tipsConfig.items || []).filter(Boolean);
        if (!items.length) return;

        showTip(0, items);

        /* Only start the rotation timer once there's more than one tip to
           rotate to - avoids re-fading the same single tip every interval. */
        if (items.length > 1) {
            const intervalMs = (tipsConfig.intervalSeconds ?? 5) * 1000;
            clearInterval(tipTimer);
            tipTimer = setInterval(() => {
                tipIndex = (tipIndex + 1) % items.length;
                showTip(tipIndex, items);
            }, intervalMs);
        }
    }

    function init() {
        setCssConfig();
        scheduleNextStorm(true);
        scheduleNextMegaStorm(true);
        startCloudDrift();
        startSmokeDrift();
        initMusic();
        initLoadingBar();
        initTips();

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                startCloudDrift();
                startSmokeDrift();
            }, 200);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
