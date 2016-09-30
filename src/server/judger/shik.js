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

const zbox = path.join(__dirname, 'zbox');
const jail = path.join(__dirname, 'jail');
const GPP = [
    'g++',
    '-std=c++14',
    '-static',
    '-O2',
];

async function copyToDir(src, dest) {
    await fs.copy(src, path.join(dest, path.basename(src)));
}

function zBoxWrap(opt) {
    return new Promise((resolve, reject) => {
        execFile(
            zbox,
            opt,
            (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve({
                    stdout,
                    stderr,
                    stat: YAML.parse(stdout),
                });
            }
        );
    });
}

export class CppExec {
    constructor(cppSource) {
        this.cpp = cppSource;
        this.cppBase = path.basename(cppSource);
        this.name = this.cppBase.split('.')[0];
        this.ended = false;
        this.status = null;
        this.exec = null;
    }

    async init() {
        this.rootDir = await promisify(temp.mkdir)({dir: jail});
        this.status = 'initialized';
    }

    async prepareFiles(files) {
        await Promise.all(files.map(f => copyToDir(f, this.rootDir)));
    }

    async compile(opt={}) {
        if (this.status !== 'initialized') {
            await this.init();
        }

        _.defaults(opt, {
            cpu: 20,
            wall: 30,
            mem: 1<<30,
            chdir: this.rootDir, 
            stdout: 'compile.out',
            stderr: 'compile.err',
        });

        await copyToDir(this.cpp, this.rootDir);
        this.exec = path.join(this.rootDir, this.name);
        
        const _opt = [
            ..._.flatMap(_.map(opt, (val, key) => ['--'+key, val])),
            ...[...GPP, '-o', this.name, this.cppBase]
        ];

        const result = await zBoxWrap(_opt);

        if (result.stat.RE) this.status = 'compile error';
        else this.status = 'compiled';

        this.execBase = this.name;
        return result;
    }

    async run(inFile, timeLimit=1.0, memLimit=(1<<30), args=[]) {
        if (this.status !== 'compiled') {
            throw InvalidOperationError('source not compiled');
        }
        const timeLimitCeil = Math.ceil(timeLimit);

        let result;
        const opt = {
            cpu: timeLimitCeil,
            wall: timeLimitCeil*2,
            mem: memLimit,
            chroot: this.rootDir, 
            stdout: 'std.out',
            stderr: 'std.err',
        };
        if (inFile) {
            await copyToDir(inFile, this.rootDir);
            opt.stdin = path.basename(inFile);
        }

        const _opt = [
            ..._.flatten(_.map(opt, (val, key) => ['--'+key, val])),
            `./${this.execBase}`,
            ...args,
        ];

        result = await zBoxWrap(_opt);
        if (!result.RE && !result.TLE && result.cpu_time_usage >= timeLimit + 0.001) {
            this.TLE = true;
        }

        return _.assignIn(result, {
            outFile: path.join(this.rootDir, 'std.out'),
            errFile: path.join(this.rootDir, 'std.err'),
        });
    }
    async clean() {
        await fs.remove(this.rootDir);
    }
}
