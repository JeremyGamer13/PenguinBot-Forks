const compatibleAudio = [
    'png', 'jpeg', 'jpg', 'webp', 'avif', 'gif',
    'heif', 'heic', 'x-tiff', 'tiff', 'quicktime'
];

const isCompatibleImage = (mimeEnding) => {
    return compatibleAudio.includes(mimeEnding);
};

module.exports = isCompatibleImage;