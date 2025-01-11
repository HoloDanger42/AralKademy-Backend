import express from "express";
import { signup, login, getAllUsers } from "../controllers/userController";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/users", getAllUsers);

export default router;
