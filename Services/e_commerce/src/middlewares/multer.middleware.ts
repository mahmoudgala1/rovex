import multer from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/AppError';

//  Keep in memory (RAM) as a Buffer
const storage = multer.memoryStorage();

// Only allow images (jpeg, png, jpg, webp)
const multerFilter = (req: Request, file: Express.Multer.File, cb: any) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limit: 5MB per file
});