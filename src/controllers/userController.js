import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { log } from "../utils/logger.js";

const signup = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database using Sequelize
    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
    });

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
    log.info("User was successfully created");
  } catch (error) {
    log.error(error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({
        message:
          "That username or email already exists in our system, please try something else",
      });
    } else if (error.name === "SequelizeValidationError") {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Error creating user" });
    }
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res
      .status(200)
      .json({ message: "Logged in successfully", token: token, user: user });
    log.info("User logged in successfully");
  } catch (error) {
    log.error(`Login Error: ${error.message}`);
    res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

const getAllUsers = async (_req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json(users);
    log.info("Successfully retrieved all users");
  } catch (error) {
    log.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export { signup, login, getAllUsers };
