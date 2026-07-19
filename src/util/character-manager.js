const fs = require("fs/promises");
const path = require("path");

const uuid = require("uuid");

const Database = require('sync-json-database');
const CharacterDatabase = new Database('./databases/characters.json', { indented: true });
const CharacterDataPath = path.resolve("./data/characters/");

const Lua = require("./lua.js");

class CharacterManager {
    static async create({ id, name, color, imageBuffer, author, authorName }) {
        const stableId = uuid.v4();
        // save the character image
        const imagePath = path.join(CharacterDataPath, `char-${stableId}.png`);
        await fs.mkdir(path.dirname(imagePath), { recursive: true });
        await fs.writeFile(imagePath, imageBuffer);
        // save the character
        const characterInfo = {
            id: id,
            idStable: stableId,
            name: name,
            color: color,
            imagePath: imagePath,
            author: author,
            authorName: authorName,
        };
        CharacterDatabase.set(id, characterInfo);
    }
    static update(id, newInfo = {}) {
        const characterInfo = CharacterDatabase.get(id);
        delete newInfo.imageBuffer;
        CharacterDatabase.set(id, {
            ...characterInfo,
            ...newInfo,
        });
    }
    static async updateImage(id, newBuffer) {
        throw new Error("Not implemented");
    }

    static get(id) {
        return CharacterDatabase.get(id);
    }
    static getList() {
        return structuredClone(CharacterDatabase.data);
    }
    static async getImage(id) {
        const characterInfo = CharacterDatabase.get(id);
        return await fs.readFile(characterInfo.imagePath);
    }
    static has(id) {
        return CharacterDatabase.has(id);
    }
    static async delete(id) {
        // delete the image aswell but make sure it's actually a proper file
        const characterInfo = CharacterDatabase.get(id);
        if (characterInfo.imagePath) {
            if (typeof characterInfo.imagePath !== "string") throw new Error("Invalid image path");
            if (!characterInfo.imagePath.endsWith(".png")) throw new Error("Invalid image path");
            
            const stats = await fs.stat(characterInfo.imagePath);
            if (!stats.isFile()) throw new Error("Invalid image path");

            // ok delete it
            await fs.rm(characterInfo.imagePath);
        }

        // delete the entry
        CharacterDatabase.delete(id);
    }

    /**
     * Get a header for Lua code that adds globals for the specified action.
     * For example, most actions will have an `action.target` global. This will output the code responsible for that, which you prepend to Lua code before running.
     * @param {string} action The action
     * @param {"register"|"usage"} context `"register"` if we're testing code, `"usage"` if we're going to actually run the code for a real character command.
     * @param {Object<string, any>?} actionData Any related action data that can be put into the globals code. Usually you define `target` here, unless you are in the `"register"` context.
     * @param {string} actionScript The script itself.
     * @returns {string}
     */
    static getLuaContext(action, context = "usage", actionScript = "", actionData = {}) {
        // NOTE: in register mode, just use a random ID as a placeholder for actual info
        const targetCharacter = actionData.target ? this.get(actionData.target) : null;
        const randomId = uuid.v4();
        const randomName = uuid.v4() + uuid.v4();
        
        // this just makes the action global with the regular stuff
        const makeActionGlobal = `_G.action = {};_G.action.target = {};`
            + "" + `_G.action.type = ${Lua.stringify(action)};`
            + "" + `_G.action.target = ${Lua.stringify({
                id: context === "register" ? randomId : actionData.target,
                name: context === "register" ? randomName : targetCharacter.name,
                color: context === "register" ? "#ffffff" : targetCharacter.color,
            })};`
            + "\n";
        switch (action) {
            case "fight": {
                // NOTE: wewant to make a action:register so the user doesnt need to return extra things in their script
                const storedRegistry = this.makeLuaContextVariable();
                const returnedUserData = this.makeLuaContextVariable();
                const globalWrappingFunction = this.makeLuaContextVariable();
                return `${makeActionGlobal}`
                    + `local ${storedRegistry}={};` // this is where the action:register() info ends up
                    + `function _G.action:register(character);`
                    // validate the character info
                    + "" + `if not character then return error("No character info was provided into the registry");end;`
                    + "" + `if type(character.health)~="number"then return error("health must be a number");end;`
                    + "" + `if type(character.affinities)~="table"then return error("affinities must be a table");end;`
                    + "" + `if character.custom and type(character.custom)~="table"then return error("custom must be a table");end;`
                    // validate affinities (must be like { fire = 1.2 } with no NaN but infinity is allowed)
                    + "" + `for typee, multiplier in pairs(character.affinities)do;`
                    + "" + "" + `if type(typee)~="string"then return error("affinities contains invalid key");end;`
                    + "" + "" + `if type(multiplier)~="number"then return error("affinities contains invalid value");end;`
                    + "" + "" + `if multiplier~=multiplier then return error("affinities contains invalid multiplier");end;`
                    + "" + "end;"
                    // mark the registry as used
                    + "" + `${storedRegistry}={health=character.health,affinities=character.affinities,custom=character.custom};`
                    + "" + `${storedRegistry}.used = true;`
                    + `end;`
                    // insert the user code in a wrapper so we can return extra info too
                    + `local function ${globalWrappingFunction}();`
                    + "\n" + `${actionScript}`
                    + "\n" + `end; local ${returnedUserData}=(${globalWrappingFunction}());`
                    // validate that the registry was actually used
                    + `if not ${storedRegistry}.used then return error("No character info was provided into the registry"); end;`
                    // validate the user data
                    + `if type(${returnedUserData})~="table"then return error("The returned data must be a table");end;`
                    + `if type(${returnedUserData}.type)~="string"then return error("The returned data must be a table with a key of [\\"type\\"]:string");end;`
                    + `if type(${returnedUserData}.message)~="string"then return error("The returned data must be a table with a key of [\\"message\\"]:string");end;`
                    + `if type(${returnedUserData}.damage)~="number"then return error("The returned data must be a table with a key of [\\"damage\\"]:number");end;`
                    + `if ${returnedUserData}.custom and type(${returnedUserData}.custom)~="table"then return error("The returned data has custom which must be a table");end;`
                    // NOTE: we turn NaN into 0 because it may be from 0 / 0, so dont error
                    + `if ${returnedUserData}.damage~=${returnedUserData}.damage then ${returnedUserData}.damage=0;end;`
                    // we return userdata as well as the registry info
                    + `return {userdata=${returnedUserData},registry=(${storedRegistry})};`; 
            }
            // generic cases
            case "talk":
                return `${makeActionGlobal}${actionScript}`;
            default:
                throw new Error("No Lua context defined for this action");
        }
    }
    static makeLuaContextVariable() {
        return `v${uuid.v4()}${Math.random()}`
            .replace(/[^a-z0-9]/gi, "_");
    }
}

module.exports = CharacterManager;