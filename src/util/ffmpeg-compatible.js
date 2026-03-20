const compatibleAudio = [
    "3g2", "3gp", "4xm", "aa", "aac", "ac3", "ac4", "adts", "adx", "aea",
    "afc", "aiff", "alaw", "amr", "ape", "asf", "ast", "au", "avi", "basic",
    "bit", "caf", "codec2", "dash+xml", "daud", "dts", "dv", "eac3", "flac",
    "flv", "g722", "g723", "g726", "g729", "gsm", "hls", "ilbc", "ircam",
    "iss", "l16", "latm", "lrc", "m4a", "matroska", "midi", "mmf", "mov",
    "mp1", "mp2", "mp3", "mp4", "mpc", "mpeg", "mpeg3", "mpegts", "mulaw",
    "mxf", "oga", "ogg", "oma", "opus", "pcm", "qcelp", "rm", "rmf", "rtp",
    "rtsp", "sbg", "shn", "sox", "speex", "tak", "tta", "vnd.dlna.adts",
    "vnd.rn-realaudio", "vnd.smaf", "voc", "wav", "wave", "webm", "w64",
    "wma", "wv", "xa", "x-aac", "x-ac3", "x-adpcm", "x-aiff", "x-caf",
    "x-dca", "x-eac3", "x-flac", "x-gsm", "x-m4a", "x-matroska", "x-midi",
    "x-mod", "x-mp3", "x-mpeg", "x-mpeg3", "x-ms-asf", "x-ms-wma",
    "x-pn-realaudio", "x-pn-wav", "x-rmf", "x-speex", "x-vorbis+ogg",
    "x-wav", "xwma"
];
const compatibleVideo = [
    "3gpp", "3gpp2", "av1", "avi", "divx", "dv", "f4v", "fli", "flv", "gxf",
    "h261", "h263", "h263-1998", "h263-2000", "h264", "h265", "hevc", "ivf",
    "m4v", "mj2", "mjp2", "mkv", "mov", "mp2t", "mp4", "mp4v-es", "mpeg",
    "mpeg2", "mpeg4", "mpeg4-generic", "mpegts", "mxf", "nut", "ogg", "ogv",
    "quicktime", "rawvideo", "vc1", "vnd.dlna.mpeg-tts", "vnd.rn-realvideo",
    "vnd.vivo", "vp8", "vp9", "webm", "wmv", "x-f4v", "x-fli", "x-flv",
    "x-h264", "x-h265", "x-m4v", "x-matroska", "x-mjp2", "x-mpeg", "x-mpeg2",
    "x-mpegts", "x-ms-asf", "x-ms-wmv", "x-msvideo", "x-nut", "x-ogm",
    "x-pn-realvideo", "x-sgi-movie", "x-yuv4mpegpipe"
];

const isCompatibleAudio = (mimeEnding) => {
    return compatibleAudio.includes(mimeEnding);
};
const isCompatibleVidio = (mimeEnding) => {
    return compatibleVideo.includes(mimeEnding);
};

module.exports = {
    isCompatibleAudio,
    isCompatibleVidio,
};