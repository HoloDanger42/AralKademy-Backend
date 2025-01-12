// 1. External dependencies
import express, { json } from "express";
import cors from "cors";
import dotenv from "dotenv";

// 2. Middleware
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import { logMiddleware } from "./middleware/logMiddleware.js";

// 3. Configuration
import { databaseConnection } from "./config/database.js";

// 4. Routes
import userRouter from "./routes/users.js";
import courseRouter from "./routes/courses.js";

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

// Start server after database connection
const startServer = async () => {
  try {
    await databaseConnection();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export default app;
