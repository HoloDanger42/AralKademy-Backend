import { Course } from "../models/Course.js";
import { log } from "../utils/logger.js";

const getAllCourses = async (_req, res) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json(courses);
    log.info("Retrieved all courses");
  } catch (error) {
    log.error("Get all courses error:", error);
    return res.status(500).json({ message: "Failed to retrieve courses" });
  }
};

const createCourse = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCourse = await Course.create({ name, description });
    res.status(201).json({
      message: "Course created successfully",
      course: newCourse,
    });
    log.info(`Course ${name} was successfully created`);
  } catch (error) {
    log.error("Create course error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Course name already exists",
      });
    }
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error creating course" });
  }
};
export { getAllCourses, createCourse };
