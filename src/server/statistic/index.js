import _ from 'lodash';
import HomeworkResult from '/model/homeworkResult';
import ProblemResult from '/model/problemResult';
import Submission from '/model/submission';

export async function updateProblemResult(submission) {
    const user = submission.submittedBy;
    const {problem} = submission;
    const sub = (await Submission.find().limit(1)
        .where('submittedBy').equals(user)
        .where('problem').equals(problem)
        .sort('-points ts'))[0];
    if (sub) {
        const res = await ProblemResult.findOneAndUpdate({
            user: user,
            problem: problem,
        }, {
            ts: sub.ts,
            points: sub.points,
            AC: sub.result === 'AC',
        }, {upsert: true, new: true});
        return res;
    }
    return false;
}

function reduceHomeworkSubresults(subresults, weights) {
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

    const _subresults = subresults.map( (x, i) => {
        if (!x) return x;
        return {
            AC: (x.result === 'AC'),
            points: x.points * weights[i],
            ts: x.ts,
        };
    } );
    const reduced = _.reduce(_subresults, reducer, {
        AC: 0,
        points: 0,
    });
    return reduced;
}

export async function lazyUpdateHomeworkResult(hw, submission) {
    const user = submission.submittedBy;
    const {problem} = submission;
    let resObj = await HomeworkResult.findOne()
        .where('user').equals(user)
        .where('homework').equals(hw);

    if (!resObj) {
        resObj = new HomeworkResult({
            user: user,
            homework: hw._id,
            subresults: [],
        });
        resObj.subresults.length = hw.problems.length;
        resObj.subresults.fill(null);
    }
    await resObj.save();

    const {due} = hw;
    const subObj = (await Submission.find().limit(1)
        .where('submittedBy').equals(user)
        .where('problem').equals(problem)
        .where('ts').lte(due)
        .sort('-points ts'))[0];

    
    for (let [idx, _prob] of hw.problems.entries()) {
        if (_prob.problem === problem._id) {
            if (_.isNil(subObj)) resObj.subresults[idx] = null;
            else resObj.subresults[idx] = subObj._id;
            resObj.markModified(`subresults.${idx}`);
        }
    }

    const _subs = await Promise.all(resObj.subresults.map(x => (async () => {
        if (!x) return;
        return await Submission.findById(x);
    })() ));

    const weights = hw.problems.map(x => x.weight);
    const reduced = reduceHomeworkSubresults(_subs, weights);
    _.assignIn(resObj, reduced);
    await resObj.save();
}

export async function updateHomeworkResult(resObj) {
    await resObj.populate('homework').execPopulate();
    const {user, problem} = resObj;
    const hw = resObj.homework;
    const {due} = hw;

    for (let [idx, _prob] of hw.problems.entries()) {
        const subObj = (await Submission.find().limit(1)
            .where('submittedBy').equals(user)
            .where('problem').equals(_prob.problem)
            .where('ts').lte(due)
            .sort('-points ts'))[0];

        if (_.isNil(subObj)) resObj.subresults[idx] = null;
        else resObj.subresults[idx] = subObj._id;
        resObj.markModified(`subresults.${idx}`);
    }

    const _subs = await Promise.all(resObj.subresults.map(x => (async () => {
        if (!x) return;
        const res = await Submission.findById(x);
        return res;
    })() ));

    const weights = hw.problems.map(x => x.weight);
    const reduced = reduceHomeworkSubresults(_subs, weights);
    _.assignIn(resObj, reduced);

    await resObj.save();
}

