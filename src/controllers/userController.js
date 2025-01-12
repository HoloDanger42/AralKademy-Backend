import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { log } from "../utils/logger.js";

const signup = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
    });

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
    log.info(`User ${username} was successfully created`);
  } catch (error) {
    log.error("Signup error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }
    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Error creating user" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Logged in successfully",
      token,
      user,
    });
    log.info(`User ${email} logged in successfully`);
  } catch (error) {
    log.error("Login error:", error);
    return res.status(500).json({ message: "Authentication failed" });
  }
};

const getAllUsers = async (_req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
    log.info("Retrieved all users");
  } catch (error) {
    log.error("Get all users error:", error);
    return res.status(500).json({ message: "Failed to retrieve users" });
  }
};

export { signup, login, getAllUsers };
