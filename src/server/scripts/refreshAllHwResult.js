import './common';
import {updateHomeworkResult} from '/statistic';
import HomeworkResult from '/model/homeworkResult';

const main = async () => {
    const ls = await HomeworkResult.find();
    await Promise.all(ls.map(x => updateHomeworkResult(x) ));
    console.log('done');
};

main();
