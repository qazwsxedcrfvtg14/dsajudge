import express from 'express';
import _ from 'lodash';
import wrap from 'express-async-wrap';
import Problem from '/schema/problem';
import {requireAdmin} from '/utils';
import targz from 'tar.gz';
import multer from 'multer';
import path from 'path';
import config from '/config';
import fs from 'fs';
import {updateMeta} from '/parseProblem';
import winston from 'winston';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.use('/', requireAdmin);

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

router.post('/newProblem',
    upload.single('problem-file'),
    checkGzip,
    wrap(async (req, res) => {
        const problem = new Problem();
        console.log(problem._id);
        await problem.save();
        console.log(problem._id);

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

router.get('/problems', wrap(async (req, res) => {
    const problems = await Problem.find({});
    res.send(problems);
}));

router.get('/problem/:id', wrap(async (req, res) => {
    const problem = await Problem.findOne({_id: req.params.id});
    if (!problem) return res.status(404).send('Problem not found');
    res.send(problem);
}));

router.put('/problem/:id/settings', wrap(async (req, res) => {
    const upd = req.body;
    if ('_id' in upd) _.remove(upd, '_id');
    if ('__v' in upd) _.remove(upd, '__v');

    const problem = await Problem.findOne({_id: req.params.id});
    if (!problem) return res.status(404).send('Problem not found');
    _.assignWith(problem, upd);
    problem.save();

    res.send(`Successfully update problem #${req.params.id}!`);
}));

export default router;
