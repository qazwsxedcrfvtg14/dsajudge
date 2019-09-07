import config from '/config';
import express from 'express';
import {requireLogin} from '/utils';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs-extra';
import wrap from 'express-async-wrap';
import {promisify} from 'bluebird';
import {execFile} from 'child_process';
const router = express.Router();
import _ from 'lodash';
import randomString from 'randomstring';
import User from '/model/user';

const GIT_CP = '/home/git/cp';
const tmpDir = '/tmp/judge_git';
const gitRepoDir = '/home/git/repositories';
const gitAdminDir = config.dirs.gitadmin;

function gitCpWrap (opt) {
  return new Promise((resolve, reject) => {
    execFile(GIT_CP, opt, {},
      (err, stdout, stderr) => {
        if (err) return reject(err);
        resolve(_.assignIn({stdout, stderr}));
      }
    );
  });
}

router.get('/me', (req, res) => {
  if (req.user) {
    let user = {};
    user.meta = req.user.meta;
    user.submission_limit = req.user.submission_limit;
    user.roles = req.user.roles;
    user.email = req.user.email;
    user.ssh_key = req.user.ssh_key;
    user.homeworks = req.user.homeworks;
    res.send({
      login: true,
      user: user
    });
  } else {
    res.send({
      login: false
    });
  }
});

router.post('/changePassword', requireLogin, wrap(async (req, res) => {
  const comp = await promisify(bcrypt.compareAsync)(req.body['current-password'], req.user.password);
  if (!comp) { return res.status(403).send(`Old password is not correct`); }
  const newPassword = req.body['new-password'];
  let changePassword = false;
  if (newPassword.length > 0) {
    if (newPassword !== req.body['confirm-password']) { return res.status(400).send(`Two password are not equal.`); }
    if (newPassword.length <= 8) { return res.status(400).send(`New password too short`); }
    if (newPassword.length > 30) { return res.status(400).send(`New password too long`); }
    try {
      const hash = await promisify(bcrypt.hash)(newPassword, 10);
      // eslint-disable-next-line require-atomic-updates
      req.user.password = hash;
      await req.user.save();
      changePassword = true;
    } catch (e) {
      return res.status(500).send(`Something bad happened... New password may not be saved.`);
    }
    // res.send(`Password changed successfully.`);
  }
  let changeSshKey = false;
  if (changePassword && changeSshKey) {
    res.send(`Password & SSH Key changed successfully.`);
  } else if (changePassword) {
    res.send(`Password changed successfully.`);
  } else if (changeSshKey) {
    res.send(`SSH Key changed successfully.`);
  } else {
    res.send(`Nothing changed.`);
  }
}));

export default router;
