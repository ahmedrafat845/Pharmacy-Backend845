import axios from 'axios';
import { userModel } from '../../../DataBase/models/user.model.js';
import { orderModel } from '../../../DataBase/models/order.model.js';

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

// Function to create a payment
export const createPayment = async (req, res) => {
    const { userId, amount, items, paymentMethod } = req.body;

    // Validate request body
    if (!userId || !amount || !items || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check for environment variables
    if (!process.env.PAYMOB_API_KEY || !process.env.PAYMOB_INTEGRATION_ID) {
        return res.status(500).json({ error: 'Missing configuration' });
    }

    try {
        // Fetch user billing data from the database
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(503)
        // Authenticate with Paymob
        const authResponse = await axios.post('https://accept.paymobsolutions.com/api/auth/tokens', {
            api_key: process.env.PAYMOB_API_KEY,
        });
        const { token } = authResponse.data;
        console.log(508)
        // Prepare order payload
        const orderPayload = {
            auth_token: token,
            delivery_needed: 'false',
            amount_cents: amount * 100, // Ensure amount is in cents
            currency: 'EGP',
            items: items.map(item => ({
                name: item.productName, // Ensure this field is populated
                quantity: item.quantity,
                amount_cents: item.price * 100, // Ensure price is in cents
            })),
        };

        console.log('Order Payload:', orderPayload); // Log the payload

        // Create an order in Paymob
        const orderResponse = await axios.post('https://accept.paymobsolutions.com/api/ecommerce/orders', orderPayload);
        const orderId = orderResponse.data.id;
        console.log(507)
        // Create a payment key
        const paymentKeyResponse = await axios.post('https://accept.paymobsolutions.com/api/acceptance/payment_keys', {
            auth_token: token,
            amount_cents: amount * 100,
            expiration: 3600,
            order_id: orderId,
            billing_data: {
                email: user.email,  // User's email address
                first_name: user.userName,  // User's username
                last_name: user.lastName || "Doe",  // User's last name or default
                phone_number: user.phoneNumber || "1234567890",  // User's phone number or default
                street: user.address.street,  // User's street address
                building: user.address.building || "Building 1",  // Optional, if available
                floor: user.address.floor || "2",  // Optional, if available
                apartment: user.address.apartment || "5A",  // Optional, if available
                city: user.address.city,  // User's city
                country: user.address.country,  // User's country
                state: user.address.state,  // User's state
            },
            currency: 'EGP',
            integration_id: process.env.PAYMOB_INTEGRATION_ID,
        });
        console.log(50)
        const { token: paymentToken } = paymentKeyResponse.data;
        console.log(500)
        // Save the order to the database
        const newOrder = new orderModel({
            userId: user._id,
            items: items.map(item => ({
                productName: item.productName, // Include product name
                quantity: item.quantity,
                price: item.price,
            })),
            totalPrice: amount,
            paymentMethod,
            status: 'pending',
        });
        await newOrder.save();
        
        // Prepare the response
        res.status(200).json({
            success: true,
            message: 'Payment created successfully.',
            paymentToken, // Include the payment token
            orderId: newOrder._id, // Include the order ID
            totalPrice: amount, // Total amount for the payment
            paymentMethod, // Method of payment used
            items, // Include the items
            user: {
                userId: user._id, // The user's ID
                email: user.email, // User's email address
                firstName: user.userName, // User's first name
            },
        });
    } catch (error) {
        console.error('Error in creating payment:', error.response ? error.response.data : error);
        res.status(500).json({ error: 'Payment creation failed', details: error.response ? error.response.data : error.message });
    }
};


// Function to complete the payment and get the iframe URL
export const completePayment = (req, res) => {
    const { paymentToken } = req.body;
    if (!paymentToken) {
        return res.status(400).json({ success: false, error: 'Missing payment token' });
    }

    const iframeUrl = `https://accept.paymobsolutions.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentToken}`;
    res.status(200).json({
        success: true,
        message: 'Payment iframe URL generated successfully',
        iframeUrl,
    });
};
