import path from 'path';
import config from '/config';
import Submission from '/schema/submission';
import sleep from 'sleep-promise';
import {compile, judge} from './shik';
import {mergeResult} from './utils';
import _ from 'lodash';
import logger from '/logger';

async function _startJudge(sub) {

    logger.info(`judging #${sub._id}`);
    const res = await compile(path.join(config.dirs.submissions, `${sub._id}.cpp`));

    if (res.result == 'CE') {
        sub.results.result = 'CE';
        sub.results.points = 0;
        await sub.save();
        return sub;
    }


    const tds = [];
    const remains = [];
    sub.problem.testdata.groups.forEach(
        (x, i) => {
            remains.push(x.count);
            sub.results.groups[i] = {
                points: 0,
                tests: ((l) => {let ls = []; ls.length = l; return ls})(x.count),
            };
            x.tests.forEach((y, j) => tds.push({
                gid: i,
                tid: j,
                testFile: y,
            }));
        }
    );

    sub.markModified('results.groups');
    await sub.save();

    const probDir = path.join(config.dirs.problems, `${sub.problem._id}`, 'testdatas');

    for (let td of tds) {
        const {gid, tid, testFile} = td;
        const [inFile, ansFile] = ['.in', '.out'].map(x => path.join(probDir, testFile+x));
        const {timeLimit} = sub.problem;
        const judgeResult = (await judge(res.exec, inFile, ansFile, timeLimit)).result;
        const gRes = sub.results.groups[gid];
        sub.results.groups[gid].tests[tid] = judgeResult;
        remains[gid] --;
        if (!remains[gid]) {
            gRes.result = mergeResult(gRes.tests);
            if (gRes.result == 'AC') {
                gRes.points = sub.problem.testdata.groups[gid].points;
            }
        }
        sub.markModified('results.groups');
        await sub.save();
    }

    sub.results.points = _.reduce(sub.results.groups, (v, x) => v + x.points, 0);
    sub.results.result = mergeResult(_.map(sub.results.groups, (x) => x.result));
    logger.info(`judge #${sub._id} finished, result = ${sub.results.result}`);
    await sub.save();
}

async function startJudge(sub) {
    sub.status = 'judging';
    await sub.save();
    try {
        await _startJudge(sub);
    } catch(e) {
        logger.error('judge error', e);
        sub.status = 'error';
        await sub.save();
        return;
    }
    sub.status = 'finished';
    await sub.save();
}

async function mainLoop() {
    while (true) {
        const pending = await (
            Submission.findOne({status: 'pending'})
                .populate('problem')
                .populate('submittedBy')
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
