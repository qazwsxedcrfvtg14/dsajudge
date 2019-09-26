import './common';
import User from '/model/user';
import bcrypt from 'bcrypt';
import {promisify} from 'bluebird';
(async () => {
  const students = await User.find({roles: ['student']});
  // console.log(students[0]);
  for (const student of students) {
    student.roles = [];
    console.log(student);
    await student.save();
  }
})();
