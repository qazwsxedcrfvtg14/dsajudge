import ProblemResult from '/model/problemResult';
import Submission from '/model/submission';
import User from '/model/user';


export async function getProblemResultStats(problemID) {
    const res = await ProblemResult.aggregate([
        { 
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: '_user',
            },
        },
        {
            $match: {
                '_user.roles': 'student',
                problem: problemID,
            },
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                average: { $avg: '$points' },
                AC: { 
                    $sum: { $cond: ['$AC', 1, 0] } 
                },
            },
        },
    ]);
    if (!res[0]) return {count: 0, average: 0, AC: 0};
    return res[0];
}

export async function getProblemSubmissionsResult(problemID) {
    const res = await Submission.aggregate([
        {
            $match: {
                'status': { $nin: ['pending', 'judging'] },
                'problem': problemID,
            },
        },
        {
            $group: {
                _id: '$result',
                count: { $sum: 1 },
            },
        },
    ]);
    return res;
}

export async function getProblemFastest(problemID) {
    const res = await Submission.find().limit(3)
        .where('result').equals('AC')
        .where('problem').equals(problemID)
        .sort('runtime')
        .populate('submittedBy', 'email');
    return res;
}

export async function getProblemEarliest(problemID) {
    const res = await Submission.find().limit(3)
        .where('result').equals('AC')
        .where('problem').equals(problemID)
        .sort('ts')
        .populate('submittedBy', 'email');
    return res;
}
