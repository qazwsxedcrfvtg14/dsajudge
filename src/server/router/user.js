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

const GIT_CP="/home/git/cp";
const tmpDir="/tmp/judge_git";
const gitRepoDir="/home/git/repositories";
const gitAdminDir=config.dirs.gitadmin;

function gitCpWrap(opt) {
    return new Promise((resolve, reject) => {
        execFile(GIT_CP,opt,{},
            (err, stdout, stderr) => {
                if (err) return reject(err);
                resolve(_.assignIn({stdout,stderr}));
            }
        );
    });
}

router.get('/me', (req, res) => {
    if (req.user) {
        let user={};
        user.meta=req.user.meta;
        user.submission_limit=req.user.submission_limit;
        user.roles=req.user.roles;
        user.email=req.user.email;
        user.ssh_key=req.user.ssh_key;
        user.homeworks=req.user.homeworks;
        res.send({
            login: true,
            user: user,
        });
    } else {
        res.send({
            login: false,
        });
    }
});

router.post('/changePassword', requireLogin, wrap(async (req, res) => {

    const comp = await promisify(bcrypt.compareAsync)(req.body['current-password'], req.user.password);
    if (!comp)
        return res.status(403).send(`Old password is not correct`);
    const newPassword = req.body['new-password'];
    let changePassword=false;
    if(newPassword.length > 0){
        if (newPassword !== req.body['confirm-password']) 
            return res.status(400).send(`Two password are not equal.`);
        if (newPassword.length <= 8)
            return res.status(400).send(`New password too short`);
        if (newPassword.length > 30)
            return res.status(400).send(`New password too long`);
        try {
            const hash = await promisify(bcrypt.hash)(newPassword, 10);
            req.user.password = hash;
            await req.user.save();
            changePassword=true;
        } catch(e) {
            return res.status(500).send(`Something bad happened... New password may not be saved.`);
        }
        //res.send(`Password changed successfully.`);
    }
    let newSshKey = req.body['new-sshkey'];
    let newSshKeys=newSshKey.trim().replace(/\n/g,"").split(" ").filter(s=>s!==" ");
    let changeSshKey=false;
    if(newSshKeys.length>=2){
        if(newSshKeys[0]!="ssh-rsa"){
            return res.status(400).send(`Your SSH Key is not start with "ssh-rsa"`);
        }
        if(!(/^[A-za-z0-9/+=]+$/i.test(newSshKeys[1]))){
            return res.status(400).send(`Your SSH Key is not valid.`);
        }
        newSshKey=newSshKeys[0]+" "+newSshKeys[1];
        if(req.user.ssh_key!=newSshKey){
            if( (await User.find({ssh_key: newSshKey})).length != 0 ){
                return res.status(403).send(`Please don't use the same SSH Key with others!`);
            }
            try{
                const userId=req.user.meta.id;
                const tmpPath=path.join(tmpDir,userId);
                await fs.writeFile(
                    tmpPath+".pub",
                    newSshKey+"\n",
                );
                await fs.copy(tmpPath+".pub",path.join(gitAdminDir,"keydir",userId+".pub"));
                try {
                    await fs.stat(path.join(gitRepoDir,userId+".git"));
                } catch(e) {
                    //throw new errors.io.FileNotFoundError(file);
                    await gitCpWrap(["-r",path.join(gitRepoDir,"init.git"),path.join(gitRepoDir,userId+".git")]);
                }
                const magic_str=randomString.generate(20)+userId;
                await fs.writeFile(
                    tmpPath+".key",
                    magic_str,
                );
                await gitCpWrap([tmpPath+".key",path.join(gitRepoDir,userId+".git","hooks","key")]);

                req.user.ssh_key=newSshKey;
                req.user.git_upload_key=magic_str;
                await req.user.save();
                changeSshKey=true;
            } catch(e) {
                return res.status(500).send(`Something bad happened... New SSH Key may not be saved.`);
            }
            //res.send(`SSH Key changed successfully.`);
        }
    }
    if(changePassword&&changeSshKey){
        res.send(`Password & SSH Key changed successfully.`);
    }else if(changePassword){
        res.send(`Password changed successfully.`);
    }else if(changeSshKey){
        res.send(`SSH Key changed successfully.`);
    }else{
        res.send(`Nothing changed.`);
    }
}));

export default router;
