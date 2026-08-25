fx_version 'cerulean'
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
game 'rdr3'

author 'Dire County RP'
description 'Dire County animated RedM loading screen'
version '1.3.0'

loadscreen 'html/index.html'
loadscreen_cursor 'yes'

files {
    'html/index.html',
    'html/style.css',
    'html/config.js',
    'html/script.js',
    'html/images/dire_background.png',
    'html/images/dire_eyes_red.png',
    'html/images/cloud_fog.png',
    'html/images/smoke_wisp.png',
    'html/audio/*.mp3',
    'html/audio/*.ogg',
    'html/audio/*.wav'
    -- If you add a thunder sound (see config.js "thunder" block), also add
    -- its path here, e.g. 'html/audio/thunder.mp3'
}
