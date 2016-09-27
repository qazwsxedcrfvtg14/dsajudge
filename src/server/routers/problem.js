import express from 'express';
import Problem from '/schema/problem';
import wrap from 'express-async-wrap';
import _ from 'lodash';
import fs from 'fs';
import bluebird from 'bluebird';
import config from '/config';
import path from 'path';

const router = express.Router();

router.get('/all', wrap(async (req, res) => {
    const data = await Problem.find({visible: true});
    res.send(data);
}));

router.get('/:id', wrap(async (req, res) => {
    const id = parseInt(req.params.id);
    let problem;
    if (req.user && _.includes(req.user.roles, 'admin'))
        problem = await Problem.findOne({_id: id});
    else
        problem = await Problem.findOne({_id: id, visible: true});

    if (!problem) {
        return res.sendStatus(404);
    }

    problem = problem.toObject();

    let fl = await bluebird.promisify(fs.readFile)(
        path.join(config.dirs.problems, req.params.id, 'prob.md'));

    problem.desc = fl.toString();

    res.send(problem);
}));

export default router;
