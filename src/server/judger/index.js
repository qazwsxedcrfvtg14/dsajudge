import path from 'path';
import Submission from '/model/submission';
import Result from '/model/result';
import Homework from '/model/homework';
import ProblemResult from '/model/problemResult';
import HomeworkResult from '/model/homeworkResult';
import sleep from 'sleep-promise';
import _ from 'lodash';
import logger from '/logger';
import Judge from './judge';

async function updateUserProblemResult(user, problem, _sub) {
    const sub = (await Submission.find().limit(1)
        .where('submittedBy').equals(user)
        .where('problem').equals(problem)
        .sort('-points ts'))[0];
    if (sub) {
        const res = await ProblemResult.findOneAndUpdate({
            user: user,
            problem: problem._id,
        }, {
            ts: sub.ts,
            points: sub.points,
            AC: sub.result === 'AC',
        }, {upsert: true, new: true});
        return res;
    }
    return false;
}

async function updateUserHomeworkProblem(user, hw, prob, res) {
    let obj = await HomeworkResult.findOne()
        .where('user').equals(user)
        .where('homework').equals(hw);

    if (!obj) {
        obj = new HomeworkResult({
            user: user,
            homework: hw._id,
            subresults: [],
        });
        obj.subresults.length = hw.problems.length;
    }

    for (let [idx, _prob] of hw.problems.entries()) {
        if (_prob.problem === prob._id) {
            obj.subresults[idx] = res._id;
        }
    }

    await obj.populate('subresults').execPopulate();

    const reducer = (v, x) => {
        if (!x) return v;
        const {points, AC, ts} = x;
        const res = {};
        res.ts = !_.has(v, 'ts') ? x.ts : (
            (x.ts > v.ts) ? x.ts : v.ts
        );
        res.AC = v.AC + x.AC;
        res.points = v.points + x.points;
        return res;
    };

    const _subresults = obj.subresults.map( (x, i) => {
        if (!x) return x;
        return {
            AC: x.AC,
            points: x.points * hw.problems[i].weight,
            ts: x.ts,
        };
    } );
    const reduced = _.reduce(_subresults, reducer, {
        AC: 0,
        points: 0,
    });

    _.assignIn(obj, reduced);
    await obj.save();
}

async function updateStatistic(sub) {
    const user = sub.submittedBy;
    const problem = sub.problem;
    const res = await updateUserProblemResult(user, problem, sub);
    if (!res) return;
    const hws = await Homework.find({
        'problems.problem': problem,
    });

    for (let hw of hws) {
        await updateUserHomeworkProblem(user, hw, problem, res);
    }
}

async function startJudge(sub) {
    sub.status = 'judging';
    sub.result = null;
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
        const judge = new Judge(sub);
        result = await judge.go();
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
    logger.info(`judge #${sub._id} finished, result = ${result.result}`);
    await sub.save();
    try {
        await updateStatistic(sub);
    } catch (e) {
        console.log(e);
    }
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
