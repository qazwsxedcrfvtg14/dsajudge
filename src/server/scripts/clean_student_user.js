import './common';
import User from '/model/user';
import bcrypt from 'bcrypt';
import {promisify} from 'bluebird';
(async () => {
  const students = await User.find({role: ['student']});
  // console.log(students[0]);
  for (const student of students) {
    student.role = [];
    console.log(student);
    // await student.save();
  }
})();
