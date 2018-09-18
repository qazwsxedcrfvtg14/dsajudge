import './common';
import User from '/model/user';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import prompt from 'prompt';
import randomString from 'randomstring';
import {promisify} from 'bluebird';
import _ from 'lodash';

import {ArgumentParser as Parser} from 'argparse';

const parser = new Parser({
    description: 'Utils for managing users account',
    addHelp: true,
});

const subparsers = parser.addSubparsers({
    title: 'commands',
    dest: 'command',
});

const addParser = subparsers.addParser('add', {addHelp: true});
const resetParser = subparsers.addParser('reset-password', {addHelp: true});

addParser.addArgument(
    [ '-u', '--user' ],
    {
        help: 'The mail address of the new user',
        required: true,
    }
);

addParser.addArgument(
    [ '-r', '--roles' ],
    {
        help: 'The role which the new user have',
        nargs: '*',
    }
);

addParser.addArgument(
    [ '-m', '--metas' ],
    {
        help: 'The metadata in <path>=<value> format',
        nargs: '*',
    }
);

resetParser.addArgument(
    ['user'],
    {
        help: 'The email of the user to reset',
    }
);

const addUser = async (args, transporter) => {
    if (!args.user || !args.user.match(/\w+@\w+/)) {
        console.log('The user is not a valid email');
        return;
    }

    const randPass = randomString.generate(10);
    const hashed = await promisify(bcrypt.hash)(randPass, 10);

    const roles = args.roles ? args.roles : [];
    let meta = {};
    if (args.metas) {
        meta = _.fromPairs(_.map(args.metas, x => x.split('=')));
    }

    const user = new User({
        email: args.user,
        password: hashed,
        roles,
        meta,
    });


    const text = (
`Welcome to ADA2018, This email is just to inform you that your ADA Judge account is created.
Here are your account and password.

- Account: ${args.user}
- Password: ${randPass}

Head on to https://ada18-judge.csie.org to try it !
` );

    const mailOptions = {
        from: '"ADA2018" <ada-ta@csie.ntu.edu.tw>',
        to: args.user,
        subject: 'Your ADA Judge Account',
        text,
    };

    await user.save();
    await new Promise( (resolve, reject) => {
        transporter.sendMail(mailOptions, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    } );
};

const resetUser = async (args, transporter) => {
    if (!args.user || !args.user.match(/\w+@\w+/)) {
        console.log('The user is not a valid email');
        return;
    }

    const randPass = randomString.generate(10);
    const hashed = await promisify(bcrypt.hash)(randPass, 10);

    const user = await User.findOne({
        email: args.user,
    });
    if (!user) {
        console.log('User not found');
        return;
    }

    user.password = hashed;

    const text = (
`Your password has been reset, here is your new password.

- Password: ${randPass}

Head on to https://ada18-judge.csie.org and change it.
` );

    const mailOptions = {
        from: '"ADA2018" <ada-ta@csie.ntu.edu.tw>',
        to: args.user,
        subject: `[ADA2018]Password of your ADA Judge Account has been reset`,
        text,
    };

    await user.save();
    await new Promise( (resolve, reject) => {
        transporter.sendMail(mailOptions, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    } );
};

const main = async () => {
    const args = parser.parseArgs();

    prompt.start();
    const result = await promisify(prompt.get)({
        properties: {
            account: {
                description: `Your NTU account, don't input @ntu.edu.tw (The mail will be sent by your account)`,
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

    if (args.command == 'add') {
        await addUser(args, mailTransporter);
    } else if (args.command == 'reset-password') {
        await resetUser(args, mailTransporter);
    }

    console.log('Ended...');
};

if (require.main === module) {
    main();
}
