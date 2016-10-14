import HomeworkResult from '/model/homeworkResult';
import Submission from '/model/submission';
import Homework from '/model/homework';
import User from '/model/user';


export async function getHomeworkResultStats(homeworkID) {

    const hw = await Homework.findOne({
        _id: homeworkID,
    });
    const I = {
        points: 0,
        AC: 0,
        count: 0,
    };
    if (!hw) return I;
    const {problemNum} = hw;

    const res = await HomeworkResult.aggregate([
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
                homework: homeworkID,
            },
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                average: { $avg: '$points' },
                AC: { 
                    $sum: { $cond: [ { $eq: [ '$AC', problemNum ] }, 1, 0 ] }
                },
            },
        },
    ]);
    if (!res[0]) return I;
    return res[0];
}

export async function getHomeworkPointsDistribution(homeworkID) {
    const res = await HomeworkResult.aggregate([
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
                'homework': homeworkID,
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
