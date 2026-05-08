const TextModifierCommand = require('../../basecommands/textmodifier');

const mappings = {
    "A": "𝒜",
    "B": "𝓑", // Mathematical Bold Script Capital B
    "C": "𝒞",
    "D": "𝒟",
    "E": "𝑬",  // Mathematical Italic E (U+1D434)
    "F": "𝑭",  // Mathematical Italic F (U+1D435)
    "G": "𝒢",
    "H": "𝓗", // Mathematical Bold Script Capital H
    "I": "ℐ",  // Script Capital I (U+2110)
    "J": "𝒥",
    "K": "𝒦",
    "L": "ℒ",  // Script Capital L (U+2112)
    "M": "𝒨",
    "N": "𝒩",
    "O": "𝒪",
    "P": "𝒫",
    "Q": "𝒬",
    "R": "ℛ",  // Script Capital R (U+211B)
    "S": "𝒮",
    "T": "𝒯",
    "U": "𝒰",
    "V": "𝒱",
    "W": "𝒲",
    "X": "𝒳",
    "Y": "𝒴",
    "Z": "𝒵",
    "a": "𝒶",
    "b": "𝒷",
    "c": "𝒸",
    "d": "𝒹",
    "e": "𝑒",  // Mathematical Italic e (U+1D452)
    "f": "𝒻",
    "g": "𝑔",  // Mathematical Italic g (U+1D454)
    "h": "𝒽",
    "i": "𝑖",  // Mathematical Italic i (U+1D456)
    "j": "𝑗",  // Mathematical Italic j (U+1D457)
    "k": "𝓀",
    "l": "𝓁",
    "m": "𝓂",
    "n": "𝓃",
    "o": "𝑜",  // Mathematical Italic o (U+1D45C)
    "p": "𝓅",
    "q": "𝓆",
    "r": "𝓇",
    "s": "𝓈",
    "t": "𝓉",
    "u": "𝓊",
    "v": "𝓋",
    "w": "𝓌",
    "x": "𝓍",
    "y": "𝓎",
    "z": "𝓏"
};

class Command extends TextModifierCommand {
    constructor(client, state) {
        super(client, state);
        this.name = "freak";
        this.description = "Turn your text 𝒻𝓇𝑒𝒶𝓀𝓎.";
        this.textDescription = "Text to convert from.";
        this.example = [
            { text: `${state.prefix}freak Hello my text is here` },
            { text: `${state.prefix}freak (replying to a message)` },
        ];
        this.setSlashDetail();
    }

    /**
     * Modify the input text
     * @param {string} text 
     * @returns {string}
     */
    modify(text) {
        return text.split("").map(char => mappings[char] || char).join("");
    }
}

// needs to do new Command() in index.js because typing static every time STINKS!
module.exports = Command;