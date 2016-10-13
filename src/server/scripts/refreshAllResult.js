import './common';
import {updateHomeworkResult, updateProblemResult} from '/statistic';
import HomeworkResult from '/model/homeworkResult';
import Submission from '/model/submission';

const main = async () => {
    let ls = await Submission.find();
    let len = ls.length;
    let cnt = 0;
    for (let sub of ls) {
        await updateProblemResult(sub);
        cnt++;
        if (cnt % 100 == 0) console.log(`Updated ${cnt}/${len}`);
    }

    ls = await HomeworkResult.find();
    len = ls.length;
    cnt = 0;
    for (let res of ls) {
        await updateHomeworkResult(res);
        cnt++;
        if (cnt % 100 == 0) console.log(`Updated ${cnt}/${len}`);
    }
    console.log('done');
};

main();
