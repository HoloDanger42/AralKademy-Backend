// userController.js
import { log } from '../utils/logger.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
//---
import UserService from '../services/userService.js'
import {
  User,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  School,
} from '../models/index.js'

const userService = new UserService(
  User,
  Teacher,
  Admin,
  StudentTeacher,
  Learner,
  Enrollment,
  Course,
  Group,
  School
)

//login function
const login = async (req, res) => {
  try {
      const { email, password, captchaResponse } = req.body;

      if (!captchaResponse) {
          return res.status(400).json({ message: 'CAPTCHA response is required' });
      }

      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`;
      const verifyResponse = await fetch(verifyUrl, { method: 'POST' });
      const verifyData = await verifyResponse.json();

      console.log("reCAPTCHA Verification Data:", verifyData);

      if (!verifyData.success) {
          console.error("reCAPTCHA verification failed:", verifyData);
          return res.status(400).json({ message: 'CAPTCHA verification failed' });
      }

      const { user, token } = await userService.loginUser(email, password);

      res.status(200).json({
          message: 'Logged in successfully',
          token,
          user,
      });
      log.info(`User ${email} logged in successfully`);
  } catch (error) {
      log.error('Login error:', error);
      if (error.message === 'Invalid credentials') {
          return res.status(401).json({ message: 'Invalid credentials' });
      }
      return res.status(500).json({ message: 'Authentication failed' });
  }
};
//----

const createUser = async (req, res) => {
    console.log('Create user request:', req.body);
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            birth_date,
            contact_no,
            school_id,
            role,
            middle_initial,
        } = req.body;

        const user = await userService.createUser(
            email,
            password,
            first_name,
            last_name,
            birth_date,
            contact_no,
            school_id,
            role,
            middle_initial,
        );

        res.status(201).json({
            message: 'User created successfully',
            user,
        });
        log.info(`User ${email} created successfully`);
    } catch (error) {
        log.error('Create user error:', error);
        console.error(error);
         if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ errors: error.errors });
        }
        if (error.message === 'Email already exists') {
            return res.status(400).json({ message: error.message });
        }

        return res.status(500).json({ message: 'Failed to create user' });
    }
};


const getAllUsers = async (_req, res) => {
  try {
        const users = await userService.getAllUsers()
        const usersWithoutPassword = users.rows.map(user => {
            const {
                password,
                ...userWithoutPassword
            } = user.get({
                plain: true
            }); // Convert to plain object
            return userWithoutPassword;
        });

        // Send the modified user data
        res.status(200).json({
            count: users.count,
            users: usersWithoutPassword
        });
        log.info('Retrieved all users');
    } catch (error) {
        log.error('Get all users error:', error)
        return res.status(500).json({
            message: 'Failed to retrieve users'
        })
    }
}

const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await userService.getUserById(id)
    res.status(200).json(user)
  } catch (error) {
    log.error('Get user by ID error:', error)
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.status(500).json({ message: 'Failed to retrieve user' })
  }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await userService.deleteUser(id);

        if (success) {
            res.status(200).json({ message: 'User deleted successfully' });
             log.info(`User with ID ${id} deleted`);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        log.error('Delete user error:', error);
         if (error.message === 'User not found') {
                return res.status(404).json({ message: 'User not found' });
            }
        res.status(500).json({ message: 'Failed to delete user' });
    }
};

export { login, createUser, getAllUsers, getUserById, deleteUser }; 