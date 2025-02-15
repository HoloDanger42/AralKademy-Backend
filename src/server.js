import express from 'express';
import dotenv from 'dotenv';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cache from 'memory-cache';
import paginate from 'express-paginate';
import cors from 'cors'; // Import is already correct
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Sequelize, DataTypes } from 'sequelize';
import fetch from 'node-fetch'; // Import is already correct

// Middleware
import { errorMiddleware, SpecificError } from './middleware/errorMiddleware.js';
import { logMiddleware } from './middleware/logMiddleware.js';
import { securityMiddleware } from './middleware/securityMiddleware.js';

// Configuration
import { databaseConnection } from './config/database.js';

// Routes
import { usersRouter } from './routes/users.js';
import { coursesRouter } from './routes/courses.js';

dotenv.config(); // Load environment variables *early* - This is good!

const app = express();

// --- CORS Configuration (Best Practice) ---  <-- Place CORS config *before* other middleware
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000']; // Add production domains later

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    optionsSuccessStatus: 200,
    credentials: true,
};

app.use(cors(corsOptions)); // Use the configured options
// --- End CORS Configuration ---


app.use(express.json());
app.use(compression());

// Rate limiting (This is good where it is)
const FIFTEEN_MINUTES = 15 * 60 * 1000;
const AUTH_MAX_REQUESTS = 5;
const applyRateLimiter = process.env.NODE_ENV !== 'test';

if (applyRateLimiter) {
    const limiter = rateLimit({
        windowMs: FIFTEEN_MINUTES,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);

    const authLimiter = rateLimit({
        windowMs: FIFTEEN_MINUTES,
        max: AUTH_MAX_REQUESTS,
        handler: (_req, res) => {
            res.status(429).json({ message: 'Too many authentication requests' });
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
     // authLimiter is being applied on the route itself
}


// Pagination middleware (Good where it is)
app.use(paginate.middleware(10, 50));

// Cache middleware (Good where it is)
const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        const key = `__express__${req.originalUrl || req.url}${JSON.stringify(req.body)}`;
        const cachedBody = cache.get(key);

        if (cachedBody) {
            res.send(cachedBody);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache.put(key, body, duration * 1000);
                }
                res.sendResponse(body);
            };
            next();
        }
    };
};

if (process.env.NODE_ENV !== 'test') {
    app.use('/courses', cacheMiddleware(300));
}


// Other Middleware (Good where it is)
app.use(logMiddleware);
securityMiddleware.forEach((middleware) => app.use(middleware));


// --- JWT Secret Check (Good where it is) ---
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
    process.exit(1);
}

// --- reCAPTCHA Secret Key Check (Put it here, near the JWT check) ---
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
if (!recaptchaSecretKey) {
    console.error("FATAL ERROR: RECAPTCHA_SECRET_KEY is not defined in .env file.");
    process.exit(1);
}

// --- Sequelize Setup (Good where it is) ---
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false,
});

// --- User Model (Good where it is) ---
const User = sequelize.define('User', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // Add other user fields
});

// --- Helper Function to Generate JWT (Good where it is) ---
function generateToken(user) {
    return jwt.sign({ id: user.id, email: user.email }, jwtSecret, { expiresIn: '1h' });
}

// --- Authentication Endpoints (Good where they are) ---

app.post('/api/login', async (req, res) => { // authLimiter applied
    try {
        const { email, password, captchaResponse } = req.body;

        // --- reCAPTCHA Verification (Correct placement) ---
        if (!captchaResponse) {
            return res.status(400).json({ message: 'CAPTCHA response is required' });
        }

        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${captchaResponse}`;
        const verifyResponse = await fetch(verifyUrl, { method: 'POST' });
        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            console.error("reCAPTCHA verification failed:", verifyData);
            return res.status(400).json({ message: 'CAPTCHA verification failed' });
        }
        // --- End reCAPTCHA Verification ---

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.status(200).json({ token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/signup', async (req, res) => { // authLimiter applied
    try {
        const { email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            email,
            password: hashedPassword
        });

        const token = generateToken(newUser);
        res.status(201).json({ token });

    } catch (error) {
        console.error("Signup error:", error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Protected Route Example (Good where it is)
app.get('/api/protected', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        res.status(200).json({ message: 'Protected route accessed!', user: req.user });
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// --- Your other routes ---
app.get('/', (_req, res) => {
    res.send('API is running');
});

app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);

app.get('/error', (_req, _res, next) => {
    next(new Error('Intentional error for testing'));
});

// 404 Handler (Good where it is)
app.use((_req, _res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(errorMiddleware);


// --- Start Server (Good where it is) ---
const startServer = async () => {
    try {
        // await databaseConnection(); // Use your connection if needed.
        await sequelize.sync(); // Sync models.
        if (process.env.NODE_ENV !== 'test') {
            const PORT = process.env.PORT || 3001;
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        }
    } catch (error) {
        console.error('Failed to start server:', error);
        if (error.code === 'ECONNREFUSED') {
            console.error('Database connection refused. Check configuration.');
        }
        process.exit(1);
    }
};

startServer();

export default app;