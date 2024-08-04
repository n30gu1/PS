#!/usr/bin/env node

/* eslint-disable max-len, flowtype/require-valid-file-annotation, flowtype/require-return-type */
/* global packageInformationStores, null, $$SETUP_STATIC_TABLES */

// Used for the resolveUnqualified part of the resolution (ie resolving folder/index.js & file extensions)
// Deconstructed so that they aren't affected by any fs monkeypatching occuring later during the execution
const {statSync, lstatSync, readlinkSync, readFileSync, existsSync, realpathSync} = require('fs');

const Module = require('module');
const path = require('path');
const StringDecoder = require('string_decoder');

const ignorePattern = null ? new RegExp(null) : null;

const pnpFile = path.resolve(__dirname, __filename);
const builtinModules = new Set(Module.builtinModules || Object.keys(process.binding('natives')));

const topLevelLocator = {name: null, reference: null};
const blacklistedLocator = {name: NaN, reference: NaN};

// Used for compatibility purposes - cf setupCompatibilityLayer
const patchedModules = [];
const fallbackLocators = [topLevelLocator];

// Matches backslashes of Windows paths
const backwardSlashRegExp = /\\/g;

// Matches if the path must point to a directory (ie ends with /)
const isDirRegExp = /\/$/;

// Matches if the path starts with a valid path qualifier (./, ../, /)
// eslint-disable-next-line no-unused-vars
const isStrictRegExp = /^\.{0,2}\//;

// Splits a require request into its components, or return null if the request is a file path
const pathRegExp = /^(?![a-zA-Z]:[\\\/]|\\\\|\.{0,2}(?:\/|$))((?:@[^\/]+\/)?[^\/]+)\/?(.*|)$/;

// Keep a reference around ("module" is a common name in this context, so better rename it to something more significant)
const pnpModule = module;

/**
 * Used to disable the resolution hooks (for when we want to fallback to the previous resolution - we then need
 * a way to "reset" the environment temporarily)
 */

let enableNativeHooks = true;

/**
 * Simple helper function that assign an error code to an error, so that it can more easily be caught and used
 * by third-parties.
 */

function makeError(code, message, data = {}) {
  const error = new Error(message);
  return Object.assign(error, {code, data});
}

/**
 * Ensures that the returned locator isn't a blacklisted one.
 *
 * Blacklisted packages are packages that cannot be used because their dependencies cannot be deduced. This only
 * happens with peer dependencies, which effectively have different sets of dependencies depending on their parents.
 *
 * In order to deambiguate those different sets of dependencies, the Yarn implementation of PnP will generate a
 * symlink for each combination of <package name>/<package version>/<dependent package> it will find, and will
 * blacklist the target of those symlinks. By doing this, we ensure that files loaded through a specific path
 * will always have the same set of dependencies, provided the symlinks are correctly preserved.
 *
 * Unfortunately, some tools do not preserve them, and when it happens PnP isn't able anymore to deduce the set of
 * dependencies based on the path of the file that makes the require calls. But since we've blacklisted those paths,
 * we're able to print a more helpful error message that points out that a third-party package is doing something
 * incompatible!
 */

// eslint-disable-next-line no-unused-vars
function blacklistCheck(locator) {
  if (locator === blacklistedLocator) {
    throw makeError(
      `BLACKLISTED`,
      [
        `A package has been resolved through a blacklisted path - this is usually caused by one of your tools calling`,
        `"realpath" on the return value of "require.resolve". Since the returned values use symlinks to disambiguate`,
        `peer dependencies, they must be passed untransformed to "require".`,
      ].join(` `)
    );
  }

  return locator;
}

let packageInformationStores = new Map([
  ["@types/node", new Map([
    ["20.14.13", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-node-20.14.13-bf4fe8959ae1c43bc284de78bd6c01730933736b-integrity/node_modules/@types/node/"),
      packageDependencies: new Map([
        ["undici-types", "5.26.5"],
        ["@types/node", "20.14.13"],
      ]),
    }],
    ["22.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-node-22.0.0-04862a2a71e62264426083abe1e27e87cac05a30-integrity/node_modules/@types/node/"),
      packageDependencies: new Map([
        ["undici-types", "6.11.1"],
        ["@types/node", "22.0.0"],
      ]),
    }],
    ["18.19.42", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-node-18.19.42-b54ed4752c85427906aab40917b0f7f3d724bf72-integrity/node_modules/@types/node/"),
      packageDependencies: new Map([
        ["undici-types", "5.26.5"],
        ["@types/node", "18.19.42"],
      ]),
    }],
  ])],
  ["undici-types", new Map([
    ["5.26.5", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-undici-types-5.26.5-bcd539893d00b56e964fd2657a4866b221a65617-integrity/node_modules/undici-types/"),
      packageDependencies: new Map([
        ["undici-types", "5.26.5"],
      ]),
    }],
    ["6.11.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-undici-types-6.11.1-432ea6e8efd54a48569705a699e62d8f4981b197-integrity/node_modules/undici-types/"),
      packageDependencies: new Map([
        ["undici-types", "6.11.1"],
      ]),
    }],
  ])],
  ["typescript", new Map([
    ["5.5.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-typescript-5.5.4-d9852d6c82bad2d2eda4fd74a5762a8f5909e9ba-integrity/node_modules/typescript/"),
      packageDependencies: new Map([
        ["typescript", "5.5.4"],
      ]),
    }],
  ])],
  ["@yarnpkg/pnpify", new Map([
    ["4.1.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-pnpify-4.1.0-9af107ac3dd55a6944016f27073a3bae806a24a2-integrity/node_modules/@yarnpkg/pnpify/"),
      packageDependencies: new Map([
        ["@yarnpkg/core", "4.1.1"],
        ["@yarnpkg/fslib", "3.1.0"],
        ["@yarnpkg/nm", "4.0.2"],
        ["clipanion", "pnp:e3ba6f1029a124439b4bd36d67b3742bee8311f5"],
        ["tslib", "2.6.3"],
        ["@yarnpkg/pnpify", "4.1.0"],
      ]),
    }],
  ])],
  ["@yarnpkg/core", new Map([
    ["4.1.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-core-4.1.1-2a60094566ff9020d9f02cbc5bd563161fb4c920-integrity/node_modules/@yarnpkg/core/"),
      packageDependencies: new Map([
        ["@arcanis/slice-ansi", "1.1.1"],
        ["@types/semver", "7.5.8"],
        ["@types/treeify", "1.0.3"],
        ["@yarnpkg/fslib", "3.1.0"],
        ["@yarnpkg/libzip", "3.1.0"],
        ["@yarnpkg/parsers", "3.0.2"],
        ["@yarnpkg/shell", "4.0.2"],
        ["camelcase", "5.3.1"],
        ["chalk", "3.0.0"],
        ["ci-info", "3.9.0"],
        ["clipanion", "pnp:94e29121e08e223b6548d5b1043edec8b393ba2b"],
        ["cross-spawn", "7.0.3"],
        ["diff", "5.2.0"],
        ["dotenv", "16.4.5"],
        ["fast-glob", "3.3.2"],
        ["got", "11.8.6"],
        ["lodash", "4.17.21"],
        ["micromatch", "4.0.7"],
        ["p-limit", "2.3.0"],
        ["semver", "7.6.3"],
        ["strip-ansi", "6.0.1"],
        ["tar", "6.2.1"],
        ["tinylogic", "2.0.0"],
        ["treeify", "1.1.0"],
        ["tslib", "2.6.3"],
        ["tunnel", "0.0.6"],
        ["@yarnpkg/core", "4.1.1"],
      ]),
    }],
  ])],
  ["@arcanis/slice-ansi", new Map([
    ["1.1.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@arcanis-slice-ansi-1.1.1-0ee328a68996ca45854450033a3d161421dc4f55-integrity/node_modules/@arcanis/slice-ansi/"),
      packageDependencies: new Map([
        ["grapheme-splitter", "1.0.4"],
        ["@arcanis/slice-ansi", "1.1.1"],
      ]),
    }],
  ])],
  ["grapheme-splitter", new Map([
    ["1.0.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-grapheme-splitter-1.0.4-9cf3a665c6247479896834af35cf1dbb4400767e-integrity/node_modules/grapheme-splitter/"),
      packageDependencies: new Map([
        ["grapheme-splitter", "1.0.4"],
      ]),
    }],
  ])],
  ["@types/semver", new Map([
    ["7.5.8", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-semver-7.5.8-8268a8c57a3e4abd25c165ecd36237db7948a55e-integrity/node_modules/@types/semver/"),
      packageDependencies: new Map([
        ["@types/semver", "7.5.8"],
      ]),
    }],
  ])],
  ["@types/treeify", new Map([
    ["1.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-treeify-1.0.3-f502e11e851b1464d5e80715d5ce3705ad864638-integrity/node_modules/@types/treeify/"),
      packageDependencies: new Map([
        ["@types/treeify", "1.0.3"],
      ]),
    }],
  ])],
  ["@yarnpkg/fslib", new Map([
    ["3.1.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-fslib-3.1.0-e5bda3397b5f070eb65751643f75645307eaa483-integrity/node_modules/@yarnpkg/fslib/"),
      packageDependencies: new Map([
        ["tslib", "2.6.3"],
        ["@yarnpkg/fslib", "3.1.0"],
      ]),
    }],
  ])],
  ["tslib", new Map([
    ["2.6.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-tslib-2.6.3-0438f810ad7a9edcde7a241c3d80db693c8cbfe0-integrity/node_modules/tslib/"),
      packageDependencies: new Map([
        ["tslib", "2.6.3"],
      ]),
    }],
  ])],
  ["@yarnpkg/libzip", new Map([
    ["3.1.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-libzip-3.1.0-c33e91bd8bfcc5a5b4cb05b387c04c9ba9fb88b0-integrity/node_modules/@yarnpkg/libzip/"),
      packageDependencies: new Map([
        ["@yarnpkg/fslib", "3.1.0"],
        ["@types/emscripten", "1.39.13"],
        ["tslib", "2.6.3"],
        ["@yarnpkg/libzip", "3.1.0"],
      ]),
    }],
  ])],
  ["@types/emscripten", new Map([
    ["1.39.13", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-emscripten-1.39.13-afeb1648648dc096efe57983e20387627306e2aa-integrity/node_modules/@types/emscripten/"),
      packageDependencies: new Map([
        ["@types/emscripten", "1.39.13"],
      ]),
    }],
  ])],
  ["@yarnpkg/parsers", new Map([
    ["3.0.2", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-parsers-3.0.2-48a1517a0f49124827f4c37c284a689c607b2f32-integrity/node_modules/@yarnpkg/parsers/"),
      packageDependencies: new Map([
        ["js-yaml", "3.14.1"],
        ["tslib", "2.6.3"],
        ["@yarnpkg/parsers", "3.0.2"],
      ]),
    }],
  ])],
  ["js-yaml", new Map([
    ["3.14.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-js-yaml-3.14.1-dae812fdb3825fa306609a8717383c50c36a0537-integrity/node_modules/js-yaml/"),
      packageDependencies: new Map([
        ["argparse", "1.0.10"],
        ["esprima", "4.0.1"],
        ["js-yaml", "3.14.1"],
      ]),
    }],
  ])],
  ["argparse", new Map([
    ["1.0.10", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-argparse-1.0.10-bcd6791ea5ae09725e17e5ad988134cd40b3d911-integrity/node_modules/argparse/"),
      packageDependencies: new Map([
        ["sprintf-js", "1.0.3"],
        ["argparse", "1.0.10"],
      ]),
    }],
  ])],
  ["sprintf-js", new Map([
    ["1.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-sprintf-js-1.0.3-04e6926f662895354f3dd015203633b857297e2c-integrity/node_modules/sprintf-js/"),
      packageDependencies: new Map([
        ["sprintf-js", "1.0.3"],
      ]),
    }],
  ])],
  ["esprima", new Map([
    ["4.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-esprima-4.0.1-13b04cdb3e6c5d19df91ab6987a8695619b0aa71-integrity/node_modules/esprima/"),
      packageDependencies: new Map([
        ["esprima", "4.0.1"],
      ]),
    }],
  ])],
  ["@yarnpkg/shell", new Map([
    ["4.0.2", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-shell-4.0.2-2932063536a8cf2c0c4f0d6201b95f54dc81c3c1-integrity/node_modules/@yarnpkg/shell/"),
      packageDependencies: new Map([
        ["@yarnpkg/fslib", "3.1.0"],
        ["@yarnpkg/parsers", "3.0.2"],
        ["chalk", "3.0.0"],
        ["clipanion", "pnp:568d3767d64b56082d971d832cea7e16a138c461"],
        ["cross-spawn", "7.0.3"],
        ["fast-glob", "3.3.2"],
        ["micromatch", "4.0.7"],
        ["tslib", "2.6.3"],
        ["@yarnpkg/shell", "4.0.2"],
      ]),
    }],
  ])],
  ["chalk", new Map([
    ["3.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-chalk-3.0.0-3f73c2bf526591f574cc492c51e2456349f844e4-integrity/node_modules/chalk/"),
      packageDependencies: new Map([
        ["ansi-styles", "4.3.0"],
        ["supports-color", "7.2.0"],
        ["chalk", "3.0.0"],
      ]),
    }],
  ])],
  ["ansi-styles", new Map([
    ["4.3.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-ansi-styles-4.3.0-edd803628ae71c04c85ae7a0906edad34b648937-integrity/node_modules/ansi-styles/"),
      packageDependencies: new Map([
        ["color-convert", "2.0.1"],
        ["ansi-styles", "4.3.0"],
      ]),
    }],
  ])],
  ["color-convert", new Map([
    ["2.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-color-convert-2.0.1-72d3a68d598c9bdb3af2ad1e84f21d896abd4de3-integrity/node_modules/color-convert/"),
      packageDependencies: new Map([
        ["color-name", "1.1.4"],
        ["color-convert", "2.0.1"],
      ]),
    }],
  ])],
  ["color-name", new Map([
    ["1.1.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-color-name-1.1.4-c2a09a87acbde69543de6f63fa3995c826c536a2-integrity/node_modules/color-name/"),
      packageDependencies: new Map([
        ["color-name", "1.1.4"],
      ]),
    }],
  ])],
  ["supports-color", new Map([
    ["7.2.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-supports-color-7.2.0-1b7dcdcb32b8138801b3e478ba6a51caa89648da-integrity/node_modules/supports-color/"),
      packageDependencies: new Map([
        ["has-flag", "4.0.0"],
        ["supports-color", "7.2.0"],
      ]),
    }],
  ])],
  ["has-flag", new Map([
    ["4.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-has-flag-4.0.0-944771fd9c81c81265c4d6941860da06bb59479b-integrity/node_modules/has-flag/"),
      packageDependencies: new Map([
        ["has-flag", "4.0.0"],
      ]),
    }],
  ])],
  ["clipanion", new Map([
    ["pnp:568d3767d64b56082d971d832cea7e16a138c461", {
      packageLocation: path.resolve(__dirname, "./.pnp/externals/pnp-568d3767d64b56082d971d832cea7e16a138c461/node_modules/clipanion/"),
      packageDependencies: new Map([
        ["clipanion", "pnp:568d3767d64b56082d971d832cea7e16a138c461"],
      ]),
    }],
    ["pnp:94e29121e08e223b6548d5b1043edec8b393ba2b", {
      packageLocation: path.resolve(__dirname, "./.pnp/externals/pnp-94e29121e08e223b6548d5b1043edec8b393ba2b/node_modules/clipanion/"),
      packageDependencies: new Map([
        ["clipanion", "pnp:94e29121e08e223b6548d5b1043edec8b393ba2b"],
      ]),
    }],
    ["pnp:e3ba6f1029a124439b4bd36d67b3742bee8311f5", {
      packageLocation: path.resolve(__dirname, "./.pnp/externals/pnp-e3ba6f1029a124439b4bd36d67b3742bee8311f5/node_modules/clipanion/"),
      packageDependencies: new Map([
        ["clipanion", "pnp:e3ba6f1029a124439b4bd36d67b3742bee8311f5"],
      ]),
    }],
  ])],
  ["cross-spawn", new Map([
    ["7.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-cross-spawn-7.0.3-f73a85b9d5d41d045551c177e2882d4ac85728a6-integrity/node_modules/cross-spawn/"),
      packageDependencies: new Map([
        ["path-key", "3.1.1"],
        ["shebang-command", "2.0.0"],
        ["which", "2.0.2"],
        ["cross-spawn", "7.0.3"],
      ]),
    }],
  ])],
  ["path-key", new Map([
    ["3.1.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-path-key-3.1.1-581f6ade658cbba65a0d3380de7753295054f375-integrity/node_modules/path-key/"),
      packageDependencies: new Map([
        ["path-key", "3.1.1"],
      ]),
    }],
  ])],
  ["shebang-command", new Map([
    ["2.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-shebang-command-2.0.0-ccd0af4f8835fbdc265b82461aaf0c36663f34ea-integrity/node_modules/shebang-command/"),
      packageDependencies: new Map([
        ["shebang-regex", "3.0.0"],
        ["shebang-command", "2.0.0"],
      ]),
    }],
  ])],
  ["shebang-regex", new Map([
    ["3.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-shebang-regex-3.0.0-ae16f1644d873ecad843b0307b143362d4c42172-integrity/node_modules/shebang-regex/"),
      packageDependencies: new Map([
        ["shebang-regex", "3.0.0"],
      ]),
    }],
  ])],
  ["which", new Map([
    ["2.0.2", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-which-2.0.2-7c6a8dd0a636a0327e10b59c9286eee93f3f51b1-integrity/node_modules/which/"),
      packageDependencies: new Map([
        ["isexe", "2.0.0"],
        ["which", "2.0.2"],
      ]),
    }],
  ])],
  ["isexe", new Map([
    ["2.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-isexe-2.0.0-e8fbf374dc556ff8947a10dcb0572d633f2cfa10-integrity/node_modules/isexe/"),
      packageDependencies: new Map([
        ["isexe", "2.0.0"],
      ]),
    }],
  ])],
  ["fast-glob", new Map([
    ["3.3.2", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-fast-glob-3.3.2-a904501e57cfdd2ffcded45e99a54fef55e46129-integrity/node_modules/fast-glob/"),
      packageDependencies: new Map([
        ["@nodelib/fs.stat", "2.0.5"],
        ["@nodelib/fs.walk", "1.2.8"],
        ["glob-parent", "5.1.2"],
        ["merge2", "1.4.1"],
        ["micromatch", "4.0.7"],
        ["fast-glob", "3.3.2"],
      ]),
    }],
  ])],
  ["@nodelib/fs.stat", new Map([
    ["2.0.5", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@nodelib-fs-stat-2.0.5-5bd262af94e9d25bd1e71b05deed44876a222e8b-integrity/node_modules/@nodelib/fs.stat/"),
      packageDependencies: new Map([
        ["@nodelib/fs.stat", "2.0.5"],
      ]),
    }],
  ])],
  ["@nodelib/fs.walk", new Map([
    ["1.2.8", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@nodelib-fs-walk-1.2.8-e95737e8bb6746ddedf69c556953494f196fe69a-integrity/node_modules/@nodelib/fs.walk/"),
      packageDependencies: new Map([
        ["@nodelib/fs.scandir", "2.1.5"],
        ["fastq", "1.17.1"],
        ["@nodelib/fs.walk", "1.2.8"],
      ]),
    }],
  ])],
  ["@nodelib/fs.scandir", new Map([
    ["2.1.5", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@nodelib-fs-scandir-2.1.5-7619c2eb21b25483f6d167548b4cfd5a7488c3d5-integrity/node_modules/@nodelib/fs.scandir/"),
      packageDependencies: new Map([
        ["@nodelib/fs.stat", "2.0.5"],
        ["run-parallel", "1.2.0"],
        ["@nodelib/fs.scandir", "2.1.5"],
      ]),
    }],
  ])],
  ["run-parallel", new Map([
    ["1.2.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-run-parallel-1.2.0-66d1368da7bdf921eb9d95bd1a9229e7f21a43ee-integrity/node_modules/run-parallel/"),
      packageDependencies: new Map([
        ["queue-microtask", "1.2.3"],
        ["run-parallel", "1.2.0"],
      ]),
    }],
  ])],
  ["queue-microtask", new Map([
    ["1.2.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-queue-microtask-1.2.3-4929228bbc724dfac43e0efb058caf7b6cfb6243-integrity/node_modules/queue-microtask/"),
      packageDependencies: new Map([
        ["queue-microtask", "1.2.3"],
      ]),
    }],
  ])],
  ["fastq", new Map([
    ["1.17.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-fastq-1.17.1-2a523f07a4e7b1e81a42b91b8bf2254107753b47-integrity/node_modules/fastq/"),
      packageDependencies: new Map([
        ["reusify", "1.0.4"],
        ["fastq", "1.17.1"],
      ]),
    }],
  ])],
  ["reusify", new Map([
    ["1.0.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-reusify-1.0.4-90da382b1e126efc02146e90845a88db12925d76-integrity/node_modules/reusify/"),
      packageDependencies: new Map([
        ["reusify", "1.0.4"],
      ]),
    }],
  ])],
  ["glob-parent", new Map([
    ["5.1.2", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-glob-parent-5.1.2-869832c58034fe68a4093c17dc15e8340d8401c4-integrity/node_modules/glob-parent/"),
      packageDependencies: new Map([
        ["is-glob", "4.0.3"],
        ["glob-parent", "5.1.2"],
      ]),
    }],
  ])],
  ["is-glob", new Map([
    ["4.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-is-glob-4.0.3-64f61e42cbbb2eec2071a9dac0b28ba1e65d5084-integrity/node_modules/is-glob/"),
      packageDependencies: new Map([
        ["is-extglob", "2.1.1"],
        ["is-glob", "4.0.3"],
      ]),
    }],
  ])],
  ["is-extglob", new Map([
    ["2.1.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-is-extglob-2.1.1-a88c02535791f02ed37c76a1b9ea9773c833f8c2-integrity/node_modules/is-extglob/"),
      packageDependencies: new Map([
        ["is-extglob", "2.1.1"],
      ]),
    }],
  ])],
  ["merge2", new Map([
    ["1.4.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-merge2-1.4.1-4368892f885e907455a6fd7dc55c0c9d404990ae-integrity/node_modules/merge2/"),
      packageDependencies: new Map([
        ["merge2", "1.4.1"],
      ]),
    }],
  ])],
  ["micromatch", new Map([
    ["4.0.7", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-micromatch-4.0.7-33e8190d9fe474a9895525f5618eee136d46c2e5-integrity/node_modules/micromatch/"),
      packageDependencies: new Map([
        ["braces", "3.0.3"],
        ["picomatch", "2.3.1"],
        ["micromatch", "4.0.7"],
      ]),
    }],
  ])],
  ["braces", new Map([
    ["3.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-braces-3.0.3-490332f40919452272d55a8480adc0c441358789-integrity/node_modules/braces/"),
      packageDependencies: new Map([
        ["fill-range", "7.1.1"],
        ["braces", "3.0.3"],
      ]),
    }],
  ])],
  ["fill-range", new Map([
    ["7.1.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-fill-range-7.1.1-44265d3cac07e3ea7dc247516380643754a05292-integrity/node_modules/fill-range/"),
      packageDependencies: new Map([
        ["to-regex-range", "5.0.1"],
        ["fill-range", "7.1.1"],
      ]),
    }],
  ])],
  ["to-regex-range", new Map([
    ["5.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-to-regex-range-5.0.1-1648c44aae7c8d988a326018ed72f5b4dd0392e4-integrity/node_modules/to-regex-range/"),
      packageDependencies: new Map([
        ["is-number", "7.0.0"],
        ["to-regex-range", "5.0.1"],
      ]),
    }],
  ])],
  ["is-number", new Map([
    ["7.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-is-number-7.0.0-7535345b896734d5f80c4d06c50955527a14f12b-integrity/node_modules/is-number/"),
      packageDependencies: new Map([
        ["is-number", "7.0.0"],
      ]),
    }],
  ])],
  ["picomatch", new Map([
    ["2.3.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-picomatch-2.3.1-3ba3833733646d9d3e4995946c1365a67fb07a42-integrity/node_modules/picomatch/"),
      packageDependencies: new Map([
        ["picomatch", "2.3.1"],
      ]),
    }],
  ])],
  ["camelcase", new Map([
    ["5.3.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-camelcase-5.3.1-e3c9b31569e106811df242f715725a1f4c494320-integrity/node_modules/camelcase/"),
      packageDependencies: new Map([
        ["camelcase", "5.3.1"],
      ]),
    }],
  ])],
  ["ci-info", new Map([
    ["3.9.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-ci-info-3.9.0-4279a62028a7b1f262f3473fc9605f5e218c59b4-integrity/node_modules/ci-info/"),
      packageDependencies: new Map([
        ["ci-info", "3.9.0"],
      ]),
    }],
  ])],
  ["diff", new Map([
    ["5.2.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-diff-5.2.0-26ded047cd1179b78b9537d5ef725503ce1ae531-integrity/node_modules/diff/"),
      packageDependencies: new Map([
        ["diff", "5.2.0"],
      ]),
    }],
  ])],
  ["dotenv", new Map([
    ["16.4.5", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-dotenv-16.4.5-cdd3b3b604cb327e286b4762e13502f717cb099f-integrity/node_modules/dotenv/"),
      packageDependencies: new Map([
        ["dotenv", "16.4.5"],
      ]),
    }],
  ])],
  ["got", new Map([
    ["11.8.6", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-got-11.8.6-276e827ead8772eddbcfc97170590b841823233a-integrity/node_modules/got/"),
      packageDependencies: new Map([
        ["p-cancelable", "2.1.1"],
        ["responselike", "2.0.1"],
        ["http2-wrapper", "1.0.3"],
        ["lowercase-keys", "2.0.0"],
        ["@sindresorhus/is", "4.6.0"],
        ["cacheable-lookup", "5.0.4"],
        ["cacheable-request", "7.0.4"],
        ["@types/responselike", "1.0.3"],
        ["decompress-response", "6.0.0"],
        ["@szmarczak/http-timer", "4.0.6"],
        ["@types/cacheable-request", "6.0.3"],
        ["got", "11.8.6"],
      ]),
    }],
  ])],
  ["p-cancelable", new Map([
    ["2.1.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-p-cancelable-2.1.1-aab7fbd416582fa32a3db49859c122487c5ed2cf-integrity/node_modules/p-cancelable/"),
      packageDependencies: new Map([
        ["p-cancelable", "2.1.1"],
      ]),
    }],
  ])],
  ["responselike", new Map([
    ["2.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-responselike-2.0.1-9a0bc8fdc252f3fb1cca68b016591059ba1422bc-integrity/node_modules/responselike/"),
      packageDependencies: new Map([
        ["lowercase-keys", "2.0.0"],
        ["responselike", "2.0.1"],
      ]),
    }],
  ])],
  ["lowercase-keys", new Map([
    ["2.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-lowercase-keys-2.0.0-2603e78b7b4b0006cbca2fbcc8a3202558ac9479-integrity/node_modules/lowercase-keys/"),
      packageDependencies: new Map([
        ["lowercase-keys", "2.0.0"],
      ]),
    }],
  ])],
  ["http2-wrapper", new Map([
    ["1.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-http2-wrapper-1.0.3-b8f55e0c1f25d4ebd08b3b0c2c079f9590800b3d-integrity/node_modules/http2-wrapper/"),
      packageDependencies: new Map([
        ["quick-lru", "5.1.1"],
        ["resolve-alpn", "1.2.1"],
        ["http2-wrapper", "1.0.3"],
      ]),
    }],
  ])],
  ["quick-lru", new Map([
    ["5.1.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-quick-lru-5.1.1-366493e6b3e42a3a6885e2e99d18f80fb7a8c932-integrity/node_modules/quick-lru/"),
      packageDependencies: new Map([
        ["quick-lru", "5.1.1"],
      ]),
    }],
  ])],
  ["resolve-alpn", new Map([
    ["1.2.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-resolve-alpn-1.2.1-b7adbdac3546aaaec20b45e7d8265927072726f9-integrity/node_modules/resolve-alpn/"),
      packageDependencies: new Map([
        ["resolve-alpn", "1.2.1"],
      ]),
    }],
  ])],
  ["@sindresorhus/is", new Map([
    ["4.6.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@sindresorhus-is-4.6.0-3c7c9c46e678feefe7a2e5bb609d3dbd665ffb3f-integrity/node_modules/@sindresorhus/is/"),
      packageDependencies: new Map([
        ["@sindresorhus/is", "4.6.0"],
      ]),
    }],
  ])],
  ["cacheable-lookup", new Map([
    ["5.0.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-cacheable-lookup-5.0.4-5a6b865b2c44357be3d5ebc2a467b032719a7005-integrity/node_modules/cacheable-lookup/"),
      packageDependencies: new Map([
        ["cacheable-lookup", "5.0.4"],
      ]),
    }],
  ])],
  ["cacheable-request", new Map([
    ["7.0.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-cacheable-request-7.0.4-7a33ebf08613178b403635be7b899d3e69bbe817-integrity/node_modules/cacheable-request/"),
      packageDependencies: new Map([
        ["clone-response", "1.0.3"],
        ["get-stream", "5.2.0"],
        ["http-cache-semantics", "4.1.1"],
        ["keyv", "4.5.4"],
        ["lowercase-keys", "2.0.0"],
        ["normalize-url", "6.1.0"],
        ["responselike", "2.0.1"],
        ["cacheable-request", "7.0.4"],
      ]),
    }],
  ])],
  ["clone-response", new Map([
    ["1.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-clone-response-1.0.3-af2032aa47816399cf5f0a1d0db902f517abb8c3-integrity/node_modules/clone-response/"),
      packageDependencies: new Map([
        ["mimic-response", "1.0.1"],
        ["clone-response", "1.0.3"],
      ]),
    }],
  ])],
  ["mimic-response", new Map([
    ["1.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-mimic-response-1.0.1-4923538878eef42063cb8a3e3b0798781487ab1b-integrity/node_modules/mimic-response/"),
      packageDependencies: new Map([
        ["mimic-response", "1.0.1"],
      ]),
    }],
    ["3.1.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-mimic-response-3.1.0-2d1d59af9c1b129815accc2c46a022a5ce1fa3c9-integrity/node_modules/mimic-response/"),
      packageDependencies: new Map([
        ["mimic-response", "3.1.0"],
      ]),
    }],
  ])],
  ["get-stream", new Map([
    ["5.2.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-get-stream-5.2.0-4966a1795ee5ace65e706c4b7beb71257d6e22d3-integrity/node_modules/get-stream/"),
      packageDependencies: new Map([
        ["pump", "3.0.0"],
        ["get-stream", "5.2.0"],
      ]),
    }],
  ])],
  ["pump", new Map([
    ["3.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-pump-3.0.0-b4a2116815bde2f4e1ea602354e8c75565107a64-integrity/node_modules/pump/"),
      packageDependencies: new Map([
        ["end-of-stream", "1.4.4"],
        ["once", "1.4.0"],
        ["pump", "3.0.0"],
      ]),
    }],
  ])],
  ["end-of-stream", new Map([
    ["1.4.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-end-of-stream-1.4.4-5ae64a5f45057baf3626ec14da0ca5e4b2431eb0-integrity/node_modules/end-of-stream/"),
      packageDependencies: new Map([
        ["once", "1.4.0"],
        ["end-of-stream", "1.4.4"],
      ]),
    }],
  ])],
  ["once", new Map([
    ["1.4.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-once-1.4.0-583b1aa775961d4b113ac17d9c50baef9dd76bd1-integrity/node_modules/once/"),
      packageDependencies: new Map([
        ["wrappy", "1.0.2"],
        ["once", "1.4.0"],
      ]),
    }],
  ])],
  ["wrappy", new Map([
    ["1.0.2", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-wrappy-1.0.2-b5243d8f3ec1aa35f1364605bc0d1036e30ab69f-integrity/node_modules/wrappy/"),
      packageDependencies: new Map([
        ["wrappy", "1.0.2"],
      ]),
    }],
  ])],
  ["http-cache-semantics", new Map([
    ["4.1.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-http-cache-semantics-4.1.1-abe02fcb2985460bf0323be664436ec3476a6d5a-integrity/node_modules/http-cache-semantics/"),
      packageDependencies: new Map([
        ["http-cache-semantics", "4.1.1"],
      ]),
    }],
  ])],
  ["keyv", new Map([
    ["4.5.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-keyv-4.5.4-a879a99e29452f942439f2a405e3af8b31d4de93-integrity/node_modules/keyv/"),
      packageDependencies: new Map([
        ["json-buffer", "3.0.1"],
        ["keyv", "4.5.4"],
      ]),
    }],
  ])],
  ["json-buffer", new Map([
    ["3.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-json-buffer-3.0.1-9338802a30d3b6605fbe0613e094008ca8c05a13-integrity/node_modules/json-buffer/"),
      packageDependencies: new Map([
        ["json-buffer", "3.0.1"],
      ]),
    }],
  ])],
  ["normalize-url", new Map([
    ["6.1.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-normalize-url-6.1.0-40d0885b535deffe3f3147bec877d05fe4c5668a-integrity/node_modules/normalize-url/"),
      packageDependencies: new Map([
        ["normalize-url", "6.1.0"],
      ]),
    }],
  ])],
  ["@types/responselike", new Map([
    ["1.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-responselike-1.0.3-cc29706f0a397cfe6df89debfe4bf5cea159db50-integrity/node_modules/@types/responselike/"),
      packageDependencies: new Map([
        ["@types/node", "22.0.0"],
        ["@types/responselike", "1.0.3"],
      ]),
    }],
  ])],
  ["decompress-response", new Map([
    ["6.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-decompress-response-6.0.0-ca387612ddb7e104bd16d85aab00d5ecf09c66fc-integrity/node_modules/decompress-response/"),
      packageDependencies: new Map([
        ["mimic-response", "3.1.0"],
        ["decompress-response", "6.0.0"],
      ]),
    }],
  ])],
  ["@szmarczak/http-timer", new Map([
    ["4.0.6", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@szmarczak-http-timer-4.0.6-b4a914bb62e7c272d4e5989fe4440f812ab1d807-integrity/node_modules/@szmarczak/http-timer/"),
      packageDependencies: new Map([
        ["defer-to-connect", "2.0.1"],
        ["@szmarczak/http-timer", "4.0.6"],
      ]),
    }],
  ])],
  ["defer-to-connect", new Map([
    ["2.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-defer-to-connect-2.0.1-8016bdb4143e4632b77a3449c6236277de520587-integrity/node_modules/defer-to-connect/"),
      packageDependencies: new Map([
        ["defer-to-connect", "2.0.1"],
      ]),
    }],
  ])],
  ["@types/cacheable-request", new Map([
    ["6.0.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-cacheable-request-6.0.3-a430b3260466ca7b5ca5bfd735693b36e7a9d183-integrity/node_modules/@types/cacheable-request/"),
      packageDependencies: new Map([
        ["@types/http-cache-semantics", "4.0.4"],
        ["@types/keyv", "3.1.4"],
        ["@types/node", "22.0.0"],
        ["@types/responselike", "1.0.3"],
        ["@types/cacheable-request", "6.0.3"],
      ]),
    }],
  ])],
  ["@types/http-cache-semantics", new Map([
    ["4.0.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-http-cache-semantics-4.0.4-b979ebad3919799c979b17c72621c0bc0a31c6c4-integrity/node_modules/@types/http-cache-semantics/"),
      packageDependencies: new Map([
        ["@types/http-cache-semantics", "4.0.4"],
      ]),
    }],
  ])],
  ["@types/keyv", new Map([
    ["3.1.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@types-keyv-3.1.4-3ccdb1c6751b0c7e52300bcdacd5bcbf8faa75b6-integrity/node_modules/@types/keyv/"),
      packageDependencies: new Map([
        ["@types/node", "22.0.0"],
        ["@types/keyv", "3.1.4"],
      ]),
    }],
  ])],
  ["lodash", new Map([
    ["4.17.21", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-lodash-4.17.21-679591c564c3bffaae8454cf0b3df370c3d6911c-integrity/node_modules/lodash/"),
      packageDependencies: new Map([
        ["lodash", "4.17.21"],
      ]),
    }],
  ])],
  ["p-limit", new Map([
    ["2.3.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-p-limit-2.3.0-3dd33c647a214fdfffd835933eb086da0dc21db1-integrity/node_modules/p-limit/"),
      packageDependencies: new Map([
        ["p-try", "2.2.0"],
        ["p-limit", "2.3.0"],
      ]),
    }],
  ])],
  ["p-try", new Map([
    ["2.2.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-p-try-2.2.0-cb2868540e313d61de58fafbe35ce9004d5540e6-integrity/node_modules/p-try/"),
      packageDependencies: new Map([
        ["p-try", "2.2.0"],
      ]),
    }],
  ])],
  ["semver", new Map([
    ["7.6.3", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-semver-7.6.3-980f7b5550bc175fb4dc09403085627f9eb33143-integrity/node_modules/semver/"),
      packageDependencies: new Map([
        ["semver", "7.6.3"],
      ]),
    }],
  ])],
  ["strip-ansi", new Map([
    ["6.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-strip-ansi-6.0.1-9e26c63d30f53443e9489495b2105d37b67a85d9-integrity/node_modules/strip-ansi/"),
      packageDependencies: new Map([
        ["ansi-regex", "5.0.1"],
        ["strip-ansi", "6.0.1"],
      ]),
    }],
  ])],
  ["ansi-regex", new Map([
    ["5.0.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-ansi-regex-5.0.1-082cb2c89c9fe8659a311a53bd6a4dc5301db304-integrity/node_modules/ansi-regex/"),
      packageDependencies: new Map([
        ["ansi-regex", "5.0.1"],
      ]),
    }],
  ])],
  ["tar", new Map([
    ["6.2.1", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-tar-6.2.1-717549c541bc3c2af15751bea94b1dd068d4b03a-integrity/node_modules/tar/"),
      packageDependencies: new Map([
        ["chownr", "2.0.0"],
        ["mkdirp", "1.0.4"],
        ["yallist", "4.0.0"],
        ["minipass", "5.0.0"],
        ["minizlib", "2.1.2"],
        ["fs-minipass", "2.1.0"],
        ["tar", "6.2.1"],
      ]),
    }],
  ])],
  ["chownr", new Map([
    ["2.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-chownr-2.0.0-15bfbe53d2eab4cf70f18a8cd68ebe5b3cb1dece-integrity/node_modules/chownr/"),
      packageDependencies: new Map([
        ["chownr", "2.0.0"],
      ]),
    }],
  ])],
  ["mkdirp", new Map([
    ["1.0.4", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-mkdirp-1.0.4-3eb5ed62622756d79a5f0e2a221dfebad75c2f7e-integrity/node_modules/mkdirp/"),
      packageDependencies: new Map([
        ["mkdirp", "1.0.4"],
      ]),
    }],
  ])],
  ["yallist", new Map([
    ["4.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-yallist-4.0.0-9bb92790d9c0effec63be73519e11a35019a3a72-integrity/node_modules/yallist/"),
      packageDependencies: new Map([
        ["yallist", "4.0.0"],
      ]),
    }],
  ])],
  ["minipass", new Map([
    ["5.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-minipass-5.0.0-3e9788ffb90b694a5d0ec94479a45b5d8738133d-integrity/node_modules/minipass/"),
      packageDependencies: new Map([
        ["minipass", "5.0.0"],
      ]),
    }],
    ["3.3.6", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-minipass-3.3.6-7bba384db3a1520d18c9c0e5251c3444e95dd94a-integrity/node_modules/minipass/"),
      packageDependencies: new Map([
        ["yallist", "4.0.0"],
        ["minipass", "3.3.6"],
      ]),
    }],
  ])],
  ["minizlib", new Map([
    ["2.1.2", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-minizlib-2.1.2-e90d3466ba209b932451508a11ce3d3632145931-integrity/node_modules/minizlib/"),
      packageDependencies: new Map([
        ["minipass", "3.3.6"],
        ["yallist", "4.0.0"],
        ["minizlib", "2.1.2"],
      ]),
    }],
  ])],
  ["fs-minipass", new Map([
    ["2.1.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-fs-minipass-2.1.0-7f5036fdbf12c63c169190cbe4199c852271f9fb-integrity/node_modules/fs-minipass/"),
      packageDependencies: new Map([
        ["minipass", "3.3.6"],
        ["fs-minipass", "2.1.0"],
      ]),
    }],
  ])],
  ["tinylogic", new Map([
    ["2.0.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-tinylogic-2.0.0-0d2409c492b54c0663082ac1e3f16be64497bb47-integrity/node_modules/tinylogic/"),
      packageDependencies: new Map([
        ["tinylogic", "2.0.0"],
      ]),
    }],
  ])],
  ["treeify", new Map([
    ["1.1.0", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-treeify-1.1.0-4e31c6a463accd0943879f30667c4fdaff411bb8-integrity/node_modules/treeify/"),
      packageDependencies: new Map([
        ["treeify", "1.1.0"],
      ]),
    }],
  ])],
  ["tunnel", new Map([
    ["0.0.6", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-tunnel-0.0.6-72f1314b34a5b192db012324df2cc587ca47f92c-integrity/node_modules/tunnel/"),
      packageDependencies: new Map([
        ["tunnel", "0.0.6"],
      ]),
    }],
  ])],
  ["@yarnpkg/nm", new Map([
    ["4.0.2", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-nm-4.0.2-6684d70ef4e17ff0c4b9325607d754a1833ddf30-integrity/node_modules/@yarnpkg/nm/"),
      packageDependencies: new Map([
        ["@yarnpkg/core", "4.1.1"],
        ["@yarnpkg/fslib", "3.1.0"],
        ["@yarnpkg/pnp", "4.0.6"],
        ["@yarnpkg/nm", "4.0.2"],
      ]),
    }],
  ])],
  ["@yarnpkg/pnp", new Map([
    ["4.0.6", {
      packageLocation: path.resolve(__dirname, "../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-pnp-4.0.6-97955fc91b21c469d37863831e9777374042f2dd-integrity/node_modules/@yarnpkg/pnp/"),
      packageDependencies: new Map([
        ["@types/node", "18.19.42"],
        ["@yarnpkg/fslib", "3.1.0"],
        ["@yarnpkg/pnp", "4.0.6"],
      ]),
    }],
  ])],
  [null, new Map([
    [null, {
      packageLocation: path.resolve(__dirname, "./"),
      packageDependencies: new Map([
        ["@types/node", "20.14.13"],
        ["typescript", "5.5.4"],
        ["@yarnpkg/pnpify", "4.1.0"],
      ]),
    }],
  ])],
]);

let locatorsByLocations = new Map([
  ["./.pnp/externals/pnp-e3ba6f1029a124439b4bd36d67b3742bee8311f5/node_modules/clipanion/", blacklistedLocator],
  ["./.pnp/externals/pnp-94e29121e08e223b6548d5b1043edec8b393ba2b/node_modules/clipanion/", blacklistedLocator],
  ["./.pnp/externals/pnp-568d3767d64b56082d971d832cea7e16a138c461/node_modules/clipanion/", blacklistedLocator],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-node-20.14.13-bf4fe8959ae1c43bc284de78bd6c01730933736b-integrity/node_modules/@types/node/", {"name":"@types/node","reference":"20.14.13"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-node-22.0.0-04862a2a71e62264426083abe1e27e87cac05a30-integrity/node_modules/@types/node/", {"name":"@types/node","reference":"22.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-node-18.19.42-b54ed4752c85427906aab40917b0f7f3d724bf72-integrity/node_modules/@types/node/", {"name":"@types/node","reference":"18.19.42"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-undici-types-5.26.5-bcd539893d00b56e964fd2657a4866b221a65617-integrity/node_modules/undici-types/", {"name":"undici-types","reference":"5.26.5"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-undici-types-6.11.1-432ea6e8efd54a48569705a699e62d8f4981b197-integrity/node_modules/undici-types/", {"name":"undici-types","reference":"6.11.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-typescript-5.5.4-d9852d6c82bad2d2eda4fd74a5762a8f5909e9ba-integrity/node_modules/typescript/", {"name":"typescript","reference":"5.5.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-pnpify-4.1.0-9af107ac3dd55a6944016f27073a3bae806a24a2-integrity/node_modules/@yarnpkg/pnpify/", {"name":"@yarnpkg/pnpify","reference":"4.1.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-core-4.1.1-2a60094566ff9020d9f02cbc5bd563161fb4c920-integrity/node_modules/@yarnpkg/core/", {"name":"@yarnpkg/core","reference":"4.1.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@arcanis-slice-ansi-1.1.1-0ee328a68996ca45854450033a3d161421dc4f55-integrity/node_modules/@arcanis/slice-ansi/", {"name":"@arcanis/slice-ansi","reference":"1.1.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-grapheme-splitter-1.0.4-9cf3a665c6247479896834af35cf1dbb4400767e-integrity/node_modules/grapheme-splitter/", {"name":"grapheme-splitter","reference":"1.0.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-semver-7.5.8-8268a8c57a3e4abd25c165ecd36237db7948a55e-integrity/node_modules/@types/semver/", {"name":"@types/semver","reference":"7.5.8"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-treeify-1.0.3-f502e11e851b1464d5e80715d5ce3705ad864638-integrity/node_modules/@types/treeify/", {"name":"@types/treeify","reference":"1.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-fslib-3.1.0-e5bda3397b5f070eb65751643f75645307eaa483-integrity/node_modules/@yarnpkg/fslib/", {"name":"@yarnpkg/fslib","reference":"3.1.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-tslib-2.6.3-0438f810ad7a9edcde7a241c3d80db693c8cbfe0-integrity/node_modules/tslib/", {"name":"tslib","reference":"2.6.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-libzip-3.1.0-c33e91bd8bfcc5a5b4cb05b387c04c9ba9fb88b0-integrity/node_modules/@yarnpkg/libzip/", {"name":"@yarnpkg/libzip","reference":"3.1.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-emscripten-1.39.13-afeb1648648dc096efe57983e20387627306e2aa-integrity/node_modules/@types/emscripten/", {"name":"@types/emscripten","reference":"1.39.13"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-parsers-3.0.2-48a1517a0f49124827f4c37c284a689c607b2f32-integrity/node_modules/@yarnpkg/parsers/", {"name":"@yarnpkg/parsers","reference":"3.0.2"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-js-yaml-3.14.1-dae812fdb3825fa306609a8717383c50c36a0537-integrity/node_modules/js-yaml/", {"name":"js-yaml","reference":"3.14.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-argparse-1.0.10-bcd6791ea5ae09725e17e5ad988134cd40b3d911-integrity/node_modules/argparse/", {"name":"argparse","reference":"1.0.10"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-sprintf-js-1.0.3-04e6926f662895354f3dd015203633b857297e2c-integrity/node_modules/sprintf-js/", {"name":"sprintf-js","reference":"1.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-esprima-4.0.1-13b04cdb3e6c5d19df91ab6987a8695619b0aa71-integrity/node_modules/esprima/", {"name":"esprima","reference":"4.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-shell-4.0.2-2932063536a8cf2c0c4f0d6201b95f54dc81c3c1-integrity/node_modules/@yarnpkg/shell/", {"name":"@yarnpkg/shell","reference":"4.0.2"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-chalk-3.0.0-3f73c2bf526591f574cc492c51e2456349f844e4-integrity/node_modules/chalk/", {"name":"chalk","reference":"3.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-ansi-styles-4.3.0-edd803628ae71c04c85ae7a0906edad34b648937-integrity/node_modules/ansi-styles/", {"name":"ansi-styles","reference":"4.3.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-color-convert-2.0.1-72d3a68d598c9bdb3af2ad1e84f21d896abd4de3-integrity/node_modules/color-convert/", {"name":"color-convert","reference":"2.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-color-name-1.1.4-c2a09a87acbde69543de6f63fa3995c826c536a2-integrity/node_modules/color-name/", {"name":"color-name","reference":"1.1.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-supports-color-7.2.0-1b7dcdcb32b8138801b3e478ba6a51caa89648da-integrity/node_modules/supports-color/", {"name":"supports-color","reference":"7.2.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-has-flag-4.0.0-944771fd9c81c81265c4d6941860da06bb59479b-integrity/node_modules/has-flag/", {"name":"has-flag","reference":"4.0.0"}],
  ["./.pnp/externals/pnp-568d3767d64b56082d971d832cea7e16a138c461/node_modules/clipanion/", {"name":"clipanion","reference":"pnp:568d3767d64b56082d971d832cea7e16a138c461"}],
  ["./.pnp/externals/pnp-94e29121e08e223b6548d5b1043edec8b393ba2b/node_modules/clipanion/", {"name":"clipanion","reference":"pnp:94e29121e08e223b6548d5b1043edec8b393ba2b"}],
  ["./.pnp/externals/pnp-e3ba6f1029a124439b4bd36d67b3742bee8311f5/node_modules/clipanion/", {"name":"clipanion","reference":"pnp:e3ba6f1029a124439b4bd36d67b3742bee8311f5"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-cross-spawn-7.0.3-f73a85b9d5d41d045551c177e2882d4ac85728a6-integrity/node_modules/cross-spawn/", {"name":"cross-spawn","reference":"7.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-path-key-3.1.1-581f6ade658cbba65a0d3380de7753295054f375-integrity/node_modules/path-key/", {"name":"path-key","reference":"3.1.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-shebang-command-2.0.0-ccd0af4f8835fbdc265b82461aaf0c36663f34ea-integrity/node_modules/shebang-command/", {"name":"shebang-command","reference":"2.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-shebang-regex-3.0.0-ae16f1644d873ecad843b0307b143362d4c42172-integrity/node_modules/shebang-regex/", {"name":"shebang-regex","reference":"3.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-which-2.0.2-7c6a8dd0a636a0327e10b59c9286eee93f3f51b1-integrity/node_modules/which/", {"name":"which","reference":"2.0.2"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-isexe-2.0.0-e8fbf374dc556ff8947a10dcb0572d633f2cfa10-integrity/node_modules/isexe/", {"name":"isexe","reference":"2.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-fast-glob-3.3.2-a904501e57cfdd2ffcded45e99a54fef55e46129-integrity/node_modules/fast-glob/", {"name":"fast-glob","reference":"3.3.2"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@nodelib-fs-stat-2.0.5-5bd262af94e9d25bd1e71b05deed44876a222e8b-integrity/node_modules/@nodelib/fs.stat/", {"name":"@nodelib/fs.stat","reference":"2.0.5"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@nodelib-fs-walk-1.2.8-e95737e8bb6746ddedf69c556953494f196fe69a-integrity/node_modules/@nodelib/fs.walk/", {"name":"@nodelib/fs.walk","reference":"1.2.8"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@nodelib-fs-scandir-2.1.5-7619c2eb21b25483f6d167548b4cfd5a7488c3d5-integrity/node_modules/@nodelib/fs.scandir/", {"name":"@nodelib/fs.scandir","reference":"2.1.5"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-run-parallel-1.2.0-66d1368da7bdf921eb9d95bd1a9229e7f21a43ee-integrity/node_modules/run-parallel/", {"name":"run-parallel","reference":"1.2.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-queue-microtask-1.2.3-4929228bbc724dfac43e0efb058caf7b6cfb6243-integrity/node_modules/queue-microtask/", {"name":"queue-microtask","reference":"1.2.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-fastq-1.17.1-2a523f07a4e7b1e81a42b91b8bf2254107753b47-integrity/node_modules/fastq/", {"name":"fastq","reference":"1.17.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-reusify-1.0.4-90da382b1e126efc02146e90845a88db12925d76-integrity/node_modules/reusify/", {"name":"reusify","reference":"1.0.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-glob-parent-5.1.2-869832c58034fe68a4093c17dc15e8340d8401c4-integrity/node_modules/glob-parent/", {"name":"glob-parent","reference":"5.1.2"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-is-glob-4.0.3-64f61e42cbbb2eec2071a9dac0b28ba1e65d5084-integrity/node_modules/is-glob/", {"name":"is-glob","reference":"4.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-is-extglob-2.1.1-a88c02535791f02ed37c76a1b9ea9773c833f8c2-integrity/node_modules/is-extglob/", {"name":"is-extglob","reference":"2.1.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-merge2-1.4.1-4368892f885e907455a6fd7dc55c0c9d404990ae-integrity/node_modules/merge2/", {"name":"merge2","reference":"1.4.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-micromatch-4.0.7-33e8190d9fe474a9895525f5618eee136d46c2e5-integrity/node_modules/micromatch/", {"name":"micromatch","reference":"4.0.7"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-braces-3.0.3-490332f40919452272d55a8480adc0c441358789-integrity/node_modules/braces/", {"name":"braces","reference":"3.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-fill-range-7.1.1-44265d3cac07e3ea7dc247516380643754a05292-integrity/node_modules/fill-range/", {"name":"fill-range","reference":"7.1.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-to-regex-range-5.0.1-1648c44aae7c8d988a326018ed72f5b4dd0392e4-integrity/node_modules/to-regex-range/", {"name":"to-regex-range","reference":"5.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-is-number-7.0.0-7535345b896734d5f80c4d06c50955527a14f12b-integrity/node_modules/is-number/", {"name":"is-number","reference":"7.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-picomatch-2.3.1-3ba3833733646d9d3e4995946c1365a67fb07a42-integrity/node_modules/picomatch/", {"name":"picomatch","reference":"2.3.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-camelcase-5.3.1-e3c9b31569e106811df242f715725a1f4c494320-integrity/node_modules/camelcase/", {"name":"camelcase","reference":"5.3.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-ci-info-3.9.0-4279a62028a7b1f262f3473fc9605f5e218c59b4-integrity/node_modules/ci-info/", {"name":"ci-info","reference":"3.9.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-diff-5.2.0-26ded047cd1179b78b9537d5ef725503ce1ae531-integrity/node_modules/diff/", {"name":"diff","reference":"5.2.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-dotenv-16.4.5-cdd3b3b604cb327e286b4762e13502f717cb099f-integrity/node_modules/dotenv/", {"name":"dotenv","reference":"16.4.5"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-got-11.8.6-276e827ead8772eddbcfc97170590b841823233a-integrity/node_modules/got/", {"name":"got","reference":"11.8.6"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-p-cancelable-2.1.1-aab7fbd416582fa32a3db49859c122487c5ed2cf-integrity/node_modules/p-cancelable/", {"name":"p-cancelable","reference":"2.1.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-responselike-2.0.1-9a0bc8fdc252f3fb1cca68b016591059ba1422bc-integrity/node_modules/responselike/", {"name":"responselike","reference":"2.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-lowercase-keys-2.0.0-2603e78b7b4b0006cbca2fbcc8a3202558ac9479-integrity/node_modules/lowercase-keys/", {"name":"lowercase-keys","reference":"2.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-http2-wrapper-1.0.3-b8f55e0c1f25d4ebd08b3b0c2c079f9590800b3d-integrity/node_modules/http2-wrapper/", {"name":"http2-wrapper","reference":"1.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-quick-lru-5.1.1-366493e6b3e42a3a6885e2e99d18f80fb7a8c932-integrity/node_modules/quick-lru/", {"name":"quick-lru","reference":"5.1.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-resolve-alpn-1.2.1-b7adbdac3546aaaec20b45e7d8265927072726f9-integrity/node_modules/resolve-alpn/", {"name":"resolve-alpn","reference":"1.2.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@sindresorhus-is-4.6.0-3c7c9c46e678feefe7a2e5bb609d3dbd665ffb3f-integrity/node_modules/@sindresorhus/is/", {"name":"@sindresorhus/is","reference":"4.6.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-cacheable-lookup-5.0.4-5a6b865b2c44357be3d5ebc2a467b032719a7005-integrity/node_modules/cacheable-lookup/", {"name":"cacheable-lookup","reference":"5.0.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-cacheable-request-7.0.4-7a33ebf08613178b403635be7b899d3e69bbe817-integrity/node_modules/cacheable-request/", {"name":"cacheable-request","reference":"7.0.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-clone-response-1.0.3-af2032aa47816399cf5f0a1d0db902f517abb8c3-integrity/node_modules/clone-response/", {"name":"clone-response","reference":"1.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-mimic-response-1.0.1-4923538878eef42063cb8a3e3b0798781487ab1b-integrity/node_modules/mimic-response/", {"name":"mimic-response","reference":"1.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-mimic-response-3.1.0-2d1d59af9c1b129815accc2c46a022a5ce1fa3c9-integrity/node_modules/mimic-response/", {"name":"mimic-response","reference":"3.1.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-get-stream-5.2.0-4966a1795ee5ace65e706c4b7beb71257d6e22d3-integrity/node_modules/get-stream/", {"name":"get-stream","reference":"5.2.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-pump-3.0.0-b4a2116815bde2f4e1ea602354e8c75565107a64-integrity/node_modules/pump/", {"name":"pump","reference":"3.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-end-of-stream-1.4.4-5ae64a5f45057baf3626ec14da0ca5e4b2431eb0-integrity/node_modules/end-of-stream/", {"name":"end-of-stream","reference":"1.4.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-once-1.4.0-583b1aa775961d4b113ac17d9c50baef9dd76bd1-integrity/node_modules/once/", {"name":"once","reference":"1.4.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-wrappy-1.0.2-b5243d8f3ec1aa35f1364605bc0d1036e30ab69f-integrity/node_modules/wrappy/", {"name":"wrappy","reference":"1.0.2"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-http-cache-semantics-4.1.1-abe02fcb2985460bf0323be664436ec3476a6d5a-integrity/node_modules/http-cache-semantics/", {"name":"http-cache-semantics","reference":"4.1.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-keyv-4.5.4-a879a99e29452f942439f2a405e3af8b31d4de93-integrity/node_modules/keyv/", {"name":"keyv","reference":"4.5.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-json-buffer-3.0.1-9338802a30d3b6605fbe0613e094008ca8c05a13-integrity/node_modules/json-buffer/", {"name":"json-buffer","reference":"3.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-normalize-url-6.1.0-40d0885b535deffe3f3147bec877d05fe4c5668a-integrity/node_modules/normalize-url/", {"name":"normalize-url","reference":"6.1.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-responselike-1.0.3-cc29706f0a397cfe6df89debfe4bf5cea159db50-integrity/node_modules/@types/responselike/", {"name":"@types/responselike","reference":"1.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-decompress-response-6.0.0-ca387612ddb7e104bd16d85aab00d5ecf09c66fc-integrity/node_modules/decompress-response/", {"name":"decompress-response","reference":"6.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@szmarczak-http-timer-4.0.6-b4a914bb62e7c272d4e5989fe4440f812ab1d807-integrity/node_modules/@szmarczak/http-timer/", {"name":"@szmarczak/http-timer","reference":"4.0.6"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-defer-to-connect-2.0.1-8016bdb4143e4632b77a3449c6236277de520587-integrity/node_modules/defer-to-connect/", {"name":"defer-to-connect","reference":"2.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-cacheable-request-6.0.3-a430b3260466ca7b5ca5bfd735693b36e7a9d183-integrity/node_modules/@types/cacheable-request/", {"name":"@types/cacheable-request","reference":"6.0.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-http-cache-semantics-4.0.4-b979ebad3919799c979b17c72621c0bc0a31c6c4-integrity/node_modules/@types/http-cache-semantics/", {"name":"@types/http-cache-semantics","reference":"4.0.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@types-keyv-3.1.4-3ccdb1c6751b0c7e52300bcdacd5bcbf8faa75b6-integrity/node_modules/@types/keyv/", {"name":"@types/keyv","reference":"3.1.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-lodash-4.17.21-679591c564c3bffaae8454cf0b3df370c3d6911c-integrity/node_modules/lodash/", {"name":"lodash","reference":"4.17.21"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-p-limit-2.3.0-3dd33c647a214fdfffd835933eb086da0dc21db1-integrity/node_modules/p-limit/", {"name":"p-limit","reference":"2.3.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-p-try-2.2.0-cb2868540e313d61de58fafbe35ce9004d5540e6-integrity/node_modules/p-try/", {"name":"p-try","reference":"2.2.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-semver-7.6.3-980f7b5550bc175fb4dc09403085627f9eb33143-integrity/node_modules/semver/", {"name":"semver","reference":"7.6.3"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-strip-ansi-6.0.1-9e26c63d30f53443e9489495b2105d37b67a85d9-integrity/node_modules/strip-ansi/", {"name":"strip-ansi","reference":"6.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-ansi-regex-5.0.1-082cb2c89c9fe8659a311a53bd6a4dc5301db304-integrity/node_modules/ansi-regex/", {"name":"ansi-regex","reference":"5.0.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-tar-6.2.1-717549c541bc3c2af15751bea94b1dd068d4b03a-integrity/node_modules/tar/", {"name":"tar","reference":"6.2.1"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-chownr-2.0.0-15bfbe53d2eab4cf70f18a8cd68ebe5b3cb1dece-integrity/node_modules/chownr/", {"name":"chownr","reference":"2.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-mkdirp-1.0.4-3eb5ed62622756d79a5f0e2a221dfebad75c2f7e-integrity/node_modules/mkdirp/", {"name":"mkdirp","reference":"1.0.4"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-yallist-4.0.0-9bb92790d9c0effec63be73519e11a35019a3a72-integrity/node_modules/yallist/", {"name":"yallist","reference":"4.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-minipass-5.0.0-3e9788ffb90b694a5d0ec94479a45b5d8738133d-integrity/node_modules/minipass/", {"name":"minipass","reference":"5.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-minipass-3.3.6-7bba384db3a1520d18c9c0e5251c3444e95dd94a-integrity/node_modules/minipass/", {"name":"minipass","reference":"3.3.6"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-minizlib-2.1.2-e90d3466ba209b932451508a11ce3d3632145931-integrity/node_modules/minizlib/", {"name":"minizlib","reference":"2.1.2"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-fs-minipass-2.1.0-7f5036fdbf12c63c169190cbe4199c852271f9fb-integrity/node_modules/fs-minipass/", {"name":"fs-minipass","reference":"2.1.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-tinylogic-2.0.0-0d2409c492b54c0663082ac1e3f16be64497bb47-integrity/node_modules/tinylogic/", {"name":"tinylogic","reference":"2.0.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-treeify-1.1.0-4e31c6a463accd0943879f30667c4fdaff411bb8-integrity/node_modules/treeify/", {"name":"treeify","reference":"1.1.0"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-tunnel-0.0.6-72f1314b34a5b192db012324df2cc587ca47f92c-integrity/node_modules/tunnel/", {"name":"tunnel","reference":"0.0.6"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-nm-4.0.2-6684d70ef4e17ff0c4b9325607d754a1833ddf30-integrity/node_modules/@yarnpkg/nm/", {"name":"@yarnpkg/nm","reference":"4.0.2"}],
  ["../../AppData/Local/Yarn/Cache/v6/npm-@yarnpkg-pnp-4.0.6-97955fc91b21c469d37863831e9777374042f2dd-integrity/node_modules/@yarnpkg/pnp/", {"name":"@yarnpkg/pnp","reference":"4.0.6"}],
  ["./", topLevelLocator],
]);
exports.findPackageLocator = function findPackageLocator(location) {
  let relativeLocation = normalizePath(path.relative(__dirname, location));

  if (!relativeLocation.match(isStrictRegExp))
    relativeLocation = `./${relativeLocation}`;

  if (location.match(isDirRegExp) && relativeLocation.charAt(relativeLocation.length - 1) !== '/')
    relativeLocation = `${relativeLocation}/`;

  let match;

  if (relativeLocation.length >= 164 && relativeLocation[163] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 164)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 158 && relativeLocation[157] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 158)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 152 && relativeLocation[151] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 152)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 150 && relativeLocation[149] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 150)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 148 && relativeLocation[147] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 148)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 146 && relativeLocation[145] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 146)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 144 && relativeLocation[143] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 144)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 142 && relativeLocation[141] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 142)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 140 && relativeLocation[139] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 140)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 138 && relativeLocation[137] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 138)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 136 && relativeLocation[135] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 136)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 135 && relativeLocation[134] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 135)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 134 && relativeLocation[133] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 134)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 133 && relativeLocation[132] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 133)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 132 && relativeLocation[131] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 132)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 130 && relativeLocation[129] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 130)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 128 && relativeLocation[127] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 128)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 127 && relativeLocation[126] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 127)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 126 && relativeLocation[125] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 126)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 125 && relativeLocation[124] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 125)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 124 && relativeLocation[123] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 124)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 123 && relativeLocation[122] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 123)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 122 && relativeLocation[121] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 122)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 121 && relativeLocation[120] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 121)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 120 && relativeLocation[119] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 120)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 118 && relativeLocation[117] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 118)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 117 && relativeLocation[116] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 117)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 116 && relativeLocation[115] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 116)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 85 && relativeLocation[84] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 85)))
      return blacklistCheck(match);

  if (relativeLocation.length >= 2 && relativeLocation[1] === '/')
    if (match = locatorsByLocations.get(relativeLocation.substr(0, 2)))
      return blacklistCheck(match);

  return null;
};


/**
 * Returns the module that should be used to resolve require calls. It's usually the direct parent, except if we're
 * inside an eval expression.
 */

function getIssuerModule(parent) {
  let issuer = parent;

  while (issuer && (issuer.id === '[eval]' || issuer.id === '<repl>' || !issuer.filename)) {
    issuer = issuer.parent;
  }

  return issuer;
}

/**
 * Returns information about a package in a safe way (will throw if they cannot be retrieved)
 */

function getPackageInformationSafe(packageLocator) {
  const packageInformation = exports.getPackageInformation(packageLocator);

  if (!packageInformation) {
    throw makeError(
      `INTERNAL`,
      `Couldn't find a matching entry in the dependency tree for the specified parent (this is probably an internal error)`
    );
  }

  return packageInformation;
}

/**
 * Implements the node resolution for folder access and extension selection
 */

function applyNodeExtensionResolution(unqualifiedPath, {extensions}) {
  // We use this "infinite while" so that we can restart the process as long as we hit package folders
  while (true) {
    let stat;

    try {
      stat = statSync(unqualifiedPath);
    } catch (error) {}

    // If the file exists and is a file, we can stop right there

    if (stat && !stat.isDirectory()) {
      // If the very last component of the resolved path is a symlink to a file, we then resolve it to a file. We only
      // do this first the last component, and not the rest of the path! This allows us to support the case of bin
      // symlinks, where a symlink in "/xyz/pkg-name/.bin/bin-name" will point somewhere else (like "/xyz/pkg-name/index.js").
      // In such a case, we want relative requires to be resolved relative to "/xyz/pkg-name/" rather than "/xyz/pkg-name/.bin/".
      //
      // Also note that the reason we must use readlink on the last component (instead of realpath on the whole path)
      // is that we must preserve the other symlinks, in particular those used by pnp to deambiguate packages using
      // peer dependencies. For example, "/xyz/.pnp/local/pnp-01234569/.bin/bin-name" should see its relative requires
      // be resolved relative to "/xyz/.pnp/local/pnp-0123456789/" rather than "/xyz/pkg-with-peers/", because otherwise
      // we would lose the information that would tell us what are the dependencies of pkg-with-peers relative to its
      // ancestors.

      if (lstatSync(unqualifiedPath).isSymbolicLink()) {
        unqualifiedPath = path.normalize(path.resolve(path.dirname(unqualifiedPath), readlinkSync(unqualifiedPath)));
      }

      return unqualifiedPath;
    }

    // If the file is a directory, we must check if it contains a package.json with a "main" entry

    if (stat && stat.isDirectory()) {
      let pkgJson;

      try {
        pkgJson = JSON.parse(readFileSync(`${unqualifiedPath}/package.json`, 'utf-8'));
      } catch (error) {}

      let nextUnqualifiedPath;

      if (pkgJson && pkgJson.main) {
        nextUnqualifiedPath = path.resolve(unqualifiedPath, pkgJson.main);
      }

      // If the "main" field changed the path, we start again from this new location

      if (nextUnqualifiedPath && nextUnqualifiedPath !== unqualifiedPath) {
        const resolution = applyNodeExtensionResolution(nextUnqualifiedPath, {extensions});

        if (resolution !== null) {
          return resolution;
        }
      }
    }

    // Otherwise we check if we find a file that match one of the supported extensions

    const qualifiedPath = extensions
      .map(extension => {
        return `${unqualifiedPath}${extension}`;
      })
      .find(candidateFile => {
        return existsSync(candidateFile);
      });

    if (qualifiedPath) {
      return qualifiedPath;
    }

    // Otherwise, we check if the path is a folder - in such a case, we try to use its index

    if (stat && stat.isDirectory()) {
      const indexPath = extensions
        .map(extension => {
          return `${unqualifiedPath}/index${extension}`;
        })
        .find(candidateFile => {
          return existsSync(candidateFile);
        });

      if (indexPath) {
        return indexPath;
      }
    }

    // Otherwise there's nothing else we can do :(

    return null;
  }
}

/**
 * This function creates fake modules that can be used with the _resolveFilename function.
 * Ideally it would be nice to be able to avoid this, since it causes useless allocations
 * and cannot be cached efficiently (we recompute the nodeModulePaths every time).
 *
 * Fortunately, this should only affect the fallback, and there hopefully shouldn't be a
 * lot of them.
 */

function makeFakeModule(path) {
  const fakeModule = new Module(path, false);
  fakeModule.filename = path;
  fakeModule.paths = Module._nodeModulePaths(path);
  return fakeModule;
}

/**
 * Normalize path to posix format.
 */

function normalizePath(fsPath) {
  fsPath = path.normalize(fsPath);

  if (process.platform === 'win32') {
    fsPath = fsPath.replace(backwardSlashRegExp, '/');
  }

  return fsPath;
}

/**
 * Forward the resolution to the next resolver (usually the native one)
 */

function callNativeResolution(request, issuer) {
  if (issuer.endsWith('/')) {
    issuer += 'internal.js';
  }

  try {
    enableNativeHooks = false;

    // Since we would need to create a fake module anyway (to call _resolveLookupPath that
    // would give us the paths to give to _resolveFilename), we can as well not use
    // the {paths} option at all, since it internally makes _resolveFilename create another
    // fake module anyway.
    return Module._resolveFilename(request, makeFakeModule(issuer), false);
  } finally {
    enableNativeHooks = true;
  }
}

/**
 * This key indicates which version of the standard is implemented by this resolver. The `std` key is the
 * Plug'n'Play standard, and any other key are third-party extensions. Third-party extensions are not allowed
 * to override the standard, and can only offer new methods.
 *
 * If an new version of the Plug'n'Play standard is released and some extensions conflict with newly added
 * functions, they'll just have to fix the conflicts and bump their own version number.
 */

exports.VERSIONS = {std: 1};

/**
 * Useful when used together with getPackageInformation to fetch information about the top-level package.
 */

exports.topLevel = {name: null, reference: null};

/**
 * Gets the package information for a given locator. Returns null if they cannot be retrieved.
 */

exports.getPackageInformation = function getPackageInformation({name, reference}) {
  const packageInformationStore = packageInformationStores.get(name);

  if (!packageInformationStore) {
    return null;
  }

  const packageInformation = packageInformationStore.get(reference);

  if (!packageInformation) {
    return null;
  }

  return packageInformation;
};

/**
 * Transforms a request (what's typically passed as argument to the require function) into an unqualified path.
 * This path is called "unqualified" because it only changes the package name to the package location on the disk,
 * which means that the end result still cannot be directly accessed (for example, it doesn't try to resolve the
 * file extension, or to resolve directories to their "index.js" content). Use the "resolveUnqualified" function
 * to convert them to fully-qualified paths, or just use "resolveRequest" that do both operations in one go.
 *
 * Note that it is extremely important that the `issuer` path ends with a forward slash if the issuer is to be
 * treated as a folder (ie. "/tmp/foo/" rather than "/tmp/foo" if "foo" is a directory). Otherwise relative
 * imports won't be computed correctly (they'll get resolved relative to "/tmp/" instead of "/tmp/foo/").
 */

exports.resolveToUnqualified = function resolveToUnqualified(request, issuer, {considerBuiltins = true} = {}) {
  // The 'pnpapi' request is reserved and will always return the path to the PnP file, from everywhere

  if (request === `pnpapi`) {
    return pnpFile;
  }

  // Bailout if the request is a native module

  if (considerBuiltins && builtinModules.has(request)) {
    return null;
  }

  // We allow disabling the pnp resolution for some subpaths. This is because some projects, often legacy,
  // contain multiple levels of dependencies (ie. a yarn.lock inside a subfolder of a yarn.lock). This is
  // typically solved using workspaces, but not all of them have been converted already.

  if (ignorePattern && ignorePattern.test(normalizePath(issuer))) {
    const result = callNativeResolution(request, issuer);

    if (result === false) {
      throw makeError(
        `BUILTIN_NODE_RESOLUTION_FAIL`,
        `The builtin node resolution algorithm was unable to resolve the module referenced by "${request}" and requested from "${issuer}" (it didn't go through the pnp resolver because the issuer was explicitely ignored by the regexp "null")`,
        {
          request,
          issuer,
        }
      );
    }

    return result;
  }

  let unqualifiedPath;

  // If the request is a relative or absolute path, we just return it normalized

  const dependencyNameMatch = request.match(pathRegExp);

  if (!dependencyNameMatch) {
    if (path.isAbsolute(request)) {
      unqualifiedPath = path.normalize(request);
    } else if (issuer.match(isDirRegExp)) {
      unqualifiedPath = path.normalize(path.resolve(issuer, request));
    } else {
      unqualifiedPath = path.normalize(path.resolve(path.dirname(issuer), request));
    }
  }

  // Things are more hairy if it's a package require - we then need to figure out which package is needed, and in
  // particular the exact version for the given location on the dependency tree

  if (dependencyNameMatch) {
    const [, dependencyName, subPath] = dependencyNameMatch;

    const issuerLocator = exports.findPackageLocator(issuer);

    // If the issuer file doesn't seem to be owned by a package managed through pnp, then we resort to using the next
    // resolution algorithm in the chain, usually the native Node resolution one

    if (!issuerLocator) {
      const result = callNativeResolution(request, issuer);

      if (result === false) {
        throw makeError(
          `BUILTIN_NODE_RESOLUTION_FAIL`,
          `The builtin node resolution algorithm was unable to resolve the module referenced by "${request}" and requested from "${issuer}" (it didn't go through the pnp resolver because the issuer doesn't seem to be part of the Yarn-managed dependency tree)`,
          {
            request,
            issuer,
          }
        );
      }

      return result;
    }

    const issuerInformation = getPackageInformationSafe(issuerLocator);

    // We obtain the dependency reference in regard to the package that request it

    let dependencyReference = issuerInformation.packageDependencies.get(dependencyName);

    // If we can't find it, we check if we can potentially load it from the packages that have been defined as potential fallbacks.
    // It's a bit of a hack, but it improves compatibility with the existing Node ecosystem. Hopefully we should eventually be able
    // to kill this logic and become stricter once pnp gets enough traction and the affected packages fix themselves.

    if (issuerLocator !== topLevelLocator) {
      for (let t = 0, T = fallbackLocators.length; dependencyReference === undefined && t < T; ++t) {
        const fallbackInformation = getPackageInformationSafe(fallbackLocators[t]);
        dependencyReference = fallbackInformation.packageDependencies.get(dependencyName);
      }
    }

    // If we can't find the path, and if the package making the request is the top-level, we can offer nicer error messages

    if (!dependencyReference) {
      if (dependencyReference === null) {
        if (issuerLocator === topLevelLocator) {
          throw makeError(
            `MISSING_PEER_DEPENDENCY`,
            `You seem to be requiring a peer dependency ("${dependencyName}"), but it is not installed (which might be because you're the top-level package)`,
            {request, issuer, dependencyName}
          );
        } else {
          throw makeError(
            `MISSING_PEER_DEPENDENCY`,
            `Package "${issuerLocator.name}@${issuerLocator.reference}" is trying to access a peer dependency ("${dependencyName}") that should be provided by its direct ancestor but isn't`,
            {request, issuer, issuerLocator: Object.assign({}, issuerLocator), dependencyName}
          );
        }
      } else {
        if (issuerLocator === topLevelLocator) {
          throw makeError(
            `UNDECLARED_DEPENDENCY`,
            `You cannot require a package ("${dependencyName}") that is not declared in your dependencies (via "${issuer}")`,
            {request, issuer, dependencyName}
          );
        } else {
          const candidates = Array.from(issuerInformation.packageDependencies.keys());
          throw makeError(
            `UNDECLARED_DEPENDENCY`,
            `Package "${issuerLocator.name}@${issuerLocator.reference}" (via "${issuer}") is trying to require the package "${dependencyName}" (via "${request}") without it being listed in its dependencies (${candidates.join(
              `, `
            )})`,
            {request, issuer, issuerLocator: Object.assign({}, issuerLocator), dependencyName, candidates}
          );
        }
      }
    }

    // We need to check that the package exists on the filesystem, because it might not have been installed

    const dependencyLocator = {name: dependencyName, reference: dependencyReference};
    const dependencyInformation = exports.getPackageInformation(dependencyLocator);
    const dependencyLocation = path.resolve(__dirname, dependencyInformation.packageLocation);

    if (!dependencyLocation) {
      throw makeError(
        `MISSING_DEPENDENCY`,
        `Package "${dependencyLocator.name}@${dependencyLocator.reference}" is a valid dependency, but hasn't been installed and thus cannot be required (it might be caused if you install a partial tree, such as on production environments)`,
        {request, issuer, dependencyLocator: Object.assign({}, dependencyLocator)}
      );
    }

    // Now that we know which package we should resolve to, we only have to find out the file location

    if (subPath) {
      unqualifiedPath = path.resolve(dependencyLocation, subPath);
    } else {
      unqualifiedPath = dependencyLocation;
    }
  }

  return path.normalize(unqualifiedPath);
};

/**
 * Transforms an unqualified path into a qualified path by using the Node resolution algorithm (which automatically
 * appends ".js" / ".json", and transforms directory accesses into "index.js").
 */

exports.resolveUnqualified = function resolveUnqualified(
  unqualifiedPath,
  {extensions = Object.keys(Module._extensions)} = {}
) {
  const qualifiedPath = applyNodeExtensionResolution(unqualifiedPath, {extensions});

  if (qualifiedPath) {
    return path.normalize(qualifiedPath);
  } else {
    throw makeError(
      `QUALIFIED_PATH_RESOLUTION_FAILED`,
      `Couldn't find a suitable Node resolution for unqualified path "${unqualifiedPath}"`,
      {unqualifiedPath}
    );
  }
};

/**
 * Transforms a request into a fully qualified path.
 *
 * Note that it is extremely important that the `issuer` path ends with a forward slash if the issuer is to be
 * treated as a folder (ie. "/tmp/foo/" rather than "/tmp/foo" if "foo" is a directory). Otherwise relative
 * imports won't be computed correctly (they'll get resolved relative to "/tmp/" instead of "/tmp/foo/").
 */

exports.resolveRequest = function resolveRequest(request, issuer, {considerBuiltins, extensions} = {}) {
  let unqualifiedPath;

  try {
    unqualifiedPath = exports.resolveToUnqualified(request, issuer, {considerBuiltins});
  } catch (originalError) {
    // If we get a BUILTIN_NODE_RESOLUTION_FAIL error there, it means that we've had to use the builtin node
    // resolution, which usually shouldn't happen. It might be because the user is trying to require something
    // from a path loaded through a symlink (which is not possible, because we need something normalized to
    // figure out which package is making the require call), so we try to make the same request using a fully
    // resolved issuer and throws a better and more actionable error if it works.
    if (originalError.code === `BUILTIN_NODE_RESOLUTION_FAIL`) {
      let realIssuer;

      try {
        realIssuer = realpathSync(issuer);
      } catch (error) {}

      if (realIssuer) {
        if (issuer.endsWith(`/`)) {
          realIssuer = realIssuer.replace(/\/?$/, `/`);
        }

        try {
          exports.resolveToUnqualified(request, realIssuer, {considerBuiltins});
        } catch (error) {
          // If an error was thrown, the problem doesn't seem to come from a path not being normalized, so we
          // can just throw the original error which was legit.
          throw originalError;
        }

        // If we reach this stage, it means that resolveToUnqualified didn't fail when using the fully resolved
        // file path, which is very likely caused by a module being invoked through Node with a path not being
        // correctly normalized (ie you should use "node $(realpath script.js)" instead of "node script.js").
        throw makeError(
          `SYMLINKED_PATH_DETECTED`,
          `A pnp module ("${request}") has been required from what seems to be a symlinked path ("${issuer}"). This is not possible, you must ensure that your modules are invoked through their fully resolved path on the filesystem (in this case "${realIssuer}").`,
          {
            request,
            issuer,
            realIssuer,
          }
        );
      }
    }
    throw originalError;
  }

  if (unqualifiedPath === null) {
    return null;
  }

  try {
    return exports.resolveUnqualified(unqualifiedPath, {extensions});
  } catch (resolutionError) {
    if (resolutionError.code === 'QUALIFIED_PATH_RESOLUTION_FAILED') {
      Object.assign(resolutionError.data, {request, issuer});
    }
    throw resolutionError;
  }
};

/**
 * Setups the hook into the Node environment.
 *
 * From this point on, any call to `require()` will go through the "resolveRequest" function, and the result will
 * be used as path of the file to load.
 */

exports.setup = function setup() {
  // A small note: we don't replace the cache here (and instead use the native one). This is an effort to not
  // break code similar to "delete require.cache[require.resolve(FOO)]", where FOO is a package located outside
  // of the Yarn dependency tree. In this case, we defer the load to the native loader. If we were to replace the
  // cache by our own, the native loader would populate its own cache, which wouldn't be exposed anymore, so the
  // delete call would be broken.

  const originalModuleLoad = Module._load;

  Module._load = function(request, parent, isMain) {
    if (!enableNativeHooks) {
      return originalModuleLoad.call(Module, request, parent, isMain);
    }

    // Builtins are managed by the regular Node loader

    if (builtinModules.has(request)) {
      try {
        enableNativeHooks = false;
        return originalModuleLoad.call(Module, request, parent, isMain);
      } finally {
        enableNativeHooks = true;
      }
    }

    // The 'pnpapi' name is reserved to return the PnP api currently in use by the program

    if (request === `pnpapi`) {
      return pnpModule.exports;
    }

    // Request `Module._resolveFilename` (ie. `resolveRequest`) to tell us which file we should load

    const modulePath = Module._resolveFilename(request, parent, isMain);

    // Check if the module has already been created for the given file

    const cacheEntry = Module._cache[modulePath];

    if (cacheEntry) {
      return cacheEntry.exports;
    }

    // Create a new module and store it into the cache

    const module = new Module(modulePath, parent);
    Module._cache[modulePath] = module;

    // The main module is exposed as global variable

    if (isMain) {
      process.mainModule = module;
      module.id = '.';
    }

    // Try to load the module, and remove it from the cache if it fails

    let hasThrown = true;

    try {
      module.load(modulePath);
      hasThrown = false;
    } finally {
      if (hasThrown) {
        delete Module._cache[modulePath];
      }
    }

    // Some modules might have to be patched for compatibility purposes

    for (const [filter, patchFn] of patchedModules) {
      if (filter.test(request)) {
        module.exports = patchFn(exports.findPackageLocator(parent.filename), module.exports);
      }
    }

    return module.exports;
  };

  const originalModuleResolveFilename = Module._resolveFilename;

  Module._resolveFilename = function(request, parent, isMain, options) {
    if (!enableNativeHooks) {
      return originalModuleResolveFilename.call(Module, request, parent, isMain, options);
    }

    let issuers;

    if (options) {
      const optionNames = new Set(Object.keys(options));
      optionNames.delete('paths');

      if (optionNames.size > 0) {
        throw makeError(
          `UNSUPPORTED`,
          `Some options passed to require() aren't supported by PnP yet (${Array.from(optionNames).join(', ')})`
        );
      }

      if (options.paths) {
        issuers = options.paths.map(entry => `${path.normalize(entry)}/`);
      }
    }

    if (!issuers) {
      const issuerModule = getIssuerModule(parent);
      const issuer = issuerModule ? issuerModule.filename : `${process.cwd()}/`;

      issuers = [issuer];
    }

    let firstError;

    for (const issuer of issuers) {
      let resolution;

      try {
        resolution = exports.resolveRequest(request, issuer);
      } catch (error) {
        firstError = firstError || error;
        continue;
      }

      return resolution !== null ? resolution : request;
    }

    throw firstError;
  };

  const originalFindPath = Module._findPath;

  Module._findPath = function(request, paths, isMain) {
    if (!enableNativeHooks) {
      return originalFindPath.call(Module, request, paths, isMain);
    }

    for (const path of paths || []) {
      let resolution;

      try {
        resolution = exports.resolveRequest(request, path);
      } catch (error) {
        continue;
      }

      if (resolution) {
        return resolution;
      }
    }

    return false;
  };

  process.versions.pnp = String(exports.VERSIONS.std);
};

exports.setupCompatibilityLayer = () => {
  // ESLint currently doesn't have any portable way for shared configs to specify their own
  // plugins that should be used (https://github.com/eslint/eslint/issues/10125). This will
  // likely get fixed at some point, but it'll take time and in the meantime we'll just add
  // additional fallback entries for common shared configs.

  for (const name of [`react-scripts`]) {
    const packageInformationStore = packageInformationStores.get(name);
    if (packageInformationStore) {
      for (const reference of packageInformationStore.keys()) {
        fallbackLocators.push({name, reference});
      }
    }
  }

  // Modern versions of `resolve` support a specific entry point that custom resolvers can use
  // to inject a specific resolution logic without having to patch the whole package.
  //
  // Cf: https://github.com/browserify/resolve/pull/174

  patchedModules.push([
    /^\.\/normalize-options\.js$/,
    (issuer, normalizeOptions) => {
      if (!issuer || issuer.name !== 'resolve') {
        return normalizeOptions;
      }

      return (request, opts) => {
        opts = opts || {};

        if (opts.forceNodeResolution) {
          return opts;
        }

        opts.preserveSymlinks = true;
        opts.paths = function(request, basedir, getNodeModulesDir, opts) {
          // Extract the name of the package being requested (1=full name, 2=scope name, 3=local name)
          const parts = request.match(/^((?:(@[^\/]+)\/)?([^\/]+))/);

          // make sure that basedir ends with a slash
          if (basedir.charAt(basedir.length - 1) !== '/') {
            basedir = path.join(basedir, '/');
          }
          // This is guaranteed to return the path to the "package.json" file from the given package
          const manifestPath = exports.resolveToUnqualified(`${parts[1]}/package.json`, basedir);

          // The first dirname strips the package.json, the second strips the local named folder
          let nodeModules = path.dirname(path.dirname(manifestPath));

          // Strips the scope named folder if needed
          if (parts[2]) {
            nodeModules = path.dirname(nodeModules);
          }

          return [nodeModules];
        };

        return opts;
      };
    },
  ]);
};

if (module.parent && module.parent.id === 'internal/preload') {
  exports.setupCompatibilityLayer();

  exports.setup();
}

if (process.mainModule === module) {
  exports.setupCompatibilityLayer();

  const reportError = (code, message, data) => {
    process.stdout.write(`${JSON.stringify([{code, message, data}, null])}\n`);
  };

  const reportSuccess = resolution => {
    process.stdout.write(`${JSON.stringify([null, resolution])}\n`);
  };

  const processResolution = (request, issuer) => {
    try {
      reportSuccess(exports.resolveRequest(request, issuer));
    } catch (error) {
      reportError(error.code, error.message, error.data);
    }
  };

  const processRequest = data => {
    try {
      const [request, issuer] = JSON.parse(data);
      processResolution(request, issuer);
    } catch (error) {
      reportError(`INVALID_JSON`, error.message, error.data);
    }
  };

  if (process.argv.length > 2) {
    if (process.argv.length !== 4) {
      process.stderr.write(`Usage: ${process.argv[0]} ${process.argv[1]} <request> <issuer>\n`);
      process.exitCode = 64; /* EX_USAGE */
    } else {
      processResolution(process.argv[2], process.argv[3]);
    }
  } else {
    let buffer = '';
    const decoder = new StringDecoder.StringDecoder();

    process.stdin.on('data', chunk => {
      buffer += decoder.write(chunk);

      do {
        const index = buffer.indexOf('\n');
        if (index === -1) {
          break;
        }

        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);

        processRequest(line);
      } while (true);
    });
  }
}
