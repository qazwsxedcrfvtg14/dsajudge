import express from 'express';
import Submission from '/schema/submission';
import wrap from 'express-async-wrap';
import _ from 'lodash';
import config from '/config';
import path from 'path';
import {requireLogin} from '/utils';

const router = express.Router();

router.get('/all', requireLogin, wrap(async (req, res) => {
    const skip = req.body.skip || 0;
    const data = await Submission
        .find({submittedBy: req.user._id})
        .limit(10).skip(skip)
        .populate('problem', 'name');
    res.send(data);
}));

router.get('/:id', requireLogin, wrap(async (req, res) => {

    const id = req.params.id;
    let submission;
    submission = await Submission.findById(id).populate('problem', 'name').populate('submittedBy', 'email');


    if (!submission) return res.status(404).send(`Submission ${id} not found.`);
    if (!submission.submittedBy.equals(req.user._id)) return res.status(403).send(`Permission denided.`);

    submission = submission.toObject();
    submission.result = (submission.status !== 'finished' ? submission.status : submission.results.result);

    res.send(submission);
}));

export default router;
