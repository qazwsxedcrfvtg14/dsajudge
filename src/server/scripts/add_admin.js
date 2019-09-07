import './common';
import User from '/model/user';
import bcrypt from 'bcrypt';
import {promisify} from 'bluebird';
(async () => {
  const hashed = await bcrypt.hash('this is password', 10);
  const roles = ['admin'];
  const user = new User({
    email: 'admin@abc.com',
    password: hashed,
    roles: roles,
    meta: {
      id: 'admin',
      name: 'Admin'
    }
  });
  await user.save();
})();
