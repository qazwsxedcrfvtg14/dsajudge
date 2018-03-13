import express from 'express';
import Submission from '/model/submission';
import User from '/model/user';
import Problem from '/model/problem';
import wrap from 'express-async-wrap';
import _ from 'lodash';
import config from '/config';
import path from 'path';
import {requireLogin} from '/utils';
import fs from 'fs-extra';

const router = express.Router();

router.get('/', wrap(async (req, res) => {
    const skipPage = parseInt(req.query.skipPage) || 0;

    let query = Submission.find()
        .sort('-_id')
        .limit(15).skip(skipPage*15)
    ;
    if (req.query.result && req.query.result !== 'ALL') 
        query = query.where('result').equals(req.query.result);

    if (req.query.user) {
        const user = await User.find({'$or': [
            { 'meta.name': {$regex: req.query.user} },
            { 'meta.id': req.query.user },
            { 'email': req.query.user },
        ]});
        if (user.length)
            query = query.where('submittedBy').in(user);
        else return res.send([]);
    }

    if (req.query.probID) {
        let pid = parseInt(req.query.probID);
        if (_.isNaN(pid)) pid = -1;
        const problem = await Problem.find({'$or': [
            { 'name': {$regex: req.query.probID} },
            { '_id': pid },
        ]});
        if (problem.length)
            query = query.where('problem').in(problem);
        else return res.send([]);
    }
    const data = await query.populate('submittedBy', 'email meta').populate('problem', 'name').exec();
    res.send(data || []);
}));

router.get('/:id/rejudge', wrap(async (req, res) => {
    if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);

    let sub = await Submission.findById(req.params.id);
    if (!sub) return res.status(404).send(`Submission #${req.params.id} not found`);

    sub.status = 'pending';
    await sub.save();

    res.send(`Submission #${req.params.id} rejudged.`);
}));
//router.get('/all', requireLogin, wrap(async (req, res) => {
    //const skip = parseInt(req.query.start) || 0;

    //const data = await Submission
        //.find({submittedBy: req.user._id})
        //.sort('-_id')
        //.limit(15).skip(skip*15)
        //.populate('problem', 'name')
    //;
    //res.send(data);
//}));

const MAX_COMPILE_LOG_LEN = 10000;
async function loadCompileErr(id) {
    try {
        const buf = await fs.readFile(path.join(config.dirs.submissions, `${id}.compile.err`));
        const str = buf.toString();
        if (str.length > MAX_COMPILE_LOG_LEN) return str.slice(0, MAX_COMPILE_LOG_LEN) + '\n... [The remaining part is omitted]\n';
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
    if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);
    const id = req.params.id;
    const submission = await Submission.findById(id);
    if (!submission) return res.status(404).send(`Submission ${id} not found.`);
    if (!submission.submittedBy.equals(req.user._id)) 
        return res.status(403).send(`Permission denided.`);
    const src = await loadSourceCode(id);
    res.send(src);
}));

router.get('/:id', requireLogin, wrap(async (req, res) => {
    if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);

    const id = req.params.id;
    let submission;
    submission = await Submission.findById(id)
        .populate('problem', 'name testdata.points')
        .populate('submittedBy', 'email')
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
    if (!submission.submittedBy.equals(req.user._id)) return res.status(403).send(`Permission denided.`);

    submission = submission.toObject();
    if (submission.result === 'CE') {
        submission.compilationLog = await loadCompileErr(submission._id);
    }

    res.send(submission);
}));

export default router;
