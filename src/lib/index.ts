import * as child_process from "child_process";
import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

/** 
 * After this function is called every call to execSync 
 * or exec will print the unix commands being executed. 
 * */
export function enableCmdTrace(): void {
    traceCmdIfEnabled.enabled= true;
}

function traceCmdIfEnabled(cmd: string, options: any){

    if( !traceCmdIfEnabled.enabled ){
        return;
    }

    console.log(
        colorize(`$ ${cmd} `, "YELLOW") + (!!options?`${JSON.stringify(options)}\n`:"")
    );

}

namespace traceCmdIfEnabled {
    export let enabled = false;
}

function fetch_id(options: any) {

    if( !options ){ 
        return;
    }

    if (!!options.unix_user) {

        const unix_user = options.unix_user;

        delete options.unix_user;

        const get_id = (type: "u" | "g") =>
            parseInt(
                child_process.execSync(`id -${type} ${unix_user}`)
                    .toString("utf8")
                    .slice(0, -1)
            );

        options.uid = get_id("u");
        options.gid = get_id("g");

    }

}

export function colorize(str: string, color: "GREEN" | "RED" | "YELLOW"): string {

    let color_code = (() => {

        switch (color) {
            case "GREEN": return "\x1b[32m";
            case "RED": return "\x1b[31m";
            case "YELLOW": return "\x1b[33m";
        }

    })();

    return `${color_code}${str}\x1b[0m`;

}

/**
 * 
 * The stderr is forwarded to the console realtime.
 * 
 * The returned value is the concatenated data received on stdout.
 * 
 * If the return code of the cmd is not 0 an exception is thrown
 * and the message cmd + the concatenated data received on stderr.
 * 
 * If enableTrace() have been called the command called will be printed.
 * 
 */
export function execSync(
    cmd: string,
    options?: child_process.ExecSyncOptions & { unix_user?: string },
): string {

    traceCmdIfEnabled(cmd, options);

    fetch_id(options);

    return child_process.execSync(cmd, { ...(options as any || {}), "encoding": "utf8" });

}

/** 
 * 
 * The cmd is printed before execution
 * stdout and stderr are forwarded to the console realtime.
 * Return nothing.
 * 
 * stdio is set to "inherit" and thus should not be redefined.
 * 
 */
export function execSyncTrace(
    cmd: string, 
    options?: child_process.ExecSyncOptions & { unix_user?: string },
): void {

    traceCmdIfEnabled(cmd, options);

    fetch_id(options);

    child_process.execSync(cmd, { ...(options as any || {}), "stdio": "inherit" });

}

/** Same as execSync except that it dose not print cmd even if cmdTrace have been enabled */
export const execSyncNoCmdTrace: typeof execSync = (...args)=> {

    const enabled_back = traceCmdIfEnabled.enabled;

    traceCmdIfEnabled.enabled = false;

    try{

        const out= execSync.apply(null, args);

        traceCmdIfEnabled.enabled = enabled_back;

        return out;

    }catch(error){

        traceCmdIfEnabled.enabled = enabled_back;

        throw error;

    }
    

};

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
export function execSyncQuiet(
    cmd: string,
    options?: child_process.ExecSyncOptions & { unix_user?: string },
): string{

    return execSync(cmd, { ...(options as any || {}), "stdio": "pipe" });

}


/** Same as execSync but async */
export function exec(
    cmd: string,
    options?: child_process.ExecOptions & { unix_user?: string }
): Promise<string> {

    traceCmdIfEnabled(cmd, options);

    return new Promise(
        async (resolve, reject) => {

            fetch_id(options);

            child_process.exec(
                cmd,
                { ...(options as any || {}), "encoding": "utf8" },
                (error, stdout, stderr) => {

                    if (!!error) {

                        error["stderr"] = stderr;

                        reject(error);

                    } else {

                        resolve(stdout as any);

                    }


                });

        }
    );

}

/** 
 * 
 * Print a message and enable a moving loading bar.
 * WARNING: Nothing should be printed to stdout until we stop showing the moving loading.
 * 
 * returns: 
 * -exec: A proxy to the exec fnc that will call onError before it throw the error.
 * -onSuccess: Stop showing the moving loading and pretty print a success message ("ok" by default)
 * -onError: Stop showing the moving loading and pretty print error message.
 * 
 */
export function start_long_running_process(message: string): {
    exec: typeof exec;
    onSuccess(message?: string): void;
    onError(errorMessage: string): void;
} {

    process.stdout.write(`${message}... `);

    const moveBack = (() => {

        let cp = message.length + 3;

        return () => readline.cursorTo(process.stdout, cp);

    })();

    let p = ["\\", "|", "/", "-"].map(i => colorize(i, "GREEN"));

    let x = 0;

    let timer = setInterval(() => {

        moveBack();

        process.stdout.write(p[x++]);

        x = x % p.length;

    }, 250);

    let onComplete = (message: string) => {

        clearInterval(timer);

        moveBack();

        process.stdout.write(`${message}\n`);

    };

    const onError = errorMessage => onComplete(colorize(errorMessage, "RED"));
    const onSuccess = message => onComplete(colorize(message || "ok", "GREEN"));

    if (traceCmdIfEnabled.enabled) {

        onComplete("");

        onComplete = message => console.log(message);

    }

    return {
        onError,
        onSuccess,
        "exec": async function (...args) {

            try {

                return await exec.apply(null, args);

            } catch (error) {

                onError(error.message);

                throw error;

            }

        }
    };

};

/** 
 * Apt package if not already installed, 
 * if prog is provided and prog is in the PATH the package will not be installed
 * */
export async function apt_get_install_if_missing(
    package_name: string,
    prog?: string
) {

    process.stdout.write(`Looking for ${package_name} ... `);


    if (!!prog && apt_get_install_if_missing.doesHaveProg(prog)) {

        console.log(`${prog} executable found. ${colorize("OK", "GREEN")}`);

        return;

    }

    if (apt_get_install_if_missing.isPkgInstalled(package_name)) {

        console.log(`${package_name} is installed. ${colorize("OK", "GREEN")}`);

        return;

    }

    readline.clearLine(process.stdout, 0);
    process.stdout.write("\r");

    return await apt_get_install(package_name);


}

export namespace apt_get_install_if_missing {

    export function isPkgInstalled(package_name: string): boolean {

        try {

            console.assert(
                !!execSyncNoCmdTrace(`dpkg-query -W -f='\${Status}' ${package_name}`, { "stdio": "pipe" })
                    .match(/^install ok installed$/)
            );

        } catch{

            return false;

        }

        return true;

    }

    export function doesHaveProg(prog: string): boolean {

        try {

            execSyncNoCmdTrace(`which ${prog}`);

        } catch{

            return false;

        }

        return true;

    }

}

/** Install or upgrade package via APT */
export async function apt_get_install(package_name: string) {

    const { onSuccess, exec } = start_long_running_process(`Installing or upgrading ${package_name} package`);

    try {

        if (apt_get_install.isFirst) {

            await exec("apt-get update");

            apt_get_install.isFirst = false;

        }

        const was_installed_before = apt_get_install_if_missing.isPkgInstalled(package_name);

        await exec(`apt-get -y install ${package_name}`);

        if (!was_installed_before) {

            apt_get_install.onInstallSuccess(package_name);

        }

    } catch (error) {

        apt_get_install.onError(error);

    }

    onSuccess("DONE");

}

export namespace apt_get_install {

    export let isFirst = true;

    export function record_installed_package(
        file_json_path: string,
        package_name: string
    ): void {

        execSyncNoCmdTrace(`touch ${file_json_path}`);

        const raw = fs.readFileSync(file_json_path).toString("utf8");

        const list: string[] = raw === "" ? [] : JSON.parse(raw);

        if (!list.find(p => p === package_name)) {

            list.push(package_name);

            fs.writeFileSync(
                file_json_path,
                Buffer.from(JSON.stringify(list, null, 2), "utf8")
            );

        }

    }

    export let onError = (error: Error) => { throw error };

    export let onInstallSuccess = (package_name: string): void => { };

}

export function exit_if_not_root(): void {
    if (process.getuid() !== 0) {

        console.log(colorize("Error: This script require root privilege", "RED"));

        process.exit(1);

    }
}

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
export function find_module_path(
    module_name: string,
    module_dir_path: string
): string {

    const cmd = [
        `find ${path.join(module_dir_path, "node_modules")}`,
        `-type f`,
        `-path \\*/node_modules/${module_name}/package.json`,
        `-exec dirname {} \\;`
    ].join(" ");

    const match = execSyncNoCmdTrace(cmd, { "stdio": "pipe" }).slice(0, -1).split("\n");

    if (!match.length) {
        throw new Error(`${module_name} not found in ${module_dir_path}`);
    } else {
        return match.sort((a, b) => a.length - b.length)[0];
    }

}

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
export function fs_areSame(
    relative_from_path1: string,
    relative_from_path2: string,
    relative_to_path: string = "."
): boolean {

    if (path.isAbsolute(relative_to_path)) {

        for (const relative_from_path of [relative_from_path1, relative_from_path2]) {

            if (relative_to_path.startsWith(relative_from_path)) {
                relative_to_path = path.relative(relative_from_path, relative_to_path);
            }

        }

        throw new Error();

    }

    try {

        execSyncNoCmdTrace([
            "diff -r",
            path.join(relative_from_path1, relative_to_path),
            path.join(relative_from_path2, relative_to_path)
        ].join(" "),
            { "stdio": "pipe" }
        );

    } catch{

        return false;

    }

    return true;

}

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
export function fs_move(
    action: "COPY" | "MOVE",
    relative_from_path_src: string,
    relative_from_path_dest: string,
    relative_to_path: string = "."
) {

    if (path.isAbsolute(relative_to_path)) {

        for (const relative_from_path of [relative_from_path_src, relative_from_path_dest]) {

            if (relative_to_path.startsWith(relative_from_path)) {
                relative_to_path = path.relative(relative_from_path, relative_to_path);
            }

        }

        throw new Error();

    }

    const src_path = path.join(relative_from_path_src, relative_to_path);
    const dst_path = path.join(relative_from_path_dest, relative_to_path);

    if (!fs_areSame(src_path, dst_path)) {

        if (!fs.existsSync(dst_path)) {
            execSyncNoCmdTrace(`mkdir -p ${dst_path}`);
        }

        execSyncNoCmdTrace(`rm -rf ${dst_path}`);

        execSyncNoCmdTrace([
            action === "COPY" ? "cp -rp" : "mv",
            src_path,
            dst_path
        ].join(" "));

    } else {

        if (action === "MOVE") {
            execSyncNoCmdTrace(`rm -r ${src_path}`);
        }

    }



}

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
export function download_and_extract_tarball(
    url: string,
    dest_dir_path: string,
    mode: "MERGE" | "OVERWRITE IF EXIST"
) {

    const tarball_dir_path = `/tmp/_${Date.now()}`
    const tarball_path = `${tarball_dir_path}.tar.gz`;

    if (traceCmdIfEnabled.enabled) {
        process.stdout.write(`Downloading ${url}...`);
    }

    execSyncNoCmdTrace(`wget ${url} -q -O ${tarball_path}`)

    if (traceCmdIfEnabled.enabled) {
        process.stdout.write(`Extracting to ${dest_dir_path}...`);
    }

    execSyncNoCmdTrace(`mkdir -p ${tarball_dir_path}`);

    execSyncNoCmdTrace(`tar -xzf ${tarball_path} -C ${tarball_dir_path}`);

    if (traceCmdIfEnabled.enabled) {
        console.log(colorize("DONE", "GREEN"))
    }

    execSyncNoCmdTrace(`rm ${tarball_path}`);

    if (mode === "MERGE") {

        for (const name of fs_ls(tarball_dir_path)) {

            fs_move("MOVE", tarball_dir_path, dest_dir_path, name);

        }

        execSyncNoCmdTrace(`rm -r ${tarball_dir_path}`);

    } else {

        fs_move("MOVE", tarball_dir_path, dest_dir_path);

    }

}

export function fs_ls(
    dir_path: string,
    mode: "FILENAME" | "ABSOLUTE PATH" = "FILENAME",
    showHidden = false
): string[] {

    return execSyncNoCmdTrace(`ls${showHidden ? " -a" : ""}`, { "cwd": dir_path })
        .slice(0, -1)
        .split("\n")
        .map(name => mode === "ABSOLUTE PATH" ? path.join(dir_path, name) : name);

}

/**
 * 
 * Create a symbolic link.
 * If dst exist it is removed.
 * directories leading to dest are created if necessary.
 * 
 */
export function createSymlink(
    src_path: string,
    dst_path: string
) {

    if (!fs.existsSync(dst_path)) {
        execSyncNoCmdTrace(`mkdir -p ${dst_path}`);
    }

    execSyncNoCmdTrace(`rm -rf ${dst_path}`);

    execSync(`ln -s ${src_path} ${dst_path}`);

}

/** Create a executable file */
export function createScript(
    file_path: string, content: string
) {

    if (traceCmdIfEnabled.enabled) {
        console.log(`Creating script ${file_path}`);
    }

    fs.writeFileSync(file_path, Buffer.from(content, "utf8"));

    execSyncNoCmdTrace(`chmod +x ${file_path}`);

}

/**
 * 
 * Equivalent to the pattern $() in bash.
 * Strip final LF if present.
 * If cmd fail no error is thrown, an empty string is returned.
 * Does not print to stdout.
 * 
 * Typical usage: uname -r or which pkill
 * 
 */
export function sh_eval(cmd: string): string{
    
    let res: string;

    try{

        res = execSyncNoCmdTrace(cmd, { "stdio": "pipe" })

    }catch{

        return "";

    }
    
    return res.replace(/\n$/, "");

}

/**
 * Run a command and return true if the return code was 0.
 * Does not print to stdout.
 */
export function sh_if(cmd: string): boolean {

    try {

        execSyncNoCmdTrace(cmd, { "stdio": "pipe" });

    } catch{

        return false;

    }

    return true;

}




