import axios from 'axios';
import { userModel } from '../../../DataBase/models/user.model.js';
import { orderModel } from '../../../DataBase/models/order.model.js';
import { productModel } from '../../../DataBase/models/product.model.js';

// Function to authenticate with Paymob
export const authenticatePaymob = async (req, res) => {
    if (!process.env.PAYMOB_API_KEY) {
        return res.status(500).json({ success: false, error: 'Missing configuration' });
    }

    try {
        const authResponse = await axios.post('https://accept.paymobsolutions.com/api/auth/tokens', {
            api_key: process.env.PAYMOB_API_KEY,
        });
        const { token } = authResponse.data;
        res.status(200).json({ success: true, token });
    } catch (error) {
        console.error('Error in Paymob authentication:', error.response ? error.response.data : error);
        res.status(500).json({ success: false, error: 'Authentication failed' });
    }
};

export const createPayment = async (req, res) => {
    const { userId, items, paymentMethod } = req.body;

    if (!userId || !items || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!process.env.PAYMOB_API_KEY || !process.env.PAYMOB_INTEGRATION_ID) {
        return res.status(500).json({ error: 'Missing configurations' });
    }

    try {

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let totalPrice = 0;
        const availableItems = [];

        for (const item of items) {
            const product = await productModel.findOne({ name: item.productName });
            if (!product || product.quantity < item.quantity) {
                return res.status(400).json({ error: `Product "${item.productName}" is unavailable or insufficient quantity.` });
            }

            totalPrice += product.price * item.quantity;


            availableItems.push({
                productName: product.name,
                quantity: item.quantity,
                price: product.price,
            });
        }
        // قولت بلاش ابعتها يحسب هو ال total + check for amount + ava 

        // Authenticate with Paymob
        const authResponse = await axios.post('https://accept.paymobsolutions.com/api/auth/tokens', {
            api_key: process.env.PAYMOB_API_KEY,
        });
        const { token } = authResponse.data;

        // Prepare order payload 
        const orderPayload = {
            auth_token: token,
            delivery_needed: 'false',
            amount_cents: totalPrice * 100, 
            currency: 'EGP',
            items: availableItems.map(item => ({
                name: item.productName,
                quantity: item.quantity,
                amount_cents: item.price * 100,
            })),
        };

        // Create an order in Paymob
        const orderResponse = await axios.post('https://accept.paymobsolutions.com/api/ecommerce/orders', orderPayload);
        const orderId = orderResponse.data.id;

        // Create a payment key
        const paymentKeyResponse = await axios.post('https://accept.paymobsolutions.com/api/acceptance/payment_keys', {
            auth_token: token,
            amount_cents: totalPrice * 100,
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                email: user.email,
                first_name: user.userName,
                last_name: user.lastName,
                phone_number: user.phone ,
                street: user.address.street,
                building: user.address.building ||1 ,
                floor: user.address.floor || 1,
                apartment: user.address.apartment || 1 ,
                city: user.address.city,
                country: user.address.country,
                state: user.address.state,
            },
            currency: 'EGP',
            integration_id: process.env.PAYMOB_INTEGRATION_ID,
        });
        const { token: paymentToken } = paymentKeyResponse.data;

        // Save the order to the database
        const newOrder = new orderModel({
            userId: user._id,
            items: availableItems,
            totalPrice,
            paymentMethod,
            status: 'pending',
        });
        await newOrder.save();

        res.status(200).json({
            success: true,
            message: 'Payment created successfully.',
            paymentToken,
            orderId: newOrder._id,
            totalPrice,
            paymentMethod,
            items: availableItems,
            user: {
                userId: user._id,
                email: user.email,
                firstName: user.userName,
            },
        });
    } catch (error) {
        console.error('Error in creating payment:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Payment creation failed', details: error.response ? error.response.data : error.message });
    }
};

// Get the iframe URL
export const completePayment = (req, res) => {
    const { paymentToken } = req.body;
    if (!paymentToken) {
        return res.status(400).json({ success: false, error: 'Missing payment token' });
    }

    const iframeUrl = `https://accept.paymobsolutions.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
    res.status(200).json({
        success: true,
        message: 'iframe Created successfully',
        iframeUrl,
    });
};

