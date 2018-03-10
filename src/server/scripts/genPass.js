import './common';
import User from '/model/user';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import prompt from 'prompt';
import randomString from 'randomstring';
import {promisify} from 'bluebird';

const main = async () => {

    const randPass = randomString.generate(10);
    const hashed = await promisify(bcrypt.hash)(randPass, 10);
    console.log(randPass);
    console.log(hashed);
    console.log('Ended...');
};

if (require.main === module) {
    main();
}
