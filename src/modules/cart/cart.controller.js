import { cartModel } from "../../../DataBase/models/cart.model.js";
import { orderModel } from "../../../DataBase/models/order.model.js";
import { productModel } from "../../../DataBase/models/product.model.js";
import { catchError } from "../../utiles/catchError.js";
import jwt from 'jsonwebtoken';
import axios from "axios";
// Middleware or utility function to extract `userId` from the `token` header
const extractUserIdFromToken = (req) => {
    const token = req.headers.token; // Extract token from `token` header
    if (!token) throw new Error('Token missing');
    
    const decoded = jwt.verify(token, 'ahmedrafat123'); // Replace with your actual secret
    return decoded.userId; // Assuming the token contains `userId`
};

export const addProductToCart = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); // Extract `userId` from the token
    const { productId } = req.body; // Only `productId` is being sent in the body

    if (!productId) {
        return res.status(400).json({ msg: "Product ID is required" });
    }

    // Find the product to get its price
    const product = await productModel.findById(productId);
    if (!product) {
        return res.status(404).json({ msg: "Product not found" });
    }

    // Find or create a cart for the user
    let cart = await cartModel.findOne({ userId: userId });

    if (!cart) {
        // Create a new cart if it doesn't exist
        cart = new cartModel({
            userId: userId,
            items: [{ productId, quantity: 1, price: product.price }],
            totalQuantity: 1,
            totalPrice: product.price
        });
        await cart.save();
        return res.json({ msg: "Product added to cart", result: cart });
    }

    // Check if the product is already in the cart
    const item = cart.items.find((item) => item.productId.toString() === productId.toString());

    if (item) {
        // If product exists, increment its quantity and update price
        item.quantity += 1;
        item.price = product.price; // Update price if needed
    } else {
        // Add new product to the cart
        cart.items.push({ productId, quantity: 1, price: product.price });
    }

    // Update total quantity and total price
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Save the updated cart
    await cart.save();
    res.json({ msg: "Product added/updated in cart", cart });
});



export const updateProductQuantityInCart = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); // Extract `userId` from the token
    const { productId, quantity } = req.body; // Extract `productId` and `quantity` from the request body

    if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({ msg: "Product ID and valid quantity are required" });
    }

    // Find the user's cart
    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
        return res.status(404).json({ msg: "Cart not found" });
    }

    // Find the product in the cart
    const item = cart.items.find((item) => item.productId.toString() === productId.toString());
    if (!item) {
        return res.status(404).json({ msg: "Product not found in cart" });
    }

    // Update the quantity of the product in the cart
    item.quantity = quantity;

    // Update total quantity and total price
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Save the updated cart
    await cart.save();
    res.json({ msg: "Product quantity updated", cart });
});


export const removeProductFromCart = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); // Extract userId from the token
    const { productId } = req.params; // Get productId from URL parameters

    if (!productId) {
        return res.status(400).json({ msg: "Product ID is required" });
    }

    // Find the user's cart
    const cart = await cartModel.findOne({ userId: userId });
    if (!cart) {
        return res.status(404).json({ msg: "Cart not found" });
    }

    // Check if the product exists in the cart
    const itemIndex = cart.items.findIndex((item) => item.productId.toString() === productId.toString());
    
    if (itemIndex === -1) {
        return res.status(404).json({ msg: "Product not found in cart" });
    }

    // Remove the product from the cart
    cart.items.splice(itemIndex, 1);

    // Update total quantity and total price
    cart.totalQuantity = cart.items.reduce((acc, item) => acc + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    // Save the updated cart
    await cart.save();
    
    res.json({ msg: "Product removed from cart", cart });
});

export const getCartForUser = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); 
    const cart = await cartModel.findOne({ userId: userId }).populate({
        path: 'items.productId',
        model: productModel, // Use the product model to populate all product details
    });

    if (!cart) {
        return res.status(404).json({ msg: "Cart not found" });
    }

    if (cart.totalPrice === 0) {
        return res.json({ msg: "Cart is empty", cart });
    }

    return res.json({ msg: "Cart retrieved successfully", cart });
});


export const clearCart = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); 

    let cart = await cartModel.findOne({ userId: userId });

    if (!cart) {
        return res.status(404).json({ msg: "Cart not found for this user" });
    }

    cart.items = [];
    cart.totalQuantity = 0;
    cart.totalPrice = 0;

    await cart.save();

    res.json({ msg: "Cart cleared successfully", cart });
});



export const processCashPayment = catchError(async (req, res) => {
    const userId = extractUserIdFromToken(req); 

    // Find the user's cart
    const cart = await cartModel.findOne({ userId: userId });
    if (!cart || cart.totalQuantity === 0) {
        return res.status(400).json({ msg: "Cart is empty or not found" });
    }

    // Create a new order
    const order = new orderModel({
        userId,
        items: cart.items,
        totalPrice: cart.totalPrice,
        paymentMethod: 'cash',
        status: 'pending' 
    });

    // Save the order
    await order.save();

    // Optionally, clear the user's cart after payment
    cart.items = [];
    cart.totalQuantity = 0;
    cart.totalPrice = 0;
    await cart.save();

    res.json({ msg: "Payment processed successfully", order });
});



