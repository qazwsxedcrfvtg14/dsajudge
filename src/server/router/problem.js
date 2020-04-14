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
  const data = await Problem.aggregate([
    { $match: isTA ? {} : { visible: true } },
    {
      $lookup: {
        from: 'problemresults',
        as: 'userRes',
        let: { id: '$_id' },
        pipeline: [
          {
            $match: {
              user: req.user,
              $expr: {
                $eq: ['$$id', '$problem']
              }
            }
          }, {
            $limit: 1
          }
        ]
      }
    },
    {
      $unwind: {
        path: '$userRes',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $addFields: {
        userRes: { $ifNull: ['$userRes', { AC: false, points: 0 }] }
      }
    },
    {
      $project: {
        _id: 1,
        'userRes.AC': 1,
        'userRes.points': 1,
        quota: 1,
        name: 1,
        visible: 1
      }
    }
  ]);

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
