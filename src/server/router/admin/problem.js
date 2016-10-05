import express from 'express';
import _ from 'lodash';
import wrap from 'express-async-wrap';
import Problem from '/model/problem';
import Submission from '/model/submission';
import {requireAdmin} from '/utils';
import targz from 'tar.gz';
import multer from 'multer';
import path from 'path';
import config from '/config';
import fs from 'fs-promise';
import {updateMeta} from './parseProblem';
import winston from 'winston';

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fieldsize: 100*1024*1024 }});

function checkGzip(req, res, next) {
    const file = req.file;
    if (!file) {
        return res.status(404).send(`Please upload a file`);
    }
    if (!file.mimetype.match(/application\/(x-)?gzip/)) {
        return res.status(404).send(`Please upload a gzip file, you uploaded ${file.mimetype}`);
    }
    next();
}

async function updateProblemByGzip(id, file) {
    try {
        await targz({}, {strip: 1}).extract(file.path, path.join(config.dirs.problems, id.toString()));
    } catch (e) {
        throw e;
    } finally {
        fs.unlink(file.path, () => {});
    }
}

router.get('/', wrap(async (req, res) => {
    let query = Problem.find();
    if (req.query) query.select(_.mapValues(req.query, parseInt));
    const problems = await query;
    res.send(problems);
}));

router.get('/:id', wrap(async (req, res) => {
    let problem = await Problem.findOne({_id: req.params.id});
    if (!problem) return res.status(404).send('Problem not found');

    problem = problem.toObject();

    let fl = await fs.readFile(
        path.join(config.dirs.problems, req.params.id, 'prob.md')
    );

    problem.desc = fl.toString();

    res.send(problem);
}));

// New problem
router.put('/',
    upload.single('problem-file'),
    checkGzip,
    wrap(async (req, res) => {
        const problem = new Problem();
        await problem.save();

        const id = problem._id;
        const file = req.file;

        try {
            await updateProblemByGzip(id, file);
            await updateMeta(problem._id, problem);
            await problem.save();
        } catch(e) {
            console.log(e);
            return res.status(500).send(e.toString());
        }
        await problem.save();

        return res.send({id: problem._id});
    }
));

router.put('/:id',
    upload.single('problem-file'),
    checkGzip,
    wrap(async (req, res) => {
        const problem = await Problem.findById(req.params.id);
        if (!problem) res.status(404).send(`Problem #${req.params.id} not found`);

        const id = problem._id;
        const file = req.file;

        try {
            await updateProblemByGzip(id, file);
            await updateMeta(problem._id, problem);
            await problem.save();
        } catch(e) {
            return res.status(500).send(e.toString());
        }
        await problem.save();

        return res.send(`Successfully update problem #${id}`);
    }
));

router.post('/:id/updateTests',
    wrap(async (req, res) => {
        const problem = await Problem.findById(req.params.id);
        if (!problem) res.status(404).send(`Problem #${req.params.id} not found`);

        const id = problem._id;
        const file = req.file;

        try {
            await updateMeta(problem._id, problem);
        } catch(e) {
            return res.status(500).send(e.toString());
        }
        await problem.save();

        return res.send(`Successfully update problem #${id}`);
    }
));

router.put('/:id/settings', wrap(async (req, res) => {
    const upd = req.body;
    if ('_id' in upd) _.remove(upd, '_id');
    if ('__v' in upd) _.remove(upd, '__v');
    let desc;
    if ('desc' in upd) {
        desc = upd.desc;
        _.remove(upd, 'desc');
    }

    const problem = await Problem.findOne({_id: req.params.id});
    if (!problem) return res.status(404).send('Problem not found');
    _.assignWith(problem, upd);

    problem.testdata.count = problem.testdata.points = 0;
    for (let grp of problem.testdata.groups) {
        grp.count = grp.tests.length;
        problem.testdata.count += grp.count;
        problem.testdata.points += grp.points;
    }

    problem.save();

    if (desc) {
        await fs.writeFile(
            path.join(config.dirs.problems, req.params.id, 'prob.md'),
            desc,
        );
    }

    res.send(`Successfully update problem #${req.params.id}!`);
}));

// Rejudge
router.post('/:id/rejudge', wrap(async (req, res) => {

    try {
        await Submission.update(
            {problem: req.params.id},
            {$set: {status: 'pending'}},
            {multi: true},
        );
    } catch (e) {
        winston.error(e);
    }

    res.send(`Successfully rejudge problem #${req.params.id}!`);
}));

export default router;
