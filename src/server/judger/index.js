import path from 'path';
import config from '/config';
import Submission from '/model/submission';
import Result from '/model/result';
import sleep from 'sleep-promise';
import {CppExec, compile, judge} from './shik';
import {mergeResult} from './utils';
import _ from 'lodash';
import logger from '/logger';
import {Error} from 'common-errors';
import fs from 'fs-promise';
import Worker from './pool';

const DEFAULT_CHECKER = path.join(config.dirs.cfiles, 'default_checker.cpp');
const TESTLIB = path.join(config.dirs.cfiles, 'testlib.h');

async function runAndCheck(id, userExec, checkExec, inFile, ansFile, timeLimit, memLimit) {
    let res = await userExec.run(`user-${id}`, inFile, timeLimit, memLimit);
    const ret = {runtime: res.stat.cpu_time_usage};
    if (res.stat.TLE) return _.assignIn(ret, {result: 'TLE', runtime: timeLimit});
    if (res.stat.RE) return _.assignIn({result: 'RE'}, ret);

    const neededFiles = [inFile, res.outFile, ansFile];
    await checkExec.prepareFiles(neededFiles);
    let checkRes = await checkExec.run(
        `checker-${id}`, undefined, 30, 1<<30, neededFiles.map(x => path.basename(x))
    );

    if (checkRes.stat.TLE) throw Error('Checker time limit exceeded');
    if (checkRes.stat.RE) return _.assignIn({result: 'WA'}, ret);

    return _.assignIn({result: 'AC'}, ret);
}

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

async function _startJudge(sub) {

    // Init mainResult
    const problemId = sub.problem._id;
    const mainResult = new Result({
        name: problemId,
        maxPoints: sub.problem.testdata.points,
    });
    sub._result = mainResult._id;
    await mainResult.save();
    await sub.save();

    const cppFile = path.join(config.dirs.submissions, `${sub._id}.cpp`);
    const userExec = new CppExec(cppFile);
    let checker;
    if (sub.problem.meta.hasSpecialJudge) {
        checker = path.join(config.dirs.problems, `${sub.problem._id}`, 'checker.cpp');
    } else {
        checker = DEFAULT_CHECKER;
    }
    const checkerExec = new CppExec(checker);

    try {
        // Compile
        await userExec.init();
        const compileResult = await userExec.compile();

        if (userExec.status === 'compile error') {
            mainResult.result = 'CE';
            mainResult.points = 0;
            await sub.save();
            await fs.copy(compileResult.errFile,
                path.join(config.dirs.submissions, `${sub._id}.compile.err`));
            userExec.clean();
            return mainResult;
        }

        // Compile checker
        await checkerExec.init();
        await checkerExec.prepareFiles([TESTLIB]);
        await checkerExec.compile();
        if (checkerExec.status !== 'compiled') {
            throw Error('Checker compiled failed');
        }

        // Load testdatas
        const testObjs = [];
        const groupObjs = [];
        const remains = [];

        for (let [gid, group] of sub.problem.testdata.groups.entries()) {
            remains.push(group.count);
            const groupResult = new Result({
                name: `${problemId}_${gid}`,
                maxPoints: group.points,
            });
            mainResult.subresults.push(groupResult._id);
            const tests = [];

            for (let [tid, testName] of group.tests.entries()) {
                const testResult = new Result({
                    name: `${problemId}_${gid}_${testName}`,
                    maxPoints: group.points,
                });
                await testResult.save();
                const _obj = {
                    gid,
                    fileName: testName,
                    model: testResult,
                };
                tests.push(testResult);
                testObjs.push(_obj);
                groupResult.subresults.push(testResult._id);
            }
            await groupResult.save();
            groupObjs.push({
                tests,
                model: groupResult,
            });
        }
        await mainResult.save();

        const probDir = path.join(config.dirs.problems, `${sub.problem._id}`, 'testdatas');
        const {timeLimit} = sub.problem.meta;

        const promises = testObjs.map((td, idx) => (async () => {
            const testModel = td.model;
            const gid = td.gid;
            const [inFile, ansFile] = ['in', 'out'].map(ext => path.join(probDir, `${td.fileName}.${ext}`));
            const testResult = await runAndCheck(
                `${td.fileName}.${idx}`, userExec, checkerExec, inFile, ansFile, timeLimit
            );

            _.assignIn(testModel, testResult);
            if (testResult.result === 'AC') testModel.points = testModel.maxPoints;
            await testModel.save();
            remains[gid] --;

            if (!remains[gid]) {
                const gObj = groupObjs[gid];
                const groupResult = _.reduce(
                    gObj.tests, resultReducer(), {result: 'AC', runtime: 0, points: gObj.model.maxPoints}
                );
                _.assignIn(gObj.model, groupResult);
                await gObj.model.save();
            }
        }));


        // Load workers
        const workers = [];
        for (let i=0; i<config.maxWorkers; i++) {
            workers.push(new Worker());
        }

        let error = null;
        for (let task of promises) {
            const {worker, ret} = await Promise.race(workers.map(x => x.finish()));
            worker.run(task, (err) => {
                if (err) {
                    logger.error('Judge error', error);
                    error = err;
                }
            });
            if (error) break;
        }

        const finalList = await Promise.all(workers.map(x => x.finish()));
        if (error) {
            throw Error('Judge error when running exec.');
        }

        const reducedResult = _.reduce(
            groupObjs.map(x => x.model), resultReducer((x, y) => x+y), {result: 'AC', runtime: 0, points: 0}
        );
        _.assignIn(mainResult, reducedResult);
        await mainResult.save();
    } catch(e) {
        throw e;
    } finally {
        userExec.clean();
        checkerExec.clean();
    }

    return mainResult;
}

async function startJudge(sub) {
    sub.status = 'judging';
    sub.judgeTs = Date.now();
    if (sub.result) {
        const _result = await Result.findById(sub._result);
        if (_result) {
            await _result.purge();
        }
    }
    await sub.save();

    let result;
    try {
        logger.info(`judging #${sub._id}`);
        result = await _startJudge(sub);
    } catch(e) {
        sub.status = 'error';
        sub.result = 'JE';
        sub.points = 0;
        logger.error(`#${sub._id} judge error`, e);
        await sub.save();
        return;
    }
    sub.status = 'finished';
    ['result', 'points', 'runtime'].forEach(x => {
        sub[x] = result[x];
    });
    console.log(sub);
    logger.info(`judge #${sub._id} finished, result = ${result.result}`);
    await sub.save();
}

async function mainLoop() {
    while (true) {
        const pending = await (
            Submission.findOne({status: 'pending'})
            .populate('problem')
        );
        if (!pending) {
            await sleep(1000);
            continue;
        }

        await startJudge(pending);
        await sleep(50);
    }
}

export default mainLoop;
