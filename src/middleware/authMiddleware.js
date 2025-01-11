import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { log } from "../utils/logger.js";

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      log.warn("No token present");
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }
    const token = authHeader.split(" ")[1];

    // 2. Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Fetch user using id from decoded token
    const user = await User.findOne({ where: { email: decodedToken.email } });

    if (!user) {
      log.warn("User not found");
      return res.status(401).json({ message: "Unauthorized: Invalid Token" });
    }

    // 4. Attach user to the request
    req.user = user;

    // 5. Move to next middleware or route handler
    next();
  } catch (error) {
    log.error(error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token Expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Unauthorized: Invalid Token" });
    } else {
      return res
        .status(500)
        .json({ message: "Something went wrong during authentication" });
    }
  }
};

export { authMiddleware };
