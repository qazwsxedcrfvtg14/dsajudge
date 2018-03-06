import config from '/config';
import path from 'path';
import express from 'express';
import _ from 'lodash';
import wrap from 'express-async-wrap';
import Problem from '/model/problem';
import Submission from '/model/submission';
import User from '/model/user';
import {requireLogin,requireKey} from '/utils';
import fs from 'fs-extra';

const router = express.Router();

router.post('/:id', requireKey, wrap(async (req, res) => {
    let user;
    if(req.user)user=req.user;
    else user=await User.findOne({git_upload_key: req.body.key});
    if (!user) {
        return res.status(403).send("User not found!");
    }
    const probId = parseInt(req.params.id);
    let problem;
    if (user && user.isAdmin())
        problem = await Problem.findOne({_id: probId});
    else
        problem = await Problem.findOne({_id: probId, visible: true});
    
	if (!problem){
        return res.status(500).send(`Problem #${req.params.id} not found.`);
    }
	if (user.isAdmin() || await user.checkQuota(probId)){
	//	console.log("admin or quota sufficient.");
	}else{
        return res.status(500).send(`Problem #${req.params.id} quota used up.`);
	}

    const submission = new Submission({
        problem: problem._id,
        submittedBy: user._id,
        status: 'pending',
        points: 0,
    });
    await submission.save();
    const subId = submission._id;
    await fs.writeFile(path.join(config.dirs.submissions, `${subId}.cpp`), req.body.file);

    res.send({
        id: subId,
    });
}));

export default router;
