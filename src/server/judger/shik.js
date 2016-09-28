import config from '/config';
import {execFile} from 'child_process';
import path from 'path';
import _ from 'lodash';
import fs from 'fs-promise';
import YAML from 'yamljs';
import {diffWords} from 'diff';

const zbox = path.join(__dirname, 'zbox');
const jail = path.join(__dirname, 'jail');
const GPP = [
    'g++',
    '-std=c++14',
    '-static',
    '-O2',
];

export async function compile(file) {
    const bn = path.basename(file);
    const fn = bn.split('.')[0];
    const dest = path.join(jail, bn);
    await fs.copy(file, dest);

    let result;
    const opt = {
        cpu: 30,
        wall: 60,
        mem: 1<<30,
        chdir: jail, 
    };
    const _opt = [
        ..._.flatMap(_.map(opt, (val, key) => ['--'+key, val])),
        ...[...GPP, '-o', fn, bn]
    ];

    try {
        result = await new Promise( (resolve, reject) => {
            execFile(
                zbox,
                _opt,
                (err, stdout, stderr) => {
                    if (err) return reject(err);
                    resolve({stdout, stderr});
                }
            );
        });
    } catch (e) {
        throw e;
    } finally {
        fs.unlink(dest);
    }

    const stat = YAML.parse(result.stdout);
    const errMsg = result.stderr;
    if (stat.RE) {
        return {
            result: 'CE',
            errMsg,
        };
    } else {
        return {
            result: 'OK',
            errMsg,
            exec: fn,
        };
    }
}

export async function run(exec, inFile, timeLimit=1.0) {
    const _in = path.basename(inFile);
    const _out = `${_in.split('.')[0]}.user.out`;
    await fs.copy(inFile, path.join(jail, _in));

    const timeLimitCeil = Math.ceil(timeLimit);

    let result;
    const opt = {
        cpu: timeLimitCeil,
        wall: timeLimitCeil*2,
        mem: 1<<30,
        chroot: jail, 
        stdin: _in,
        stdout: _out,
    };
    const _opt = [
        ..._.flatMap(_.map(opt, (val, key) => ['--'+key, val])),
        `./${exec}`,
    ];
    try {
        result = await new Promise( (resolve, reject) => {
            execFile(
                zbox,
                _opt,
                (err, stdout, stderr) => {
                    if (err) return reject(err);
                    resolve({stdout, stderr});
                }
            );
        });
    } catch(e) {
        throw e;
    } finally {
        fs.unlink(path.join(jail, _in));
    }

    const stat = YAML.parse(result.stdout);
    stat.outFile = path.join(jail, _out);
    return stat;
}

export async function judge(exec, inFile, ansFile, timeLimit) {
    let res = await run(exec, inFile, timeLimit);
    if (res.TLE || res.cpu_time_usage > timeLimit + 0.01) {
        return {
            result: 'TLE',
        };
    }
    if (res.RE) {
        return {
            result: 'RE',
        };
    }

    res = await compare(res.outFile, ansFile);
    return res;
}

export async function compare(outFile, ansFile) {
    const [out, ans] = (await Promise.all([fs.readFile(outFile), fs.readFile(ansFile)])).map(x => x.toString());
    const res = diffWords(ans, out);
    for (let x of res) {
        if (x.added || x.removed) {
            return {
                result: 'WA',
            };
        }
    }
    return {
        result: 'AC',
    };
}
