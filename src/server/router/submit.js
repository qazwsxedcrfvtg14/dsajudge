import config from '/config';
import path from 'path';
import express from 'express';
import _ from 'lodash';
import wrap from 'express-async-wrap';
import Problem from '/model/problem';
import Submission from '/model/submission';
import {requireLogin} from '/utils';
import fs from 'fs-promise';

const router = express.Router();

router.post('/:id', requireLogin, wrap(async (req, res) => {
    const probId = parseInt(req.params.id);
    let problem;
    if (req.user && req.user.isAdmin())
        problem = await Problem.findOne({_id: probId});
    else
        problem = await Problem.findOne({_id: probId, visible: true});
    
    console.log("Hell world");
	if (!problem){
        console.log("Hell worldww");
        return res.status(500).send(`Problem #${req.params.id} not found.`);
    }



    const submission = new Submission({
        problem: problem._id,
        submittedBy: req.user._id,
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
