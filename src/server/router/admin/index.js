import express from 'express';
import {requireAdmin} from '/utils';
import Problem from './problem';
import Submission from './submission';
import Homework from './homework';

const router = express.Router();

router.use('/', requireAdmin);
router.use('/problem', Problem);
router.use('/submission', Submission);
router.use('/homework', Homework);

export default router;
