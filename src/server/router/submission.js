import express from 'express';
import Submission from '/model/submission';
import wrap from 'express-async-wrap';
import _ from 'lodash';
import config from '/config';
import path from 'path';
import User from '/model/user';
import { requireLogin, requireKey } from '/utils';
import fs from 'fs-extra';
import Problem from '/model/problem';
import Result from '/model/result';

const router = express.Router();

router.get('/', requireLogin, wrap(async (req, res) => {
  const skip = parseInt(req.query.start) || 0;
  const isTA = req.user && (req.user.isAdmin() || req.user.isTA());
  const data = await Submission.aggregate([
    { $match: { submittedBy: req.user._id } },
    {
      $lookup: {
        from: Problem.collection.name,
        as: 'problem',
        let: { problem: '$problem' },
        pipeline: [
          {
            $match: isTA ? {
              $expr: {
                $eq: ['$$problem', '$_id']
              }
            } : {
              visible: true,
              $expr: {
                $eq: ['$$problem', '$_id']
              }
            }
          }, {
            $limit: 1
          }
        ]
      }
    },
    { $unwind: '$problem' },
    { $sort: { _id: -1 } },
    { $skip: skip * 15 },
    { $limit: 15 },
    {
      $project: {
        _id: 1,
        'problem._id': 1,
        'problem.name': 1,
        ts: 1,
        result: 1,
        runtime: 1,
        status: 1,
        points: 1
      }
    }
  ]);
  res.send(data);
  // console.log(skip);
}));

const MAX_COMPILE_LOG_LEN = 10000;
async function loadCompileErr (id) {
  try {
    const buf = await fs.readFile(path.join(config.dirs.submissions, `${id}.compile.err`));
    const str = buf.toString();
    // console.log(str.length);
    if (str.length > MAX_COMPILE_LOG_LEN) return str.slice(0, MAX_COMPILE_LOG_LEN) + '\n... [The remained was omitted]\n';
    return str;
  } catch (e) {
    return 'Compiler log unavailable.';
  }
}

async function loadSourceCode (id) {
  try {
    const buf = await fs.readFile(path.join(config.dirs.submissions, `${id}.cpp`));
    const str = buf.toString();
    return str;
  } catch (e) {
    return 'Source code unavailable.';
  }
}

router.get('/sourceCode/:id', requireLogin, wrap(async (req, res) => {
  if (isNaN(req.params.id)) return res.status(400).send('id must be a number');
  const id = req.params.id;
  const submission = await Submission.findById(id)
    .populate('problem', 'resource visible')
    ;

  if (!submission) return res.status(404).send(`Submission ${id} not found.`);
  if (!(req.user && (req.user.isAdmin() || req.user.isTA())) &&
        !((submission.submittedBy.equals(req.user._id) && submission.problem.visible && submission.problem.notGitOnly) || submission.problem.resource.includes('solution'))) {
    return res.status(403).send('Permission denided.');
  }
  const src = await loadSourceCode(id);
  res.send(src);
}));

router.get('/:id', requireLogin, wrap(async (req, res) => {
  if (isNaN(req.params.id)) return res.status(400).send('id must be a number');
  const isTA = req.user && (req.user.isAdmin() || req.user.isTA());

  const id = req.params.id;
  let submission;
  submission = await Submission.findById(id)
    .populate('problem', 'name testdata.points resource visible notGitOnly showDetailSubtask')
    .populate('submittedBy', (req.user.isAdmin() ? 'email meta' : 'meta'))
    .populate({
      path: '_result',
      populate: {
        path: 'subresults',
        select: '-_id -__v',
        populate: {
          path: 'subresults',
          select: '-_id -__v -subresults -maxPoints -points'
        }
      }
    });
  if (!submission) return res.status(404).send(`Submission ${id} not found.`);
  if (!(req.user.isAdmin() || req.user.isTA()) &&
        !((submission.submittedBy.equals(req.user._id) && submission.problem.visible) || submission.problem.resource.includes('solution'))) {
    return res.status(403).send('Permission denided.');
  }

  submission = submission.toObject();
  if (submission.result === 'CE') {
    submission.compilationLog = await loadCompileErr(submission._id);
  }
  if (submission._result && !req.user.isAdmin()) {
    for (const [gid, group] of submission._result.subresults.entries()) {
      for (const [tid, test] of group.subresults.entries()) {
        test.name = `${gid}-${tid}`;
      }
    }
  }
  if (!submission.problem.showDetailSubtask && !isTA) {
    for (const subresult of submission._result.subresults) {
      delete subresult.subresults;
    }
  }
  // console.log(JSON.stringify(submission, null, 4))

  res.send(submission);
}));

router.post('/get/last', requireKey, wrap(async (req, res) => {
  const isTA = req.user && (req.user.isAdmin() || req.user.isTA());
  let data = await Submission.aggregate([
    { $match: { submittedBy: req.user._id } },
    {
      $lookup: {
        from: Problem.collection.name,
        as: 'problem',
        let: { problem: '$problem' },
        pipeline: [
          {
            $match: isTA ? {
              $expr: {
                $eq: ['$$problem', '$_id']
              }
            } : {
              visible: true,
              $expr: {
                $eq: ['$$problem', '$_id']
              }
            }
          }, {
            $limit: 1
          }
        ]
      }
    },
    { $unwind: '$problem' },
    { $sort: { _id: -1 } },
    { $limit: 1 }
  ]);
  data = await Result.populate(data, {
    path: '_result',
    populate: {
      path: 'subresults',
      select: '-_id -__v',
      populate: {
        path: 'subresults',
        select: '-_id -__v -subresults -maxPoints -points'
      }
    }
  });
  res.send(data);
  if (data.length === 0) {
    res.send({});
  } else {
    // res.send(data[0]);
    res.send(data[0]);
  }
}));

router.post('/get/gitHash', requireKey, wrap(async (req, res) => {
  const user = req.user;
  const smallerHash = req.body.gitHash.toLowerCase();
  const biggerHash = smallerHash.substr(0, smallerHash.length - 1) + String.fromCharCode(smallerHash.charCodeAt(smallerHash.length - 1) + 1);
  const dataFirst = await Submission
    .find({
      submittedBy: user._id,
      gitCommitHash: {
        $gte: smallerHash,
        $lt: biggerHash
      }
    })
    .sort('-_id')
    .limit(1);
  if (dataFirst.length === 0) {
    res.send('Submission Not Found!');
    return;
  }

  const data = await Submission
    .find({
      submittedBy: user._id,
      gitCommitHash: dataFirst[0].gitCommitHash
    })
    .sort('-_id')
    .populate('problem', 'name testdata.points resource')
    .populate({
      path: '_result',
      populate: {
        path: 'subresults',
        select: '-_id -__v',
        populate: {
          path: 'subresults',
          select: '-_id -__v -subresults -maxPoints -points'
        }
      }
    });
  if (data.length === 0) {
    res.send('Submission Not Found!');
  } else {
    res.send(data);
  }
}));

export default router;
