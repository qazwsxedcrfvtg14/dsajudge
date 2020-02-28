import config from '/config';
import path from 'path';
import express from 'express';
import _ from 'lodash';
import wrap from 'express-async-wrap';
import Problem from '/model/problem';
import Submission from '/model/submission';
import User from '/model/user';
import {requireLogin,checkKey,checkProblem,requireKeyOrNotGit} from '/utils';
import fs from 'fs-extra';

const router = express.Router();

router.post('/:id', checkKey, checkProblem(), requireKeyOrNotGit, wrap(async (req, res) => {
    if(isNaN(req.params.id))return res.status(404).send(`id must be a number`);
    const user=req.user;
    const probId = parseInt(req.params.id);
    let problem;
    if (user && (user.isAdmin()||user.isTA()) )
        problem = await Problem.findOne({_id: probId});
    else
        problem = await Problem.findOne({_id: probId, visible: true});
    
	if (!problem){
        return res.status(500).send(`Problem #${req.params.id} not found.`);
    }
	if ( user.isAdmin()  || await user.checkQuota(probId) || user.isTA() ){
	//	console.log("admin or quota sufficient.");
	}else{
        return res.status(500).send(`Problem #${req.params.id} quota used up.`);
	}

    const submission = new Submission({
        problem: problem._id,
        submittedBy: user._id,
        status: 'pending',
        points: 0,
        gitCommitHash: req.body.gitHash
    });
    await submission.save();
    const subId = submission._id;
    await fs.writeFile(path.join(config.dirs.submissions, `${subId}.cpp`), req.body.file);

    res.send({
        id: subId,
    });
}));

export default router;
