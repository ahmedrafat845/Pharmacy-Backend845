import mongoose from "mongoose";

export const DbConnection = () => {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
            console.log('Database Connected Successfully');
        })
        .catch((error) => {
            console.error('Error connecting to the database:', error.message);
        });
};
