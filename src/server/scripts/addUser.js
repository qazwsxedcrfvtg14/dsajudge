import './common';
import User from '/model/user';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import prompt from 'prompt';
import randomString from 'randomstring';
import {promisify} from 'bluebird';

import {ArgumentParser as Parser} from 'argparse';

const parser = new Parser({
    description: 'Add a new user, and send password mail',
    addHelp: true,
});

parser.addArgument(
    [ '-u', '--user' ],
    {
        help: 'The mail address of the new user',
        required: true,
    }
);

parser.addArgument(
    [ '-r', '--roles' ],
    {
        help: 'The role which the new user have',
        nargs: '*',
    }
);

const main = async () => {
    const args = parser.parseArgs();

    if (!args.user || !args.user.match(/\w+@\w+/)) {
        console.log('The user is not a valid email');
        return;
    }

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
    const randPass = randomString.generate(10);
    const hashed = await promisify(bcrypt.hash)(randPass, 10);

    const roles = args.roles ? args.roles : [];

    const user = new User({
        email: args.user,
        password: hashed,
        roles,
    });

    const text = (
`Welcome to ADA2016, This email is just to inform you that your ADA Judge account is created.
Here are your account and password.

- Account: ${args.user}
- Password: ${randPass}

Head on to https://ada01-judge.csie.org to try it !
` );

    const mailOptions = {
        from: '"ADA2016" <ada01@csie.ntu.edu.tw>',
        to: args.user,
        subject: 'Your ADA Judge Account',
        text,
    };

    await user.save();
    await new Promise( (resolve, reject) => {
        mailTransporter.sendMail(mailOptions, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    } );
    console.log('Ended...');
};

if (require.main === module) {
    main();
}
