import HomeworkResult from '/model/homeworkResult';
import User from '/model/user';

export async function getRank(hwID, userID) {
    const hwRes = await HomeworkResult.findOne()
        .where('homework').equals(hwID)
        .where('user').equals(userID)
    ;

    const tot = await User.find().where('roles').equals('student').count();

    if (!hwRes) {
        const cnt = await HomeworkResult.aggregate([
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
                },
            },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                },
            },
        ]);
        return [cnt[0].count + 1, tot];
    }

    const {points, ts} = hwRes;
    const c1 = await HomeworkResult.aggregate([
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
                'points': {
                    $gt: points,
                },
            },
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
            },
        },
    ]);

    const c2 = await HomeworkResult.aggregate([
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
                'points': points,
                'ts': {
                    $lt: ts,
                },
            },
        },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
            },
        },
    ]);

    return [(c1[0] ? c1[0].count : 0) + (c2[0] ? c2[0].count : 0) + 1, tot];
}
