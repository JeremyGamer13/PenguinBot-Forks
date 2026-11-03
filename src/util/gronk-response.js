const discord = require("discord.js");

const env = require("./env-util");

/**
 * current behavior is temp incase people wanmt to get pre-picked responses from a local hosted ai's rating
 * @param {string} text what did they say
 * @param {discord.TextChannel?} channel where did they say it
 * @param {string?} reply A message that this was asked upon
 */
const gronkResponse = async (text, channel, reply) => {
    const responses = [
        "yea yea",
        "heeeeell no",
        "mm mm",
        "As an AI language model, I eat sand and dirt all the time",
        "Bzzz bzz error stupid",
        "nah",
        "seems like a No",
        "seems like a Yeaheyea!",
        "Once upon a time there was a man named Johnathan Oracles. He ate it all",
        "idik",
        "you stink kinda",
        "uuuuuuuuuhhhh yea",
        "give it like a " + Math.round(Math.random() * 10) + "/10",
        "mmmmmyummy",
        "iugiufwe;j;wj;njnjna",
        "gronk more like pooop idiot Lol",
        "your idiot",
        "you know what i think im just gonna stand my ground I dont really wanna do that",
    ];

    return responses[Math.round(Math.random() * (responses.length - 1))];
};

module.exports = gronkResponse;