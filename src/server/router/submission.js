import express from 'express';
import Submission from '/model/submission';
import wrap from 'express-async-wrap';
import _ from 'lodash';
import config from '/config';
import path from 'path';
import User from '/model/user';
import {requireLogin,requireKey} from '/utils';
import fs from 'fs-extra';

const router = express.Router();

router.get('/', requireLogin, wrap(async (req, res) => {
    const skip = parseInt(req.query.start) || 0;

    //console.log(skip);
    const data = await Submission
        .find({submittedBy: req.user._id})
        .sort('-_id')
        .limit(15).skip(skip*15)
        .populate('problem', 'name')
    ;
    res.send(data);
}));

const MAX_COMPILE_LOG_LEN = 10000;
async function loadCompileErr(id) {
    try {
        const buf = await fs.readFile(path.join(config.dirs.submissions, `${id}.compile.err`));
        const str = buf.toString();
        //console.log(str.length);
        if (str.length > MAX_COMPILE_LOG_LEN) return str.slice(0, MAX_COMPILE_LOG_LEN) + '\n... [The remained was omitted]\n';
        return str;
    } catch(e) {
        return 'Compiler log unavailable.';
    }
}

async function loadSourceCode(id) {
    try {
        const buf = await fs.readFile(path.join(config.dirs.submissions, `${id}.cpp`));
        const str = buf.toString();
        return str;
    } catch(e) {
        return 'Source code unavailable.';
    }
}

router.get('/sourceCode/:id', requireLogin, wrap(async (req, res) => {
    const id = req.params.id;
    const submission = await Submission.findById(id)
        .populate('problem', 'resource')
    ;


    if (!submission) return res.status(404).send(`Submission ${id} not found.`);
    if (!(req.user && req.user.isAdmin()) && 
        !(submission.submittedBy.equals(req.user._id) || submission.problem.resource.includes('solution'))) { 
        return res.status(403).send(`Permission denided.`);
    }
    const src = await loadSourceCode(id);
    res.send(src);
}));

router.get('/:id', requireLogin, wrap(async (req, res) => {

    const id = req.params.id;
    let submission;
    submission = await Submission.findById(id)
        .populate('problem', 'name testdata.points resource')
        .populate('submittedBy', (req.user.isAdmin() ? 'email meta' : 'meta'))
        .populate({
            path: '_result',
            populate: {
                path: 'subresults',
                populate: {
                    path: 'subresults',
                },
            },
        })
    ;

    if (!submission) return res.status(404).send(`Submission ${id} not found.`);
    if (!req.user.isAdmin() && 
        !(submission.submittedBy.equals(req.user._id) || submission.problem.resource.includes('solution'))) {
        return res.status(403).send(`Permission denided.`);
    }

    submission = submission.toObject();
    if (submission.result === 'CE') {
        submission.compilationLog = await loadCompileErr(submission._id);
    }

    if (submission._result && !req.user.isAdmin()) {
        for (let [gid, group] of submission._result.subresults.entries()) {
            for (let [tid, test] of group.subresults.entries()) {
                test.name = `${gid}-${tid}`;
            }
        }
    }
    //console.log(JSON.stringify(submission, null, 4))

    res.send(submission);
}));

router.post('/last/', requireKey, wrap(async (req, res) => {
    let user;
    if(req.user)user=req.user;
    else user=await User.findOne({git_upload_key: req.body.key});
    if (!user) {
        return res.status(403).send("User not found!");
    }
    const data = await Submission
        .find({submittedBy: user._id})
        .sort('-_id')
        .limit(1)
        .populate('problem', 'name testdata.points resource')
        .populate({
            path: '_result',
            populate: {
                path: 'subresults',
                populate: {
                    path: 'subresults',
                },
            },
        });
    if(data.length==0)
        res.send({});
    else{
        //res.send(data[0]);
        res.send(data[0]);
    }
}));

export default router;
