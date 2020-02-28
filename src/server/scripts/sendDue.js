import './common';
import User from '/model/user';
import HomeworkResult from '/model/homeworkResult';
import nodemailer from 'nodemailer';
import {promisify} from 'bluebird';
import prompt from 'prompt';
import _ from 'lodash';

const main = async () => {

    prompt.start();
    const result = await promisify(prompt.get)({
        properties: {
            account: {
                description: `Your NTU account, don't input @ntu.edu.tw\n (The mail would be send by your account)`,
                pattern: /^\w+$/,
                message: 'Input a valid NTU account',
                required: true,
            },
            password: {
                hidden: true,
            }
        }
    });

    const smtpConfig = {
        host: 'smtps.ntu.edu.tw',
        port: 465,
        secure: true,
        auth: {
            user: result.account,
            pass: result.password,
        }
    };
    const mailTransporter = nodemailer.createTransport(smtpConfig);

    const users = await User.find();

    for (let user of users) {

        const hwResult = await HomeworkResult.findOne({
            homework: 1,
            user: user._id,
        });
        const text = `This mail is just to remind you that the dsa hw1 would be due tomorrow, which is about 24 hours from now.
Please remember to bring your hard copy homework to class tomorrow, and ensure that you have submit all your solutions 
to the dsa-judge. Also please check that your score on the dsa-judge website is correct.
Your current score is ${hwResult ? hwResult.points : "0 (it seems that you haven't started yet.)"}
Thank you`;

        const mailOptions = {
            from: '"DSA2020" <ta@dsa.csie.org>',
            to: user.email,
            subject: `Reminder of the deadline of homework 1`,
            text,
        };

        console.log(`${user.meta.name} (${user.meta._id}) = ${hwResult ? hwResult.points : 'nil'}`);

        await new Promise( (resolve, reject) => {
            mailTransporter.sendMail(mailOptions, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        } );
    }


    console.log('Ended...');
};

if (require.main === module) {
    main();
}
