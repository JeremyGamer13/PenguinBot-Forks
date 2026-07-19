// NOTE: This doesnt steal entirely from fengari source but we do a lot of setup that copies from there
/**!
 * Source: fengari/src/linit.js
 * Source: fengari/src/lualib.js
 * Source: fengari/src/lapi.js
 * Source: fengari-interop/src/js.js
 * https://github.com/fengari-lua/fengari
 * https://github.com/fengari-lua/fengari-interop
 * 
 * Fengari & JS library for Fengari
 * License: MIT
 * 
 * MIT License
 *      
 * Copyright © 2017-2019 Benoit Giannangeli
 * Copyright © 2017-2025 Daurnimator
 * Copyright © 1994–2017 Lua.org, PUC-Rio.
 *     
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *     
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *     
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 */
/** */
const fs = require("fs/promises");
const path = require("path");

const fengari = require("fengari");
const { lua, lauxlib, lualib } = fengari;

const configuration = require("../config.js");

const env = require("./env-util.js");
const runNewThread = require("./multi-thread.js");
const { parse } = require('./json-circular.js');

// NOTE: Some Fengari stuff here taken from the source
const lbaselib = require("./lua-fengari-baselib.js");
const api_check = function(l, e, msg) {
    if (!e) throw Error(msg);
};
const index2addr = function(L, idx) {
    let ci = L.ci;
    if (idx > 0) {
        let o = ci.funcOff + idx;
        api_check(L, idx <= ci.top - (ci.funcOff + 1), "unacceptable index");
        // NOTE: in fengari this uses lobject.luaO_nilobject which we cant access so we throw
        if (o >= L.top) throw new Error("Cannot follow this branch of index2addr");
        else return L.stack[o];
    } else if (idx > lua.LUA_REGISTRYINDEX) {
        api_check(L, idx !== 0 && -idx <= L.top, "invalid index");
        return L.stack[L.top + idx];
    } else if (idx === lua.LUA_REGISTRYINDEX) {
        return L.l_G.l_registry;
    } else { /* upvalues */
        idx = lua.LUA_REGISTRYINDEX - idx;
        // NOTE: in fengari this uses lfunc.MAXUPVAL which we cant access so we use 255 (the hardcoded value as of now)
        api_check(L, idx <= 255 + 1, "upvalue index too large");
        if (ci.func.ttislcf()) /* light C function? */
            // NOTE: in fengari this uses lobject.luaO_nilobject which we cant access so we throw
            throw new Error("Cannot follow this branch of index2addr; it has no upvalues"); /* it has no upvalues */
        else {
            // NOTE: in fengari this uses lobject.luaO_nilobject which we cant access so we restructure this code to throw
            if (idx <= ci.func.value.nupvalues) return ci.func.value.upvalue[idx - 1];
            throw new Error("Cannot follow this branch of index2addr");
        }
    }
};

// NOTE: this is really hacky because i cant get interop or proxies to convert the table properly
const fengariHackyTValueToJS = (tvalue, _tables = {}) => {
    switch (tvalue.ttnov()) {
        case lua.LUA_TBOOLEAN:
            return !tvalue.l_isfalse();
        case lua.LUA_TNUMBER:
            return tvalue.value;
        case lua.LUA_TSTRING:
            return tvalue.jsstring();
        case lua.LUA_TTABLE:
            // if ()
            return fengariHackyTableRead(tvalue, _tables);

        // NOTE: everything below here, we can't realistically represent over a process boundary. js interop adds these but we dont care
        case lua.LUA_TFUNCTION:
            return ["LUA_TFUNCTION", lua.LUA_TFUNCTION];
        case lua.LUA_TTHREAD:
            return ["LUA_TTHREAD", lua.LUA_TTHREAD];
        // NOTE: these cant be created by lua on their own, but they would be a pointer to something in C
        case lua.LUA_TLIGHTUSERDATA:
            return ["LUA_TLIGHTUSERDATA", lua.LUA_TLIGHTUSERDATA];
        case lua.LUA_TUSERDATA:
            return ["LUA_TUSERDATA", lua.LUA_TUSERDATA];
        default:
            throw new Error("Unimplemented type inside raw fengari TValue for fengariHackyTValueToJS");
    }
};
const fengariHackyTableRead = (luaTable, _tables = {}) => {
    // list of parsed tables and addresses so that recurssion can be   not crashing
    if (luaTable.value.id in _tables) return _tables[luaTable.value.id];

    // check whether or not to represent as array or object (array if ipairs would work with it)
    const table = luaTable.value.strong;
    const tvalues = [];

    let isArray = true;
    const isArrayIndicies = new Set();
    for (const value of table) {
        const object = value[1];
        if (object.key.ttnov() !== lua.LUA_TNUMBER) {
            isArray = false;
        } else if (isArrayIndicies.has(object.key.value)) {
            // This is a bit of a weird case and probably wont trigger
            isArray = false;
        } else if (isArray) {
            isArrayIndicies.add(object.key.value);
        }
        tvalues.push(object);
    }

    // isArray will be true if: indices start at 1 and all numbers up to max are present (matches lua ipairs)
    const indicesArr = isArray ? Array.from(isArrayIndicies).sort((a, b) => a - b) : null;
    if (isArray && indicesArr.length > 0) {
        const maxIndex = Math.max(...indicesArr);
        // check that indices are consecutive starting at 1
        isArray = maxIndex === indicesArr.length && indicesArr.every((v, i) => v === i + 1);
    } else {
        // NOTE: this makes it so an empty Lua table {} is NOT an array
        isArray = false;
    }

    // NOTE: we cant use Map because it gets cleared over process boundary
    const jsTable = isArray ? [] : Object.create(null);
    _tables[luaTable.value.id] = jsTable;
    for (const tvalue of tvalues) {
        // parse the tableKey & tableValue to a JS type
        // NOTE: this is recursive in the case that the value is also a table
        const tableKey = fengariHackyTValueToJS(tvalue.key, _tables);
        const tableValue = fengariHackyTValueToJS(tvalue.value, _tables);

        // add to the js table
        if (isArray) {
            jsTable[tableKey - 1] = tableValue;
        } else {
            jsTable[tableKey] = tableValue;
        }
    }

    return jsTable;
};

class Lua {
    /**
     * Evaluates a bit of Lua code and returns the output from the Lua script.
     * Will throw if the Lua code throws an error.
     * 
     * If you want to add globals to the Lua code, it should be done by injecting it into the Lua code input.
     * There is a cross-process boundary that makes JS globals unreasonable to implement.
     * @param {string} str The Lua code to evaluate.
     * @returns {any}
     */
    static async evaluate(str) {
        // NOTE: DISABLE_FORKING means we have NO sandbox at all for blocking threads. So we just disable Lua entirely.
        if (env.getBool("DISABLE_FORKING"))
            throw new Error("Lua is unimplemented on DISABLE_FORKING for security");

        // run the thread and return the result from Lua
        const workerPath = path.join(__dirname, "../resources/worker/lua.worker.js");
        const result = await runNewThread(workerPath, path.resolve(__dirname, __filename), { luaCode: str }, 30000);
        return parse(result);
    }
    /**
     * Converts a JS value into something that can be inserted into Lua code.
     * Will throw if the value is not serializable.
     * 
     * This output can be used like:
     * ```lua
     * local value = ${stringify(value)}
     * ```
     * @param {any} value A value to stringify
     */
    static stringify(value) {
        if (typeof value === "undefined" || value === null) return "nil";
        if (typeof value === "boolean") return value ? "true" : "false";
        if (typeof value === "string") return JSON.stringify(value); // escapes quotes for us
        if (typeof value === "number") {
            if (isNaN(value)) return "(0/0)";
            if (!isFinite(value)) return `${value < 0 ? "-" : ""}math.huge`;
            if (Number.isSafeInteger(value)) return `${value}`;
            throw new Error("Cannot Lua.stringify because value:Number is not safe in Lua");
        }
        if (typeof value === "object") {
            if (Array.isArray(value))
                return `{${value.map(item => this.stringify(item)).join(",")}}`;
            
            // NOTE: maybe this allows maps?
            const tableValues = [];
            for (const key in value) {
                const entry = value[key];
                tableValues.push(`[${this.stringify(key)}]=${this.stringify(entry)}`);
            }
            return `{${tableValues.join(",")}}`;
        }
        
        throw new Error("Cannot Lua.stringify because value is not serializable for Lua");
    }

    // NOTE: Even though many of these don't have to be async with fengari, i'm opening it up for async later
    /** @private */
    static async _evaluate(str) {
        const luaState = await this._createFengariState();

        try {
            // NOTE: This will actually run the script
            const status = lauxlib.luaL_dostring(luaState, fengari.to_luastring(str));
            if (status !== lua.LUA_OK) {
                const error = lua.lua_tojsstring(luaState, -1);
                throw new Error(error);
            }

            // NOTE: we need to interpret the return value in JS properly (we somewhat follow interop here)
            const type = lua.lua_type(luaState, -1);
            switch (type) {
                case lua.LUA_TNONE:
                case lua.LUA_TNIL:
                    return void 0;
                case lua.LUA_TBOOLEAN:
                    return lua.lua_toboolean(luaState, -1);
                case lua.LUA_TNUMBER:
                    return lua.lua_tonumber(luaState, -1);
                case lua.LUA_TSTRING:
                    return lua.lua_tojsstring(luaState, -1);

                // NOTE: this is really hacky because i cant get interop or proxies to convert the table properly
                case lua.LUA_TTABLE:
                    const tvalue = index2addr(luaState, -1);
                    return fengariHackyTableRead(tvalue);

                // NOTE: everything below here, we can't realistically represent over a process boundary. js interop adds these but we dont care
                case lua.LUA_TFUNCTION:
                    return ["LUA_TFUNCTION", lua.LUA_TFUNCTION];
                case lua.LUA_TTHREAD:
                    return ["LUA_TTHREAD", lua.LUA_TTHREAD];
                // NOTE: these cant be created by lua on their own, but they would be a pointer to something in C
                case lua.LUA_TLIGHTUSERDATA:
                    return ["LUA_TLIGHTUSERDATA", lua.LUA_TLIGHTUSERDATA];
                case lua.LUA_TUSERDATA:
                    return ["LUA_TUSERDATA", lua.LUA_TUSERDATA];
                default:
                    throw new Error("Unexpected Lua type");
            }
        } finally {
            // cleanup on error or finish
            lua.lua_close(luaState);
        }
    }
    /** 
     * @private
     * @returns {}
     */
    static async _createFengariState() {
        // create lua state and add the libraries we deem safe
        // NOTE: Why didn't I use wasmoon? Simple. It would mean reimplementing all of these standard libraries in Node.js, while also killing all `:method()` self calls that use a library. Fengari gives us a lot of fine-grain control for security.
        // NOTE: Adding the libraries in this way adds them to _G (see fengari src for details)
        const LuaState = lauxlib.luaL_newstate();
        const safeLibs = {
            [lualib.LUA_TABLIBNAME]:  lualib.luaopen_table,
            [lualib.LUA_STRLIBNAME]:  lualib.luaopen_string,
            [lualib.LUA_MATHLIBNAME]: lualib.luaopen_math,
            [lualib.LUA_UTF8LIBNAME]: lualib.luaopen_utf8,
        };
        for (const libName in safeLibs) {
            const library = safeLibs[libName];
            lauxlib.luaL_requiref(LuaState, fengari.to_luastring(libName), library, 1);
            lua.lua_pop(LuaState, 1);
        }

        lualib.luaopen_table(LuaState);
        lualib.luaopen_string(LuaState);
        lualib.luaopen_math(LuaState);
        lualib.luaopen_utf8(LuaState);

        // NOTE: add the base library for lua but with a few exclusions
        const print = () => 0;
        const baseFuncs = {
            "assert":         lbaselib.luaB_assert,
            "collectgarbage": lbaselib.luaB_collectgarbage,
            // "dofile":      lbaselib.luaB_dofile,
            "error":          lbaselib.luaB_error,
            "getmetatable":   lbaselib.luaB_getmetatable,
            "ipairs":         lbaselib.luaB_ipairs,
            // "load":        lbaselib.luaB_load,
            // "loadfile":    lbaselib.luaB_loadfile,
            "next":           lbaselib.luaB_next,
            "pairs":          lbaselib.luaB_pairs,
            "pcall":          lbaselib.luaB_pcall,
            "print":          print,
            "rawequal":       lbaselib.luaB_rawequal,
            "rawget":         lbaselib.luaB_rawget,
            "rawlen":         lbaselib.luaB_rawlen,
            "rawset":         lbaselib.luaB_rawset,
            "select":         lbaselib.luaB_select,
            "setmetatable":   lbaselib.luaB_setmetatable,
            "tonumber":       lbaselib.luaB_tonumber,
            "tostring":       lbaselib.luaB_tostring,
            "type":           lbaselib.luaB_type,
            "xpcall":         lbaselib.luaB_xpcall
        };

        lua.lua_pushglobaltable(LuaState);
        lauxlib.luaL_setfuncs(LuaState, baseFuncs, 0);

        // add the _G and _VERSION globals also
        lua.lua_pushvalue(LuaState, -1);
        lua.lua_setfield(LuaState, -2, fengari.to_luastring("_G"));

        // NOTE: this is technically different but eh it does the same thing...
        lua.lua_pushstring(LuaState, fengari.to_luastring(lua.LUA_VERSION));
        lua.lua_setglobal(LuaState, fengari.to_luastring("_VERSION"));

        // NOTE: this is just a convenience thing, we'll also just push a little note that this is running in penguinbot
        // add "fengari" as a string to stack? and then put that into the global
        lua.lua_pushstring(LuaState, fengari.to_luastring("fengari"));
        lua.lua_setglobal(LuaState, fengari.to_luastring("_PENGUINBOT"));
        
        // add configuration.nameBotReference as a string to stack? and then put that into the global
        lua.lua_pushstring(LuaState, fengari.to_luastring(configuration.nameBotReference));
        lua.lua_setglobal(LuaState, fengari.to_luastring("_PENGUINBOT_NAME"));

        // we are done being funky to the lua state
        return LuaState;
    }
}

module.exports = Lua;
