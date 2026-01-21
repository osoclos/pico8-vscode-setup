#!/usr/bin/env node

/** PICO-8 Launcher
 *  Prepares files and environment for launching PICO-8 and launches PICO-8
 *
 *  Steps
 *  1. Computes the relative path from the root path to the entry .lua file.
 *  2. Copies the template cartridge file and patches the entry cartridge file with the computed relative path.
 *  3. Runs PICO-8 with the cartridge, alongside any user-defined arguments.
 */

import fs from "fs";
import path from "path";

import childProcess from "child_process";

import readline from "readline/promises";

const START_LUA_SEGMENT = "__lua__";

const CART_HEADER_END_SEGMENT = /^version\s+(\d+)$/

const END_LUA_SEGMENT = "--__end_lua__--";
const START_GFX_SEGMENT = "__gfx__";

const TEMPLATE_CARTRIDGE_HEADER =
`\
pico-8 cartridge // http://www.pico-8.com
version 42\
`;

const TEMPLATE_CARTRIDGE_FOOTER =
`\
__gfx__
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000\
`;

const INCLUDE_STATEMENT_REG = /^\s*#include\s+(\S+)/dgm;

const {
    ENTRY_FILE_PATH = null,
    ENTRY_CART_PATH = null,

    PICO8_EXE_PATH = null,

    PICO8_ARGS = ""
} = process.env;

const input = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

if (PICO8_EXE_PATH === null || PICO8_EXE_PATH.trim() === "") errAndExit("PICO8_EXE_PATH has not been specified. Did you specify a path in the .vscode/launch.json file?");
if (!fs.existsSync(PICO8_EXE_PATH)) errAndExit("PICO8_EXE_PATH points to a missing file. Did you provide a valid path to the PICO-8 executable?");

if (ENTRY_FILE_PATH === null || ENTRY_FILE_PATH.trim() === "") errAndExit("ENTRY_FILE_PATH has not been specified. Did you specify a path in the .vscode/launch.json file?");
if (!fs.existsSync(ENTRY_FILE_PATH)) errAndExit("ENTRY_FILE_PATH points to a missing file. Did you provide a valid path to your entry .lua file?");

if (ENTRY_CART_PATH === null || ENTRY_CART_PATH.trim() === "") errAndExit("ENTRY_CART_PATH has not been specified. Did you specify a path in the .vscode/launch.json file?");

let entryContent = fs.readFileSync(ENTRY_FILE_PATH, "utf-8").trim();
const entryParentPath = path.relative(path.dirname(ENTRY_CART_PATH), path.dirname(ENTRY_FILE_PATH));

entryContent = repathIncludeStatements(entryContent, entryParentPath);

/** @type {string} */
let patchedContent;
if (fs.existsSync(ENTRY_CART_PATH)) {
    const cartLines = fs.readFileSync(ENTRY_CART_PATH, "utf-8").split(/\r?\n/);

    let startLuaSectionIdx = cartLines.indexOf(START_LUA_SEGMENT);
    if (startLuaSectionIdx < 0) {
        console.warn("WARN: Unable to determine code section in cartridge, cartridge file may be invalid or corrupted.");

        const doExit = await chooseYesOrNo("Do you wish to proceed?");
        if (doExit) process.exit(0);

        startLuaSectionIdx = Math.max(cartLines.indexOf(CART_HEADER_END_SEGMENT), 0);
    }

    let endLuaSectionIdx = cartLines.indexOf(END_LUA_SEGMENT)
    if (endLuaSectionIdx < 0) {
        endLuaSectionIdx = cartLines.indexOf(START_GFX_SEGMENT);
        entryContent += `\n${END_LUA_SEGMENT}`;
    }

    if (endLuaSectionIdx < 0) {
        console.warn("WARN: Unable to determine remaining data section in cartridge, cartridge file may be invalid or corrupted.");

        const doExit = await chooseYesOrNo("Do you wish to proceed?");
        if (doExit) process.exit(0);
    }

    patchedContent = [...cartLines.slice(0, startLuaSectionIdx + 1), entryContent, ...(endLuaSectionIdx < 0 ? "" : cartLines.slice(endLuaSectionIdx))].join("\n");
} else patchedContent = [TEMPLATE_CARTRIDGE_HEADER, entryContent, END_LUA_SEGMENT, TEMPLATE_CARTRIDGE_FOOTER].join("\n");

fs.writeFileSync(ENTRY_CART_PATH, patchedContent);

const pico8Args = [ENTRY_CART_PATH];
if (PICO8_ARGS !== "") pico8Args.push(...PICO8_ARGS.split(" "));

const pico8 = childProcess.spawn(PICO8_EXE_PATH, pico8Args, { stdio: "inherit" });

pico8.on("exit", (code) => void process.exit(code ?? 0));

/** Resolves include paths to make it relative to another parent path
 *
 *  @param {string} code the code to repath statements in
 *  @param {number} folderPath the folder path of the file that contains this code
 *
 *  @returns {string} the code with repathed include statements
 */
function repathIncludeStatements(code, folderPath) {
    /** @type {RegExpExecArray | null} */
    let match;

    do {
        match = INCLUDE_STATEMENT_REG.exec(code);
        if (match === null) break;

        const includePath = match[1];
        const [includePathStart, includePathEnd] = match.indices[1];

        code = code.slice(0, includePathStart) + path.join(folderPath, includePath) + code.slice(includePathEnd);
    } while (match !== null);

    return code;
}

/** Prints an error statement and exits out of the script with an optionally specified code.
 *
 * @param {string} msg the error message to accompany the code
 * @param {number} code the error code to exit
 */
function errAndExit(msg, code = 1) {
    console.error(`ERR: ${msg}`);
    process.exit(code);
}

/** Asks the user to choose yes or no with a given prompt.
 *
 * @param {string} prompt the question to ask
 * @returns {Promise<boolean>} the answer to the statement (Yes if `true`, No if `false`)
 */
async function chooseYesOrNo(prompt) {
    const YES_ANSWER = "yes";

    const reply = await input.question(`${prompt} [Y/N] > `).toLowerCase();
    return Array(YES_ANSWER.length).fill("").map((_, i) => YES_ANSWER.slice(0, i + 1)).includes(reply);
}
