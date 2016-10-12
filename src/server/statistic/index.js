import Submission from '/model/submission';

async function updateUserProblemResult(submission) {
    const user = submission.submittedBy;
    const {problem} = submission;
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

