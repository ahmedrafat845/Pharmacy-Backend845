import mongoose from "mongoose";

export const DbConnection = () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ahmedrafat12:ahmedrafat12345@cluster0.mnfstos.mongodb.net/Pharmacy';
    console.log('Connecting to MongoDB with URI:', mongoUri); // Log the URI for debugging
    
    mongoose.connect(mongoUri)
    .then(() => {
        console.log('Database Connected Successfully');
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error.message);
    });
};
