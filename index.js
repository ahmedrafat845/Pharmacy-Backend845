import { DbConnection } from './DataBase/dbConnection.js';
import userRouter from './src/modules/user/user.router.js';
import { productRouter } from './src/modules/product/product.router.js';
import { cartRouter } from './src/modules/cart/cart.router.js';
import { wishlistRouter } from './src/modules/wishlist/wishlist.router.js';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import paymentRouter from './src/modules/payment/payment.router.js';

dotenv.config();
const app = express();
DbConnection();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/users', userRouter);
app.use('/products', productRouter);
app.use('/carts', cartRouter);
app.use('/wishlist', wishlistRouter);
app.use('/payment', paymentRouter);

app.get('/', (req, res) => {
    res.send('Welcome to the API');
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
