import express from 'express';
import dotenv from 'dotenv';

import { DbConnection } from './DataBase/dbConnection.js';
import userRouter from './src/modules/user/user.router.js';
import { productRouter } from './src/modules/product/product.router.js';
import { cartRouter } from './src/modules/cart/cart.router.js';
import { wishlistRouter } from './src/modules/wishlist/wishlist.router.js';
import paymentRouter from './src/modules/payment/payment.router.js';
import { orderRouter } from './src/modules/order/order.router.js';
import cors from 'cors'
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Database connection
DbConnection();

// Middleware
app.use(cors())
app.use(express.json());

// Routes
app.use('/users', userRouter);
app.use('/products', productRouter);
app.use('/carts', cartRouter);
app.use('/wishlist', wishlistRouter);
app.use('/payment', paymentRouter);
app.use('/orders',orderRouter)

app.get('/', (req, res) => {
    res.send('Welcome to the API');
});

// Error handling middleware (optional)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => console.log(`Server is running on port ${port}!`));
