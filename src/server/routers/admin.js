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

router.post('/newProblem', upload.single('problem-file'), wrap(async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(404).send(`Please upload a file`);
    }
    if (file.mimetype != 'application/gzip') {
        return res.status(404).send(`Please upload a gzip file, you uploaded ${file.mimetype}`);
    }
    const problem = new Problem();
    problem._id = await Problem.count();
    problem.save();

    try {
        await targz({}, {strip: 1}).extract(file.path, path.join(config.dirs.problems, problem._id.toString()));
    } catch (e) {
        return res.status(404).send(e.toString());
    } finally {
        fs.unlink(file.path, () => {});
    }

    try {
        await updateMeta(problem._id, problem);
        await problem.save();
    } catch(e) {
        console.log(e);
    }
    await problem.save();

    res.send({id: problem._id});
}));

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
