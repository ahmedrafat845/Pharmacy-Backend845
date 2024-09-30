import mongoose from "mongoose";

export const DbConnection = () => {
    console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI); // Log the URI
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('Database Connected Successfully');
        })
        .catch((error) => {
            console.error('Error connecting to the database:', error.message);
        });
};
