'use strict';

import './common';
import User from '/model/user';
import bcrypt from 'bcrypt';


const hashed = await promisify(bcrypt.hash)('this is password', 10);
const roles = ['admin','student'];
const user = new User({
    email: "admin@abc.com",
    password: hashed,
    roles: roles,
    meta: {
        id:0,
        name: "Admin"
    },
});
await user.save();