// Initialize Express
import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorMiddleware } from "./middleware/errorMiddleware";
import { logMiddleware } from "./middleware/logMiddleware";
import { databaseConnection } from "./config/database";
import userRouter from "./routes/users";
import courseRouter from "./routes/courses";

dotenv.config();

const app = express();
app.use(cors());
app.use(json());
app.use(logMiddleware);

app.get("/", (_req, res) => {
  res.send("API is running");
});

app.use("/users", userRouter);
app.use("/courses", courseRouter);

app.use(errorMiddleware);

databaseConnection();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
