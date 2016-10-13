import './common';
import {lazyUpdateHomeworkResult, updateProblemResult} from '/statistic';
import HomeworkResult from '/model/homeworkResult';
import Submission from '/model/submission';
import Homework from '/model/homework';

const main = async () => {
    let ls = await Submission.find();
    let len = ls.length;
    let cnt = 0;
    for (let sub of ls) {
        await updateProblemResult(sub);
        const hws = await Homework.find()
            .where('problems.problem').equals(sub.problem)
            .where('due').gte(sub.ts);

        for (let hw of hws) {
            await lazyUpdateHomeworkResult(hw, sub);
        }
        cnt++;
        if (cnt % 100 == 0) console.log(`Updated ${cnt}/${len}`);
    }

    console.log('done');
};

main();
