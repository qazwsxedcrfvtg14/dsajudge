import config from '/config';
import {execFile} from 'child_process';
import path from 'path';
import _ from 'lodash';
import fs from 'fs-promise';
import YAML from 'yamljs';
import {diffWords} from 'diff';
import temp from 'temp';
import {promisify} from 'bluebird';
import {InvalidOperationError} from 'common-errors';

const ZBOX = path.join(__dirname, 'zbox');
function zBoxWrap(opt) {
    return new Promise((resolve, reject) => {
        execFile(
            ZBOX,
            opt,
            (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve(
                    _.assignIn({
                        stdout,
                        stderr,
                    }, YAML.parse(stdout))
                );
            }
        );
    });
}

export async function compile(chdir, cppFile, execName, GPP) {
    const opt = {
        cpu: 20,
        wall: 30,
        mem: 1<<30,
        chdir,
        stdout: 'compile.out',
        stderr: 'compile.err',
        uid: 9876,
    };

    const _opt = [
        ..._.flatMap(_.map(opt, (val, key) => ['--'+key, val])),
        ...[...GPP, '-o', execName, cppFile]
    ];

    const result = await zBoxWrap(_opt);
    return result;
}

export async function run(rootDir, exec, inFile, outFile, errFile, timeLimit, memLimit=(1<<30), args=[]) {

    const timeLimitCeil = Math.ceil(timeLimit);

    let result;
    const opt = {
        cpu: timeLimitCeil,
        wall: timeLimitCeil*2,
        mem: memLimit,
        chroot: rootDir, 
        stdout: 'run.out',
        stderr: 'run.err',
        uid: 9876,
    };
    if (inFile) opt.stdin = inFile;
    if (outFile) opt.stdout = outFile;
    if (errFile) opt.stderr = errFile;

    const _opt = [
        ..._.flatten(_.map(opt, (val, key) => ['--'+key, val])),
        `./${exec}`,
        ...args,
    ];

    result = await zBoxWrap(_opt);
    if (!result.RE && !result.TLE && result.cpu_time_usage >= timeLimit + 0.001) {
        result.TLE = true;
    }

    return _.assignIn(result);
}
