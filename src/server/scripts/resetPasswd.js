import './common';
import User from '/model/user';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import prompt from 'prompt';
import randomString from 'randomstring';
import {promisify} from 'bluebird';

const main = async () => {
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
  await resetUser('email_email', mailTransporter);
  console.log('Ended...');
};

const resetUser = async (email, transporter) => {
  const randPass = randomString.generate(10);
  const hashed = await promisify(bcrypt.hash)(randPass, 10);
  console.log(randPass);
  console.log(hashed);
  const user = await User.findOne({email});
  user.password = hashed;
  await user.save();
  const text = (
    `Welcome to ADA2019, this email is to inform you that your ADA Judge account has been created.
Here is your account and temporary password. (You can change your password after logging in.)

- Account: ${email}
- Password: ${randPass}

Head on to https://ada19-judge.csie.org and try it!
`);

  const mailOptions = {
    from: '"ADA2019" <ada-ta@csie.ntu.edu.tw >',
    to: email,
    subject: '[ADA2019]Your ADA Judge Account',
    text
  };

  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
  // await user.save();
  console.log(`${email} successfully sended.`);
};

if (require.main === module) {
  main();
}
