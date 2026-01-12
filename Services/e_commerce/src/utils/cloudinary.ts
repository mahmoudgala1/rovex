import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

//Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

//Upload Buffer to Cloudinary
export const uploadToCloudinary = (buffer: Buffer, folderName: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderName,     
            },
            (error, result) => {
                if (error) return reject(error);
                if (result) resolve(result.secure_url);
            }
        );
        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};