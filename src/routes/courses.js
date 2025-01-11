import express from "express";
import { getAllCourses, createCourse } from "../controllers/courseController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", authMiddleware, getAllCourses);
router.post("/", authMiddleware, createCourse);

export default router;
