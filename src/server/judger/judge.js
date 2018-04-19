import fs from 'fs-extra';
import config from '/config';
import errors from 'common-errors';
import {TimeoutError, InvalidOperationError} from 'common-errors';
import {compile, run, reset} from './joe';
import Result from '/model/result';
import logger from '/logger';
import path from 'path';
import _ from 'lodash';
//import {promisify} from 'bluebird';
//import temp from 'temp';
import Worker from './pool';

const DEFAULT_CHECKER = path.join(config.dirs.cfiles, 'default_checker.cpp');
const TESTLIB = path.join(config.dirs.cfiles, 'testlib.h');
const CTMP = path.join('/tmp', 'judge-comp');

const resultMap = {
    'CE': 100000,
    'RE': 10000,
    'WA': 1000,
    'TLE': 100,
    'AC': 1,
};
const resultReducer = (pointReducer = (p1, p2) => Math.min(p1 || 0, p2 || 0)) => ((res, x) => {
    const resW = _.get(resultMap, res.result, 1e9),
        xW = _.get(resultMap, x.result, 1e9);
    const res_ = {};
    res_.result = resW > xW ? res.result : x.result;
    res_.runtime = Math.max(res.runtime, x.runtime);
    res_.points = pointReducer(res.points, x.points);
    return res_;
});

async function saveResult(obj, result, points=0) {
    obj.result = result;
    obj.points = points;
    return await obj.save();
}

async function copyToDir(file, dir, newName) {
    try {
        await fs.stat(file);
    } catch(e) {
        throw new errors.io.FileNotFoundError(file);
    }

    const newDir = path.join(dir, newName ? newName : path.basename(file));
    await fs.copy(file, newDir);
    return newDir;
}

async function mkdir777(dir) {
    await fs.mkdir(dir);
    await fs.chmod(dir, 0o777);
}

const GCC = [
    '/usr/bin/env',
    'gcc',
    '-static',
    '-O2',
    '-std=c11',
];
const GCCLink = [
    '-lm',
];
const GPP = [
    '/usr/bin/env',
    'g++',
    '-std=c++14',
    '-static',
    '-O2',
];
const GPPLink = [
];

const isolateDir = config.dirs.isolate;
//const compileBoxId = 999;
export default class Judger {
    constructor(sub) {
        this.sub = sub;
        this.problem = sub.problem;
        this.problemDir = path.join(config.dirs.problems, `${sub.problem._id}`);
        this.testdata = this.problem.testdata;
        this.groups = this.testdata.groups;
        this.userCpp = path.join(config.dirs.submissions, `${this.sub._id}.cpp`);
        this.checkerCpp = this.problem.hasSpecialJudge ? 
            path.join(this.problemDir, 'checker.cpp') : DEFAULT_CHECKER;
        this.result = new Result({
            name: this.problem._id,
            maxPoints: this.testdata.points,
        });
    }
    async prepare() {
        this.sub._result = this.result._id;
        await this.sub.save();
    }
    generateUserCompileTask() {
        return async (compileBoxId) => {
            await reset(compileBoxId);
            this.rootDir=path.join(isolateDir,compileBoxId.toString(),'box');
            await copyToDir(this.userCpp, this.rootDir, 'user.c');

            const result = await compile(compileBoxId, 'user.c', 'user', GCC, GCCLink);
            if (result.RE) {
                saveResult(this.result, 'CE');
                await copyToDir(
                    path.join(this.rootDir, 'compile.err'),
                    config.dirs.submissions,
                    `${this.sub._id}.compile.err`,
                );
                return false;
            }
            await copyToDir(path.join(this.rootDir, 'user'),CTMP,this.sub._id.toString());
            this.userExec = path.join(CTMP,this.sub._id.toString());
            return true;
        };
    }

    generateCheckerCompileTask() {
        return async (compileBoxId) => {
            await reset(compileBoxId);
            
            this.rootDir=path.join(isolateDir,compileBoxId.toString(),'box');
            await copyToDir(this.checkerCpp, this.rootDir, 'checker.cpp');
            await copyToDir(TESTLIB, this.rootDir);

            const result = await compile(compileBoxId, 'checker.cpp', 'checker', GPP, GPPLink);
            if (result.RE) {
                throw Error('Judge Error: Checker Compiled Error.');
            }
            await copyToDir(path.join(this.rootDir, 'checker'),CTMP,this.sub._id.toString()+'_checker');
            this.checkerExec = path.join(CTMP,this.sub._id.toString()+'_checker');
            return true;
        };
    }

    async compileUser(workers) {
        let error = null;
        const task = this.generateUserCompileTask();
        let worker;
        while(true){
            try{
                const worker_result = await Promise.race(workers.map(x => x.finish));
                worker_result.worker.run(task, (err) => {
                    if (err) {
                        logger.error(`Judge error @ compileUser`, err);
                        error = err;
                    }
                });
                worker=worker_result.worker;
            }catch(e){
                if (e instanceof InvalidOperationError) {
                    continue;
                }else{
                    throw e;
                }
            }
            break;
        }
        await worker.finish();
        if (error) {
            throw Error('Judge error when running.');
        }
        return Boolean(this.userExec);
    }
    async compileChecker(workers) {
        let error = null;
        const task = this.generateCheckerCompileTask();
        let worker;
        while(true){
            try{
                const worker_result = await Promise.race(workers.map(x => x.finish));
                worker_result.worker.run(task, (err) => {
                    if (err) {
                        logger.error(`Judge error @ compileChecker`, err);
                        error = err;
                    }
                });
                worker=worker_result.worker;
            }catch(e){
                if (e instanceof InvalidOperationError) {
                    continue;
                }else{
                    throw e;
                }
            }
            break;
        }
        await worker.finish();
        if (error) {
            throw Error('Judge error when running.');
        }
    }
    async prepareFiles() {
        return ;
    }

    generateTask(gid, groupResult, tid, testResult) {
        return async (worker_id) => {
            await (async () => {
                await reset(worker_id);
                const test = this.groups[gid].tests[tid];
                const tdBase = path.join(this.problemDir, 'testdata', test);
                const [inp, outp] = ['in', 'out'].map(x => `${tdBase}.${x}`);
                const userTDir = path.join(isolateDir,worker_id.toString(),'box');
                await copyToDir(inp, userTDir, 'prob.in');
                await copyToDir(this.userExec, userTDir, 'user');

                const userRes = await run(worker_id, 'user', 
                    'prob.in', 'prob.out', 'prob.err', 
                    this.problem.timeLimit);

                testResult.runtime = userRes.time;
                if (userRes.RE) {
                    await saveResult(testResult, 'RE');
                    return;
                }
                if (userRes.TLE) {
                    testResult.runtime = this.problem.timeLimit;
                    await saveResult(testResult, 'TLE');
                    return;
                }

                
                await copyToDir(outp, userTDir, 'prob.ans');
                await copyToDir(this.checkerExec, userTDir, 'checker');
                

                const files = [
                    'prob.in',
                    'prob.out',
                    'prob.ans',
                ];
                const checkerRes = await run(worker_id, 'checker', 
                    null, 'checker.out', 'checker.err',
                    20, 1<<23, files);

                if (checkerRes.TLE) {
                    throw new Error('Judge Error: Checker TLE.');
                }
                if (checkerRes.RE) {
                    await saveResult(testResult, 'WA');
                } else {
                    await saveResult(testResult, 'AC', testResult.maxPoints);
                }
            })();
            this.remains[gid] --;
            if (!this.remains[gid]) {
                const _groupResult = _.reduce(
                    this.testResults[gid],
                    resultReducer(),
                    {result: 'AC', runtime: 0, points: groupResult.maxPoints}
                );
                _.assignIn(groupResult, _groupResult);
                await groupResult.save();
            }
        };
    }

    async loadTasks() {
        this.tasks = [];
        this.remains = [];
        this.testResults = [];
        this.groupResults = [];
        for (let [gid, group] of this.groups.entries()) {
            const groupResult = new Result({
                name: `${this.problem._id}.${gid}`,
                maxPoints: group.points,
            });

            const tests = [];
            for (let [tid, test] of group.tests.entries()) {
                const testResult = new Result({
                    name: `${this.problem._id}.${gid}.${tid}_${test}`,
                    maxPoints: group.points,
                });
                await testResult.save(); 
                groupResult.subresults.push(testResult._id);
                tests.push(testResult);

                this.tasks.push(this.generateTask(
                    gid, groupResult, tid, testResult
                ));
            }

            await groupResult.save();
            this.result.subresults.push(groupResult._id);
            this.testResults.push(tests);
            this.groupResults.push(groupResult);
            this.remains.push(group.tests.length);
        }
        await this.result.save();
    }
    async runAndCheck(workers) {

        let error = null;
        let run_workers=[];
        for (let [taskID, task] of this.tasks.entries()) {
            while(true){
                try{
                    const worker_result = await Promise.race(workers.map(x => x.finish));
                    worker_result.worker.run(task, (err) => {
                        if (err) {
                            logger.error(`Judge error @ ${taskID}`, err);
                            error = err;
                        }
                    });
                    run_workers.push(worker_result.worker);
                }catch(e){
                    if (e instanceof InvalidOperationError) {
                        continue;
                    }else{
                        throw e;
                    }
                }
                break;
            }
            //if (error) break;
        }
        await Promise.all(run_workers.map(x => x.finish()));
        if (error) {
            throw Error('Judge error when running.');
        }

        const reducedResult = _.reduce(
            this.groupResults,
            resultReducer((x, y) => x+y),
            {result: 'AC', runtime: 0, points: 0}
        );
        _.assignIn(this.result, reducedResult);
        await this.result.save();
    }
    async cleanUp() {
        if(this.userExec)await fs.remove(this.userExec);
        if(this.checkerExec)await fs.remove(this.checkerExec);
        //if (this.rootDir) await fs.remove(this.rootDir);
    }
    async go(workers) {
        try {
            logger.info('Preparing...');
            await this.prepare();

            logger.info('Compiling User Cpp...');
            const compileFlag = await this.compileUser(workers);
            if (!compileFlag) {
                return this.result;
            }

            logger.info('Compiling Checker Cpp...');
            await this.compileChecker(workers);

            logger.info('Preparing Files...');
            await this.prepareFiles();

            logger.info('Loading Tasks...');
            await this.loadTasks();

            logger.info('Finally, Run and Check...');
            await this.runAndCheck(workers);

            return this.result;
        } catch(e) {
            throw(e);
        }finally {
            await this.cleanUp();
        }
    }
}
