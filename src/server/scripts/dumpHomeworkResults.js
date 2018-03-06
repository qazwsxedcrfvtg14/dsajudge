import './common';
import fs from 'fs-extra';
import {promisify} from 'bluebird';
import prompt from 'prompt';

import HomeworkResult from '/model/homeworkResult';
import Submission from '/model/submission';
import Homework from '/model/homework';
import User from '/model/user';

const main = async () => {
  prompt.start();
  const {homework} = await promisify(prompt.get)({
    properties: {
      homework: {
        description: `The homework id`,
        required: true,
      },
    }
  });

  let results = await HomeworkResult
    .find({homework})
    .populate('user', 'roles meta');

  const len = results.length;
  let cnt = 0;
  let output = '';
  for (let result of results) {
    if (result.user.roles.includes('student')) {
      output += `${result.user.meta.name || ''},${result.user.meta.id || ''},${result.points}\n`;
    }
    //console.log(result.user);
    //const hws = await Homework.find()
    //.where('problems.problem').equals(sub.problem)
    //.where('due').gte(sub.ts);

    //for (let hw of hws) {
    //await lazyUpdateHomeworkResult(hw, sub);
    //}
    cnt++;
    if (cnt % 100 == 0) console.log(`Updated ${cnt}/${len}`);
  }

  await fs.writeFile('result.csv', output, (err) => {
    if (err) throw err;

    console.log('done');
  });
};

main();
