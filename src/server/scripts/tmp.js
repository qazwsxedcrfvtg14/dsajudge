/*
System.register(['./common', '/model/user', 'nodemailer', 'bcrypt', 'prompt', 'randomstring', 'bluebird', 'lodash', 'argparse'], function (_export, _context) {
    "use strict";

    var User, nodemailer, bcrypt, prompt, randomString, promisify, _, Parser;

    return {
        setters: [function (_common) {}, function (_modelUser) {
            User = _modelUser.default;
        }, function (_nodemailer) {
            nodemailer = _nodemailer.default;
        }, function (_bcrypt) {
            bcrypt = _bcrypt.default;
        }, function (_prompt) {
            prompt = _prompt.default;
        }, function (_randomstring) {
            randomString = _randomstring.default;
        }, function (_bluebird) {
            promisify = _bluebird.promisify;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_argparse) {
            Parser = _argparse.ArgumentParser;
        }],
        execute: function () {

            const parser = new Parser({
                description: 'Utils for managing users account',
                addHelp: true
            });

            const subparsers = parser.addSubparsers({
                title: 'commands',
                dest: 'command'
            });

            const addParser = subparsers.addParser('add', { addHelp: true });
            const resetParser = subparsers.addParser('reset-password', { addHelp: true });

            addParser.addArgument(['-u', '--user'], {
                help: 'The mail address of the new user',
                required: true
            });

            addParser.addArgument(['-r', '--roles'], {
                help: 'The role which the new user have',
                nargs: '*'
            });

            addParser.addArgument(['-m', '--metas'], {
                help: 'The metadata in <path>=<value> format',
                nargs: '*'
            });

            resetParser.addArgument(['user'], {
                help: 'The email of the user to reset'
            });

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
                    meta
                });

                const text = `Welcome to DSA2018, This email is just to inform you that your DSA Judge account is created.
Here are your account and password.

- Account: ${args.user}
- Password: ${randPass}

Head on to https://dsa.csie.org to try it !
`;

                const mailOptions = {
                    from: '"DSA2018" <dsa@csie.ntu.edu.tw>',
                    to: args.user,
                    subject: 'Your DSA Judge Account',
                    text
                };

                await user.save();
                await new Promise((resolve, reject) => {
                    transporter.sendMail(mailOptions, (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
            };

            const resetUser = async (args, transporter) => {
                if (!args.user || !args.user.match(/\w+@\w+/)) {
                    console.log('The user is not a valid email');
                    return;
                }

                const randPass = randomString.generate(10);
                const hashed = await promisify(bcrypt.hash)(randPass, 10);

                const user = await User.findOne({
                    email: args.user
                });
                if (!user) {
                    console.log('User not found');
                    return;
                }

                user.password = hashed;

                const text = `Your password has been reset, here is your new password.

- Password: ${randPass}

Head on to https://dsa.csie.org and change it.
`;

                const mailOptions = {
                    from: '"DSA2018" <dsa@csie.ntu.edu.tw>',
                    to: args.user,
                    subject: `Your DSA Judge Account's password has been reset`,
                    text
                };

                await user.save();
                await new Promise((resolve, reject) => {
                    transporter.sendMail(mailOptions, (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
            };

            const main = async () => {
                const args = parser.parseArgs();

                prompt.start();
                const result = await promisify(prompt.get)({
                    properties: {
                        account: {
                            description: `Your NTU account, don't input @ntu.edu.tw\n (The mail would be send by your account)`,
                            pattern: /^\w+$/,
                            message: 'Input a valid NTU account',
                            required: true
                        },
                        password: {
                            hidden: true
                        }
                    }
                });

                const smtpConfig = {
                    host: 'smtps.ntu.edu.tw',
                    port: 465,
                    secure: true,
                    auth: {
                        user: result.account,
                        pass: result.password
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
        }
    };
});

*/