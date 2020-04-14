import express from 'express';
import Problem from '/model/problem';
import wrap from 'express-async-wrap';
import _ from 'lodash';
import fs from 'fs-extra';
import config from '/config';
import path from 'path';
import ProblemResult from '/model/problemResult';
import { checkProblem } from '/utils';

const router = express.Router();

router.get('/', wrap(async (req, res) => {
  const isTA = req.user && (req.user.isAdmin() || req.user.isTA());
  let data = await Problem.find(isTA ? {} : { visible: true }).sort('_id');
  data = await Promise.all(data.map(_prob => (async () => {
    const prob = _prob.toObject();
    const pr = req.user
      ? await ProblemResult.findOne({
        user: req.user,
        problem: prob._id
      })
      : null;
    if (pr) {
      prob.userRes = {
        AC: pr.AC,
        points: pr.points
      };
    } else {
      prob.userRes = {
        AC: false,
        points: 0
      };
    }
    return prob;
  })()));
  res.send(data);
}));

router.get('/:id', wrap(async (req, res) => {
  if (isNaN(req.params.id)) return res.status(400).send('id must be a number');
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.sendStatus(404);
  let problem;
  if (req.user && (req.user.isAdmin() || req.user.isTA())) { problem = await Problem.findOne({ _id: id }); } else { problem = await Problem.findOne({ _id: id, visible: true }); }

  if (!problem) {
    return res.sendStatus(404);
  }

  problem = problem.toObject();

  try {
    const fl = await fs.readFile(
      path.join(config.dirs.problems, req.params.id, 'prob.md')
    );

    problem.desc = fl.toString();
  } catch (e) {
    problem.desc = '';
  }

  res.send(problem);
}));

router.get('/:id/assets/:path',
  checkProblem(),
  wrap(async (req, res) => {
    if (isNaN(req.params.id)) return res.status(400).send('id must be a number');

    const pathname = req.params.path;
    if (!pathname || !pathname.match(/^[A-Za-z.0-9]+$/)) { return res.sendStatus(404); }

    const filepath = path.join(config.dirs.problems, `${req.params.id}`, 'assets', pathname);
    try {
      await fs.access(filepath, fs.constants.R_OK);
    } catch (e) {
      return res.sendStatus(404);
    }

    res.sendFile(filepath);
  }));

export default router;
