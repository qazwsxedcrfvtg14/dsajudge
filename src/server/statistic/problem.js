import ProblemResult from '/model/problemResult';
import Submission from '/model/submission';
import User from '/model/user';
import _ from 'lodash';

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

export async function getProblemResultBucket(problemID) {
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

export async function getProblemPointsDistribution(problemID) {
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
                'problem': problemID,
                '_user.roles': 'student',
            },
        },
        {
            $group: {
                _id: '$points',
                count: { $sum: 1 },
            },
        },
    ]);
    return res;
}

export async function getProblemFastest(problemID) {
    const _res = await Submission.aggregate([
        {
            $match: {
                'problem': problemID,
                'result': 'AC',
            },
        },
        { 
            $lookup: {
                from: 'users',
                localField: 'submittedBy',
                foreignField: '_id',
                as: '_user',
            },
        },
        {
            $match: {
                '_user.roles': 'student',
            },
        },
        {
            $group: {
                _id: '$submittedBy',
                runtime: { $min: '$runtime' },
            },
        },
        {
            $sort: {
                'runtime': 1,
            },
        },
        {
            $limit: 10,
        },
    ]);

    const res = await Promise.all(_.map(_res, obj => (async () => {
        return Submission.findOne()
            .where('problem').equals(problemID)
            .where('submittedBy').equals(obj._id)
            .where('result').equals('AC')
            .sort('runtime').populate('submittedBy', 'email meta');
    })() ));
    return res;
}

export async function getProblemAdminFastest(problemID) {
    const _res = await Submission.aggregate([
        {
            $match: {
                'problem': problemID,
                'result': 'AC',
            },
        },
        { 
            $lookup: {
                from: 'users',
                localField: 'submittedBy',
                foreignField: '_id',
                as: '_user',
            },
        },
        {
            $match: {
                '_user.roles': { $ne: 'student' },
            },
        },
        {
            $group: {
                _id: '$submittedBy',
                runtime: { $min: '$runtime' },
                origin: {
                    $min: '$$ROOT',
                },
            },
        },
        {
            $sort: {
                'runtime': 1,
            },
        },
        {
            $limit: 10,
        },
    ]);

    const res = await Promise.all(_.map(_res, obj => (async () => {
        const r = obj.origin;
        _.unset(r, '_user');
        _.unset(r, 'submittedBy');
        return r;
    })() ));
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

export async function getProblemSolutions(problemID) {
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
                'problem': problemID,
                '_user.roles': 'student',
            },
        },
        {
            $group: {
                _id: '$points',
                count: { $sum: 1 },
            },
        },
    ]);
    return res;
}
