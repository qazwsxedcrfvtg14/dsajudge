import config from '/config';
import {execFile} from 'child_process';
import path from 'path';
import _ from 'lodash';
import fs from 'fs-extra';
import YAML from 'yamljs';
import {diffWords} from 'diff';
import temp from 'temp';
import {promisify} from 'bluebird';
import {InvalidOperationError} from 'common-errors';

const ISOLATE = path.join(__dirname, 'isolate');

function isolateWrap(opt) {
    return new Promise((resolve, reject) => {
        execFile(
            ISOLATE,
            opt,
            {},
            (err, stdout, stderr) => {
                //if (err) return reject(err);
                resolve(
                    _.assignIn({
                        stdout,
                        stderr,
                    })
                );
            }
        );
    });
}

function isolateWrapNoReturn(opt) {
    return new Promise((resolve, reject) => {
        execFile(
            ISOLATE,
            opt,
            {},
            (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve();
            }
        );
    });
}

function flat_opt(opt){
    return _.flatten(_.map(opt, (val, key) =>  val===true ? ['--'+key] : ['--'+key,val]  ));
}

async function init(id) {
    const opt = {
        cg:true,
        "box-id": id,
        init:true
    };
    const _opt = [...flat_opt(opt)];
    await isolateWrapNoReturn(_opt);
}
async function cleanup(id) {
    const opt = {
        cg:true,
        "box-id": id,
        cleanup:true
    };
    const _opt = [...flat_opt(opt)];
    await isolateWrapNoReturn(_opt);
}
export async function reset(id) {
    await cleanup(id);
    await init(id);
}

const metaDir = path.join(config.dirs.isolate,'META');

export async function compile(worker_id, cppFile, execName, GPP) {
    const opt = {
        cg:true,
        "box-id": worker_id,
        meta: path.join(metaDir,worker_id.toString()),
        mem: 1<<20,
        "cg-mem": 1<<20,
        time: 20,
        "wall-time": 30,
        fsize: 1<<20,
        "full-env":true,
        process:true,
        silent:true,
        stdout: 'compile.out',
        stderr: 'compile.err',
        run:true
    };

    const _opt = [
        ...flat_opt(opt),
        "--",
        ...[...GPP, '-o', execName, cppFile]
    ];

    let result = await isolateWrap(_opt);
    let fl=await fs.readFile(path.join(metaDir,worker_id.toString()));
    result=_.assignIn(result,YAML.parse("---\n"+fl.toString().replace(/:/g,": ")+"...\n"));
    if(result.status=="RE")
        result.RE=true;
    if(result.status=="SG")
        result.RE=true;
    if(result.status=="TO")
        result.TLE=true;
    if(result.status=="XX")
        result.RE=true;
    return result;
}

export async function run(worker_id, exec, inFile, outFile, errFile, timeLimit, memLimit=(1<<20), args=[]) {
    //const timeLimitCeil = Math.ceil(timeLimit);
    const timeLimitCeil = timeLimit;

    const opt = {
        cg:true,
        "box-id": worker_id,
        meta: path.join(metaDir,worker_id.toString()),
        mem: 1<<20,
        time: timeLimitCeil,
        "wall-time": timeLimitCeil*2,
        fsize: 1<<20,
        silent:true,
        stdout: 'run.out',
        stderr: 'run.err',
        run:true
    };
    if (inFile) opt.stdin = inFile;
    if (outFile) opt.stdout = outFile;
    if (errFile) opt.stderr = errFile;

    const _opt = [
        ...flat_opt(opt),
        "--",
        `./${exec}`,
        ...args,
    ];

    let result = await isolateWrap(_opt);
    let fl=await fs.readFile(path.join(metaDir,worker_id.toString()));
    result=_.assignIn(result,YAML.parse("---\n"+fl.toString().replace(/:/g,": ")+"...\n"));
    if(result.status=="RE")
        result.RE=true;
    if(result.status=="SG")
        result.RE=true;
    if(result.status=="TO")
        result.TLE=true;
    if(result.status=="XX")
        result.RE=true;
    if (!result.RE && !result.TLE && result.time >= timeLimit + 0.001) {
        result.TLE = true;
    }

    return result;
}
