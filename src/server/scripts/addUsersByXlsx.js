import './common';
import User from '/model/user';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import prompt from 'prompt';
import randomString from 'randomstring';
import {promisify} from 'bluebird';

import {ArgumentParser as Parser} from 'argparse';
import XLSX from 'xlsx';

const parser = new Parser({
  description: 'Add a new user, and send password mail',
  addHelp: true
});

parser.addArgument(
  [ 'file' ],
  {
    help: 'The xlsx file'
  }
);

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
  const wb = XLSX.readFile(args.file);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_csv(sheet).split('\n').slice(1);

  // Choose the correct columns according to input xls file
  // const ID=3, NAME = 4, EMAIL = 5;
  const ID = 4, NAME = 2, EMAIL = 1, ROLE = 3;
  for (let r of rows) {
    if (!r || !r.length) break;
    const td = r.split(',');
    const user = {
      email: td[EMAIL],
      id: td[ID] || '',
      name: td[NAME],
      roles: [td[ROLE]]
    };
    console.log(td[EMAIL], td[ID], td[NAME], td[ROLE]);
    await newUser(td[EMAIL], td[ID], td[NAME], td[ROLE], mailTransporter);
  }

  console.log('Ended...');
};

const newUser = async (email, id, name, role, transporter) => {
  const randPass = randomString.generate(10);
  const hashed = await promisify(bcrypt.hash)(randPass, 10);

  // const roles = ['student'];

  const user = new User({
    email: email,
    password: hashed,
    roles: [role],
    meta: {
      id,
      name
    }
  });

  const text = (
    `Welcome to ADA2019, this email is to inform you that your ADA Judge account has been created.
Here is your account and temporary password. (You can change your password after logging in.)

- Account: ${email}
- Password: ${randPass}

Head on to https://ada-judge.csie.ntu.edu.tw/ and try it!
`);

  const mailOptions = {
    from: '"ADA2019" <ada-ta@csie.ntu.edu.tw >',
    to: email,
    subject: '[ADA2019]Your ADA Judge Account',
    text
  };
  await user.save();
  await new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });

  console.log(`User ${email} ${randPass} successfully added`);
};

if (require.main === module) {
  main();
}
