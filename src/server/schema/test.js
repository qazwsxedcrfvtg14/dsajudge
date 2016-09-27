import mongoose from 'mongoose';
mongoose.connect('mongodb://localhost/adajudge');
import User from './user';
import Problem from './problem';
import bcrypt from 'bcrypt';

let password = bcrypt.hashSync('123123', 10);

let test = new User({
    email: 'bobogei81123@gmail.com',
    password,
});
test.save((err, x) => console.log(err, x));

//let test = new Problem({
    //_id: 0,
    //name: 'Download Hao123',
    //visible: false,
//});
//test.save((err, x) => console.log(err, x));
console.log(test);
