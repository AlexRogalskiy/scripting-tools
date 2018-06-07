/// <reference types="node" />
import * as child_process from "child_process";
/**
 * After this function is called every call to execSync
 * or exec will print the unix commands being executed.
 * */
export declare function enableTrace(): void;
export declare function colorize(str: string, color: "GREEN" | "RED" | "YELLOW"): string;
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
export declare function execSync(cmd: string, options?: child_process.ExecSyncOptions & {
    unix_user?: string;
}): string;
/**
 * The cmd is printed before execution
 * stdout and stderr are forwarded to the console realtime.
 * Return nothing.
 *
 * stdio is set to "inherit" and thus should not be redefined.
 *
 */
export declare function execSyncTrace(cmd: string, options?: child_process.ExecSyncOptions & {
    unix_user?: string;
}): void;
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
export declare function execSyncQuiet(cmd: string, options?: child_process.ExecSyncOptions & {
    unix_user?: string;
}): string;
/** Same as execSync but async */
export declare function exec(cmd: string, options?: child_process.ExecOptions & {
    unix_user?: string;
}): Promise<string>;
export declare function start_long_running_process(message: string): {
    onError(errorMessage: string): void;
    onSuccess(message?: string): void;
    exec: typeof exec;
};
export declare function apt_get_install_if_missing(package_name: string, prog?: string): Promise<void>;
export declare namespace apt_get_install_if_missing {
    function isPkgInstalled(package_name: string): boolean;
    function doesHaveProg(prog: string): boolean;
}
export declare function apt_get_install(package_name: string): Promise<void>;
export declare namespace apt_get_install {
    let isFirst: boolean;
    function record_installed_package(file_json_path: string, package_name: string): void;
    let onError: (error: Error) => never;
    let onInstallSuccess: (package_name: string) => void;
}
export declare function exit_if_not_root(): void;
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
export declare function find_module_path(module_name: string, module_dir_path: string): string;
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
export declare function fs_areSame(relative_from_path1: string, relative_from_path2: string, relative_to_path?: string): boolean;
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
export declare function fs_move(action: "COPY" | "MOVE", relative_from_path_src: string, relative_from_path_dest: string, relative_to_path?: string): void;
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
export declare function download_and_extract_tarball(url: string, dest_dir_path: string, mode: "MERGE" | "OVERWRITE IF EXIST", quiet?: "QUIET" | false): void;
export declare function fs_ls(dir_path: string, mode?: "FILENAME" | "ABSOLUTE PATH", showHidden?: boolean): string[];
/**
 *
 * Create a symbolic link.
 * If dst exist it is removed.
 * directories leading to dest are created if necessary.
 *
 */
export declare function fs_ln_s(src_path: string, dst_path: string): void;
/** Create a executable file */
export declare function createScript(file_path: string, content: string): void;
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
export declare function shellEval(cmd: string): string;
export declare namespace shellEval {
    const cache: Map<string, string>;
}
