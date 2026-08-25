DIRE COUNTY RP - ANIMATED LOADSCREEN v1.2.0
===========================================

WHAT THIS VERSION DOES
----------------------
- Uses your finished Dire County background unchanged.
- Adds an exact transparent red-eye mask over the Dire wolf's existing white eyes.
- Idle red eye glow/pulse (constant).
- A very slow, almost-invisible drifting cloud/fog layer over the sky (constant).
- Faint constant movement inside the locomotive's existing smoke plume (constant).
- Lightning randomly draws through the open sky on the left or right of the logo
  roughly every 6-18 seconds (occasional), with a chance of a quick follow-up strike.
- A rare, more violent "mega storm" of 3-4 back-to-back strikes about every 30-60
  seconds, on top of the regular lightning above.
- Lightning briefly illuminates the clouds, mountains, road, train and town, and
  makes the wolf's eyes flare brighter.
- Optional delayed thunder audio hook, timed to follow each flash - off until you
  supply a sound file (see THUNDER AUDIO below).
- Loading-screen music through YouTube's official embedded player API.
- Adjustable in-game music volume slider + play/pause button.
- Remembers each player's last volume setting when Chromium storage is available.
- A loading bar wired to FiveM/RedM's real loading progress, with a gentle preview
  animation so it's still visible when you open the HTML directly in a browser.
- Rotating tip text under the loading bar - add as many as you like in config.js.
- No VORP files are touched.

SELECTED LOADING SONG
---------------------
The current config is already set to:

   https://www.youtube.com/watch?v=npyT6lBkOWA

The loadscreen extracts the YouTube video ID automatically. Normal youtube.com,
youtu.be and music.youtube.com links with a video ID are supported.

INSTALL
-------
1. Put the entire "dire_loadscreen" folder in your RedM resources folder.

   Example:
   resources/[dire]/dire_loadscreen

2. Add this to server.cfg:

   ensure dire_loadscreen

3. Make sure no other resource is defining another loadscreen.
   Only one active loadscreen should be used.

4. Restart the server and reconnect normally to test the actual Cfx/RedM loading flow.

MOUSE / VOLUME SLIDER
---------------------
fxmanifest.lua now includes:

   loadscreen_cursor 'yes'

This is required so players can use the music slider and play/pause button while
RedM is loading.

YOUTUBE MUSIC CONFIG
--------------------
Open:

   html/config.js

Look for the "music" block:

   music: {
       enabled: true,
       source: 'youtube',
       youtubeUrl: 'https://www.youtube.com/watch?v=npyT6lBkOWA',
       defaultVolume: 28,
       autoplay: true,
       loop: true,
       startSeconds: 0,
       rememberVolume: true,
       showControls: true
   }

Useful settings:
- youtubeUrl: paste another YouTube or YouTube Music URL here later.
- defaultVolume: starting volume from 0-100 for a player with no saved preference.
- autoplay: automatically attempts to start the track when YouTube is ready.
- loop: restarts the selected song when it ends.
- startSeconds: begin farther into the song if desired.
- rememberVolume: remembers the player's volume preference when storage is available.
- showControls: hides/shows the visible play/pause + volume controls.

YOUTUBE LIMITATIONS
-------------------
The music is streamed from YouTube; no YouTube audio file is downloaded or included
inside this resource. That means:
- The player needs internet access to YouTube while loading.
- The selected video must permit embedded playback.
- YouTube can block or change availability for a video at any time.
- Some Chromium environments can reject audible autoplay. The loadscreen attempts
  autoplay first; touching the music button or volume slider provides a user gesture
  and retries playback.
- A plain file:// browser preview may behave differently from the actual RedM NUI.
  The real RedM loading screen is the important test.
- If YouTube returns an embed error (for example video-owner embed restrictions),
  use another embeddable YouTube upload or provide a local audio file you have the
  right to use and we can switch the player to a local fallback.

Only use music you have permission/right to use for your server/loading screen.

QUICK BROWSER PREVIEW
---------------------
Open:

   dire_loadscreen/html/index.html

in Chrome or Edge to preview the visuals. The RedM version uses the same HTML/CSS/
JavaScript animation. Because a real RedM client isn't sending loading events in a
plain browser tab, the loading bar gently creeps on its own (capped below 100%) purely
so you can see it while testing.

YouTube itself may not accept playback from a file:// page. If the visual preview
works but music does not, test it inside RedM before assuming the music code failed.

TUNING
------
Open:

   html/config.js

Every section is commented. The main knobs:
- eyes: idle glow strength/speed
- lightning: how often ordinary strikes happen, brightness, side bias
- megaStorm: how often the rare multi-strike burst happens, and how many strikes
- music: YouTube URL, default volume, autoplay, looping and visible controls
- thunder: delayed thunder audio - see THUNDER AUDIO below
- clouds: how long one full drift pass across the sky takes (60-90s recommended)
- smoke: how fast the locomotive's smoke rises/sways
- loadingBar: on/off, and whether to show the browser preview animation
- tips: intervalSeconds and the "items" array of tip strings

THUNDER AUDIO (OPTIONAL)
------------------------
Delayed thunder is wired up in code but ships disabled because no sound file is
included. To turn it on:
1. Add a short thunder sound as html/audio/thunder.mp3 (or .ogg).
2. In config.js, under "thunder", set enabled: true (and update "src" if you
   used a different filename/path).
3. Add the same path to the "files" list in fxmanifest.lua, e.g.
   'html/audio/thunder.mp3'

NOTES
-----
The animation is deliberately made with lightweight HTML/CSS/SVG instead of a large
looping MP4. The cloud and smoke overlays are small textures.

The artboard preserves the exact source image aspect ratio, so every overlay stays
aligned with the wolf and the train even when a player uses a different monitor
aspect ratio. Wider or taller displays may crop a little from the outer edges, just
like an object-fit: cover background. The loading bar/tips and music controls are
pinned to the actual viewport so they stay usable regardless of aspect ratio.


=== LOCAL MUSIC v1.3.0 ===
Place johnny.mp3 in: html/audio/johnny.mp3
The loadscreen is already configured to autoplay it at 28% with a volume slider.
