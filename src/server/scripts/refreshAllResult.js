import './common';
import {updateHomeworkResult, updateProblemResult} from '/statistic';
import HomeworkResult from '/model/homeworkResult';
import Submission from '/model/submission';

const main = async () => {
    let ls = await Submission.find();
    for (let sub of ls) {
        await updateProblemResult(sub);
    }

    ls = await HomeworkResult.find();
    for (let res of ls) {
        await updateHomeworkResult(res);
    }
    console.log('done');
};

main();
