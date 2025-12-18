import mongoose from 'mongoose';

import dotenv from 'dotenv'
dotenv.config();

export const connectDB = async (): Promise<void> => {
    try {
        console.log(process.env.MongooDBURL)
        if (!process.env.MongooDBURL) {
            throw new Error('MONGO_URI is missing in .env file');
        }

       
        const conn = await mongoose.connect(process.env.MongooDBURL);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
    } catch (error) {
       
        console.error('MongoDB Connection Error:', error);
        process.exit(1); 
    }
};