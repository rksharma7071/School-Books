import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Book } from "../models/book.model.js";
import Counter from "../models/counter.model.js";

async function getAllOrder(req, res) {
    try {
        const orders = await Order.find({})
            .populate("userId", "name email")
            .populate("items.bookId", "name price")
            .sort({ createdAt: -1 });

        return res.status(200).json(orders);
    } catch (error) {
        console.error("Get orders error:", error);
        return res.status(500).json("Failed to fetch orders");
    }
}

async function getOrderById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json("Invalid order ID");
        }

        const order = await Order.findById(id)
            .populate("userId", "name email")
            .populate("items.bookId", "name price");

        if (!order) {
            return res.status(404).json("Order not found");
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error("Get order error:", error);
        return res.status(500).json("Internal Server Error");
    }
}

async function createOrder(req, res) {
    try {
        const {
            userId,
            items,
            shipping,
            tax,
            discount = 0,
            shipping_address,
            billing_address,
            paymentId,
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json("Invalid user ID");
        }

        if (!items?.length) {
            return res.status(400).json("Order must have items");
        }

        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const book = await Book.findById(item.bookId);
            if (!book) {
                return res.status(404).json(`Book not found: ${item.bookId}`);
            }

            const quantity = item.quantity || 1;
            const unit_price = book.price;
            const total_price = unit_price * quantity;

            subtotal += total_price;
            orderItems.push({
                bookId: book._id,
                quantity,
                unit_price,
                total_price,
            });
        }

        const total =
            subtotal + Number(shipping) + Number(tax) - Number(discount);

        const counter = await Counter.findOneAndUpdate(
            { name: "order" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const order = await Order.create({
            orderNumber: counter.seq,
            userId,
            items: orderItems,
            shipping,
            tax,
            discount,
            subtotal,
            total,
            shipping_address,
            billing_address,
            paymentId,
        });

        return res.status(201).json(order);
    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json("Internal Server Error");
    }
}

async function updateOrder(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json("Invalid order ID");
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json("Order not found");
        }

        const { status, shipment, shipping_address, billing_address } =
            req.body;

        if (status) {
            order.status = status;
        }

        if (shipment) {
            order.shipment = {
                ...order.shipment,
                ...shipment,
            };
        }

        if (shipping_address) order.shipping_address = shipping_address;

        if (billing_address) order.billing_address = billing_address;

        await order.save();

        return res.status(200).json(order);
    } catch (error) {
        console.error("Update order error:", error);
        return res.status(500).json("Internal Server Error");
    }
}

async function deleteOrder(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json("Invalid order ID");
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json("Order not found");
        }
        await Order.findByIdAndDelete(id);
        return res.json({
            status: "success",
            message: "Order deleted successfully",
        });
    } catch (error) {
        console.error("Delete order error:", error);
        return res.status(500).json("Internal Server Error");
    }
}

export { getAllOrder, getOrderById, createOrder, updateOrder, deleteOrder };
