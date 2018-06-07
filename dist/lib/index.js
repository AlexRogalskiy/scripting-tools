"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var child_process = require("child_process");
var readline = require("readline");
var fs = require("fs");
var path = require("path");
var trace = false;
/**
 * After this function is called every call to execSync
 * or exec will print the unix commands being executed.
 * */
function enableTrace() {
    trace = true;
}
exports.enableTrace = enableTrace;
function traceExec(cmd, options) {
    console.log(colorize("$ " + cmd + " ", "YELLOW") + (!!options ? JSON.stringify(options) + "\n" : ""));
}
function fetch_id(options) {
    if (!options) {
        return;
    }
    if (!!options.unix_user) {
        var unix_user_1 = options.unix_user;
        delete options.unix_user;
        var get_id = function (type) {
            return parseInt(child_process.execSync("id -" + type + " " + unix_user_1)
                .toString("utf8")
                .slice(0, -1));
        };
        options.uid = get_id("u");
        options.gid = get_id("g");
    }
}
function colorize(str, color) {
    var color_code = (function () {
        switch (color) {
            case "GREEN": return "\x1b[32m";
            case "RED": return "\x1b[31m";
            case "YELLOW": return "\x1b[33m";
        }
    })();
    return "" + color_code + str + "\u001B[0m";
}
exports.colorize = colorize;
/**
 *
 * The stderr is forwarded to the console realtime.
 *
 * The returned value is the concatenated data received on stdout.
 *
 * If the return code of the cmd is not 0 an exception is thrown
 * and the message cmd + the concatenated data received on stderr.
 *
 */
function execSync(cmd, options) {
    if (trace) {
        traceExec(cmd, options);
    }
    fetch_id(options);
    return child_process.execSync(cmd, __assign({}, (options || {}), { "encoding": "utf8" }));
}
exports.execSync = execSync;
/**
 * The cmd is printed before execution
 * stdout and stderr are forwarded to the console realtime.
 * Return nothing.
 *
 * stdio is set to "inherit" and thus should not be redefined.
 *
 */
function execSyncTrace(cmd, options) {
    traceExec(cmd, options);
    fetch_id(options);
    child_process.execSync(cmd, __assign({}, (options || {}), { "stdio": "inherit" }));
}
exports.execSyncTrace = execSyncTrace;
/**
 *
 * Like execSync but stderr is not forwarded.
 * WARNING: If mean that when the cmd return 0
 * all data that may have been wrote on stderr
 * are lost into oblivion.
 *
 * stdio is set to "pipe" and thus should not be redefined.
 *
 */
function execSyncQuiet(cmd, options) {
    return execSync(cmd, __assign({}, (options || {}), { "stdio": "pipe" }));
}
exports.execSyncQuiet = execSyncQuiet;
/** Same as execSync but async */
function exec(cmd, options) {
    var _this = this;
    if (trace) {
        traceExec(cmd, options);
    }
    return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            fetch_id(options);
            child_process.exec(cmd, __assign({}, (options || {}), { "encoding": "utf8" }), function (error, stdout, stderr) {
                if (!!error) {
                    error["stderr"] = stderr;
                    reject(error);
                }
                else {
                    resolve(stdout);
                }
            });
            return [2 /*return*/];
        });
    }); });
}
exports.exec = exec;
function start_long_running_process(message) {
    process.stdout.write(message + "... ");
    var moveBack = (function () {
        var cp = message.length + 3;
        return function () { return readline.cursorTo(process.stdout, cp); };
    })();
    var p = ["\\", "|", "/", "-"].map(function (i) { return colorize(i, "GREEN"); });
    var x = 0;
    var timer = setInterval(function () {
        moveBack();
        process.stdout.write(p[x++]);
        x = x % p.length;
    }, 250);
    var onComplete = function (message) {
        clearInterval(timer);
        moveBack();
        process.stdout.write(message + "\n");
    };
    var onError = function (errorMessage) { return onComplete(colorize(errorMessage, "RED")); };
    var onSuccess = function (message) { return onComplete(colorize(message || "ok", "GREEN")); };
    return {
        onError: onError,
        onSuccess: onSuccess,
        "exec": function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(this, void 0, void 0, function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, exec.apply(null, args)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            error_1 = _a.sent();
                            onError(error_1.message);
                            throw error_1;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
    };
}
exports.start_long_running_process = start_long_running_process;
;
function apt_get_install_if_missing(package_name, prog) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.stdout.write("Looking for " + package_name + " ... ");
                    if (!!prog && apt_get_install_if_missing.doesHaveProg(prog)) {
                        console.log(prog + " executable found. " + colorize("OK", "GREEN"));
                        return [2 /*return*/];
                    }
                    if (apt_get_install_if_missing.isPkgInstalled(package_name)) {
                        console.log(package_name + " is installed. " + colorize("OK", "GREEN"));
                        return [2 /*return*/];
                    }
                    readline.clearLine(process.stdout, 0);
                    process.stdout.write("\r");
                    return [4 /*yield*/, apt_get_install(package_name)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.apt_get_install_if_missing = apt_get_install_if_missing;
(function (apt_get_install_if_missing) {
    function isPkgInstalled(package_name) {
        try {
            console.assert(!!child_process.execSync("dpkg-query -W -f='${Status}' " + package_name + " 2>/dev/null")
                .toString("utf8")
                .match(/^install ok installed$/));
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install_if_missing.isPkgInstalled = isPkgInstalled;
    function doesHaveProg(prog) {
        try {
            child_process.execSync("which " + prog);
        }
        catch (_a) {
            return false;
        }
        return true;
    }
    apt_get_install_if_missing.doesHaveProg = doesHaveProg;
})(apt_get_install_if_missing = exports.apt_get_install_if_missing || (exports.apt_get_install_if_missing = {}));
function apt_get_install(package_name) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, onSuccess, exec, was_installed_before, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = start_long_running_process("Installing or upgrading " + package_name + " package"), onSuccess = _a.onSuccess, exec = _a.exec;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    if (!apt_get_install.isFirst) return [3 /*break*/, 3];
                    return [4 /*yield*/, exec("apt-get update")];
                case 2:
                    _b.sent();
                    apt_get_install.isFirst = false;
                    _b.label = 3;
                case 3:
                    was_installed_before = apt_get_install_if_missing.isPkgInstalled(package_name);
                    return [4 /*yield*/, exec("apt-get -y install " + package_name)];
                case 4:
                    _b.sent();
                    if (!was_installed_before) {
                        apt_get_install.onInstallSuccess(package_name);
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _b.sent();
                    apt_get_install.onError(error_2);
                    return [3 /*break*/, 6];
                case 6:
                    onSuccess("DONE");
                    return [2 /*return*/];
            }
        });
    });
}
exports.apt_get_install = apt_get_install;
(function (apt_get_install) {
    apt_get_install.isFirst = true;
    function record_installed_package(file_json_path, package_name) {
        execSync("touch " + file_json_path);
        var raw = fs.readFileSync(file_json_path).toString("utf8");
        var list = raw === "" ? [] : JSON.parse(raw);
        if (!list.find(function (p) { return p === package_name; })) {
            list.push(package_name);
            fs.writeFileSync(file_json_path, Buffer.from(JSON.stringify(list, null, 2), "utf8"));
        }
    }
    apt_get_install.record_installed_package = record_installed_package;
    apt_get_install.onError = function (error) { throw error; };
    apt_get_install.onInstallSuccess = function (package_name) { };
})(apt_get_install = exports.apt_get_install || (exports.apt_get_install = {}));
function exit_if_not_root() {
    if (process.getuid() !== 0) {
        console.log("Error: This script require root privilege");
        process.exit(1);
    }
}
exports.exit_if_not_root = exit_if_not_root;
/**
 *
 * Locate a given module in a node_modules directory.
 * If the module is required in different version and thus
 * present multiple times will be returned the shorter path.
 * This ensure that if a given module is in package.json 's dependencies
 * section the returned path will be the one we looking for.
 *
 * @param module_name The name of the module.
 * @param module_dir_path Path to the root of the module ( will search in ./node_modules ).
 */
function find_module_path(module_name, module_dir_path) {
    var cmd = [
        "find " + path.join(module_dir_path, "node_modules"),
        "-type f",
        "-path \\*/node_modules/" + module_name + "/package.json",
        "-exec dirname {} \\;"
    ].join(" ");
    var match = execSyncQuiet(cmd).slice(0, -1).split("\n");
    if (!match.length) {
        throw new Error(module_name + " not found in " + module_dir_path);
    }
    else {
        return match.sort(function (a, b) { return a.length - b.length; })[0];
    }
}
exports.find_module_path = find_module_path;
/**
 *
 * Test if two file of folder are same.
 * Does not consider stat ( ownership and permission ).
 * transparent handling of symlinks.
 *
 * Example
 *
 * /foo1/bar/file.txt
 * /foo2/bar/file.txt
 *
 * to compare the two version of file.txt
 * call with "/foo1", "/foo2", "./bar/file.txt";
 * or with "/foo1/bar/file.txt", "/foo2/bar/file.txt"
 *
 * @param relative_from_path1 absolute path ex: '/foo1'
 * @param relative_from_path2 absolute path ex: '/foo2'
 * @param relative_to_path relative path ex: './bar/file.txt" or 'bar/file.txt'
 * for convenience relative_to_path can be absolute as long as it has relative_from_path1
 * or relative_from_path2 as parent.
 *
 */
function fs_areSame(relative_from_path1, relative_from_path2, relative_to_path) {
    if (relative_to_path === void 0) { relative_to_path = "."; }
    if (path.isAbsolute(relative_to_path)) {
        try {
            for (var _a = __values([relative_from_path1, relative_from_path2]), _b = _a.next(); !_b.done; _b = _a.next()) {
                var relative_from_path = _b.value;
                if (relative_to_path.startsWith(relative_from_path)) {
                    relative_to_path = path.relative(relative_from_path, relative_to_path);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_1) throw e_1.error; }
        }
        throw new Error();
    }
    try {
        execSyncQuiet([
            "diff -r",
            path.join(relative_from_path1, relative_to_path),
            path.join(relative_from_path2, relative_to_path)
        ].join(" "));
    }
    catch (_d) {
        return false;
    }
    return true;
    var e_1, _c;
}
exports.fs_areSame = fs_areSame;
/**
 *
 * Move or copy file of folder.
 * -If dest is identical to source nothing is copied nor moved.
 * -If dest exist and is different of source it will be deleted prior to proceeding with action.
 * -In move mode if dest identical to source source will be removed.
 * -When copy is effectively performed the stat are conserved.
 * -If dirname of dest does not exist in fs, it will be created.
 * -Unlike cp or mv "/src/file.txt" "/dest" will NOT place file.txt in dest but dest will become file.txt
 *
 * calling [action] "/src/foo" "/dst/foo" is equivalent
 * to calling [action] "/src" "/dst" "./foo" ( or "foo" )
 * or [action] "/src" "/dst" "src/foo"
 * or [action] "/src" "/dst" "dst/foo"
 *
 */
function fs_move(action, relative_from_path_src, relative_from_path_dest, relative_to_path) {
    if (relative_to_path === void 0) { relative_to_path = "."; }
    if (path.isAbsolute(relative_to_path)) {
        try {
            for (var _a = __values([relative_from_path_src, relative_from_path_dest]), _b = _a.next(); !_b.done; _b = _a.next()) {
                var relative_from_path = _b.value;
                if (relative_to_path.startsWith(relative_from_path)) {
                    relative_to_path = path.relative(relative_from_path, relative_to_path);
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_2) throw e_2.error; }
        }
        throw new Error();
    }
    var src_path = path.join(relative_from_path_src, relative_to_path);
    var dst_path = path.join(relative_from_path_dest, relative_to_path);
    if (!fs_areSame(src_path, dst_path)) {
        if (!fs.existsSync(dst_path)) {
            execSync("mkdir -p " + dst_path);
        }
        execSync("rm -rf " + dst_path);
        execSync([
            action === "COPY" ? "cp -rp" : "mv",
            src_path,
            dst_path
        ].join(" "));
    }
    if (action === "MOVE") {
        execSync("rm -rf " + src_path);
    }
    var e_2, _c;
}
exports.fs_move = fs_move;
/**
 * Download and extract a tarball.
 *
 * Example
 *
 * website.com/rel.tar.gz
 * ./file1.txt
 * ./dir/file2.txt
 *
 * /foo/
 * ./file3.txt
 * ./dir/file4.txt
 *
 * calling with "website.com/rel.tar.gz", "MERGE" will result in:
 *
 * /foo/
 * ./file1.txt
 * ./file3.txt
 * ./dir/file4.txt
 *
 * calling with "website.com/rel.tar.gz", "OVERWRITE IF EXIST" will result in:
 *
 * /foo/
 * ./file1.txt
 * ./dir/file2.txt
 *
 */
function download_and_extract_tarball(url, dest_dir_path, mode, quiet) {
    if (quiet === void 0) { quiet = false; }
    var tarball_dir_path = "/tmp/_" + Date.now();
    var tarball_path = tarball_dir_path + ".tar.gz";
    if (!quiet) {
        process.stdout.write("Downloading " + url + "...");
    }
    execSync("wget " + url + " -q -O " + tarball_path);
    if (!quiet) {
        process.stdout.write("Extracting...");
    }
    execSync("mkdir -p " + tarball_dir_path);
    execSync("tar -xzf " + tarball_path + " -C " + tarball_dir_path);
    if (!quiet) {
        console.log(colorize("DONE", "GREEN"));
    }
    execSync("rm " + tarball_path);
    if (mode === "MERGE") {
        try {
            for (var _a = __values(fs_ls(tarball_dir_path)), _b = _a.next(); !_b.done; _b = _a.next()) {
                var name = _b.value;
                fs_move("MOVE", tarball_dir_path, dest_dir_path, name);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
            }
            finally { if (e_3) throw e_3.error; }
        }
        execSync("rm -r " + tarball_dir_path);
    }
    else {
        fs_move("MOVE", tarball_dir_path, dest_dir_path);
    }
    var e_3, _c;
}
exports.download_and_extract_tarball = download_and_extract_tarball;
function fs_ls(dir_path, mode, showHidden) {
    if (mode === void 0) { mode = "FILENAME"; }
    if (showHidden === void 0) { showHidden = false; }
    return execSync("ls" + (showHidden ? " -a" : ""), { "cwd": dir_path })
        .slice(0, -1)
        .split("\n")
        .map(function (name) { return mode === "ABSOLUTE PATH" ? path.join(dir_path, name) : name; });
}
exports.fs_ls = fs_ls;
/**
 *
 * Create a symbolic link.
 * If dst exist it is removed.
 * directories leading to dest are created if necessary.
 *
 */
function fs_ln_s(src_path, dst_path) {
    if (!fs.existsSync(dst_path)) {
        execSync("mkdir -p " + dst_path);
    }
    execSync("rm -rf " + dst_path);
    execSync("ln -s " + src_path + " " + dst_path);
}
exports.fs_ln_s = fs_ln_s;
/** Create a executable file */
function createScript(file_path, content) {
    fs.writeFileSync(file_path, Buffer.from(content, "utf8"));
    execSync("chmod +x " + file_path);
}
exports.createScript = createScript;
/**
 *
 * Equivalent to the pattern $() in bash.
 * Use only for constant as cmd result are cached.
 * Strip final LF if present
 *
 * Typical usage: uname -r or which pkill
 *
 *
 * @param cmd
 */
function shellEval(cmd) {
    var out = shellEval.cache.get(cmd);
    if (out !== undefined) {
        return out;
    }
    else {
        shellEval.cache.set(cmd, execSync(cmd).replace(/\n$/, ""));
        return shellEval(cmd);
    }
}
exports.shellEval = shellEval;
(function (shellEval) {
    shellEval.cache = new Map();
})(shellEval = exports.shellEval || (exports.shellEval = {}));
