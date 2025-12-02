<<<<<<< HEAD
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { log } from '../utils/logger.js'

// Derice __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define the base upload directory relative to the project root
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

// Ensure the base upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  log.info(`Created upload directory at ${UPLOAD_DIR}`)
}

// Storage configuration (disk storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = UPLOAD_DIR
    cb(null, destPath)
  },
  filename: function (req, file, cb) {
    // Create a unique filename: timestamp-originalfilename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'))
  },
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (allowedMimes.includs(file.mimetype)) {
    cb(null, true) // Accept file
  } else {
    log.warn(`Rejected file upload: ${file.originalname} with mimetype ${file.mimetype}`)
    cb(new Error('Invalid file type'), false) // Reject file
  }
}

// Multer instance with configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size limit
  },
  fileFilter: fileFilter,
})

export default upload
=======
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { log } from '../utils/logger.js'

// Derice __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define the base upload directory relative to the project root
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

// Ensure the base upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  log.info(`Created upload directory at ${UPLOAD_DIR}`)
}

// Storage configuration (disk storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const destPath = UPLOAD_DIR
    cb(null, destPath)
  },
  filename: function (req, file, cb) {
    // Create a unique filename: timestamp-originalfilename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'))
  },
})

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (allowedMimes.includs(file.mimetype)) {
    cb(null, true) // Accept file
  } else {
    log.warn(`Rejected file upload: ${file.originalname} with mimetype ${file.mimetype}`)
    cb(new Error('Invalid file type'), false) // Reject file
  }
}

// Multer instance with configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size limit
  },
  fileFilter: fileFilter,
})

export default upload
>>>>>>> 627466f638de697919d077ca56524377d406840d
