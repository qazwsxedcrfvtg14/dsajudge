import express from 'express';
import _ from 'lodash';
import wrap from 'express-async-wrap';
import Problem from '/model/problem';
import Submission from '/model/submission';
import {requireAdmin} from '/utils';
import tar from 'tar';
import multer from 'multer';
import path from 'path';
import config from '/config';
import fs from 'fs-extra';
import {updateMeta} from './parseProblem';
import logger from '/logger';

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fieldsize: 100*1024*1024 }});

function checkGzip(req, res, next) {
    const file = req.file;
    if (!file) {
        return res.status(404).send(`Please upload a file`);
    }
    next();
}

async function mkdir777(dir) {
    await fs.mkdir(dir);
    await fs.chmod(dir, 0o777);
}

async function updateProblemByGzip(id, file) {
    const destDir = path.join(config.dirs.problems, `${id}`);
    try {
        // remove the directory and create a new one
        await fs.remove(destDir);
        await fs.mkdir(destDir);
        // extract the archive to destination directory
        await tar.extract({gzip: true, cwd: destDir, file: file.path, strip: 1});
    } catch (e) {
        throw e;
    } finally {
        await fs.unlink(file.path, () => {});
    }
}

router.get('/', wrap(async (req, res) => {
    let query = Problem.find().sort("_id");
    if (req.query) query.select(_.mapValues(req.query, parseInt));
    const problems = await query;
    res.send(problems);
}));

router.get('/:id', wrap(async (req, res) => {
    if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);
    let problem = await Problem.findOne({_id: req.params.id});
    if (!problem) return res.status(404).send('Problem not found');

    problem = problem.toObject();

    try {
        let fl = await fs.readFile(
            path.join(config.dirs.problems, req.params.id, 'prob.md')
        );
    
        problem.desc = fl.toString();
    
    } catch(e) {
        problem.desc = "";
    }
    
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
        } catch(e) {
            logger.error(e);
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
        if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);
        const problem = await Problem.findById(req.params.id);
        if (!problem) res.status(404).send(`Problem #${req.params.id} not found`);

        const id = problem._id;
        const file = req.file;

        try {
            await updateProblemByGzip(id, file);
            await updateMeta(problem._id, problem);
            await problem.save();
        } catch(e) {
            logger.error(e);
            return res.status(500).send(e.toString());
        }
        await problem.save();

        return res.send(`Successfully update problem #${id}`);
    }
));

router.post('/:id/updateTests',
    wrap(async (req, res) => {
        if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);
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
    if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);
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

    await problem.save();

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
    if(isNaN(req.params.id))return res.status(400).send(`id must be a number`);
    try {
        await Submission.update(
            {problem: req.params.id},
            {$set: {status: 'pending'}},
            {multi: true},
        );
    } catch (e) {
        logger.error(e);
    }

    res.send(`Successfully rejudge problem #${req.params.id}!`);
}));

export default router;
