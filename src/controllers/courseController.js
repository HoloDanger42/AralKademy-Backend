import { Course } from "../models/Course";
import { log } from "../utils/logger";

const getAllCourses = async (_req, res) => {
  try {
    const courses = await Course.findAll();
    res.status(200).json(courses);
  } catch (error) {
    log.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const createCourse = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCourse = await Course.create({ name, description });
    res
      .status(201)
      .json({ message: "Course created successfully", course: newCourse });
    log.info("Created a course");
  } catch (error) {
    log.error(error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({
        message:
          "That course name already exists in our system, please try something else",
      });
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error creating course" });
    }
  }
};
export { getAllCourses, createCourse };
