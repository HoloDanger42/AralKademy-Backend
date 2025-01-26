import express from 'express';
import { getAllGroups, createGroup, assignStudentTeacherMembers, assignLearnerMembers } from '../controllers/groupController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const groupsRouter = express.Router();

groupsRouter.get('/', authMiddleware, getAllGroups);
groupsRouter.post('/', authMiddleware, createGroup);
groupsRouter.post('/assign-student-teachers', authMiddleware, assignStudentTeacherMembers);
groupsRouter.post('/assign-learners', authMiddleware, assignLearnerMembers);

export { groupsRouter };
