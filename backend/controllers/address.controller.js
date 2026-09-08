import mongoose from "mongoose";
import { Address } from "../models/user.model.js";
import { ApiError, handleError } from "../utils/apiError.js";

const STRING_FIELDS = ["fullName", "phone", "address", "city", "state", "pincode", "country", "type", "landmark"];
const REQUIRED_FIELDS = ["fullName", "phone", "address", "city", "state", "pincode"];
const ALLOWED_UPDATE_FIELDS = ["fullName", "phone", "address", "city", "state", "pincode", "country", "type", "landmark"];
const ADDRESS_TYPES = ["home", "work", "other"];

const PHONE_RE = /^[+]?[0-9\-\s()]{7,15}$/;
const INDIA_PINCODE_RE = /^[1-9][0-9]{5}$/;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isBlank = (value) => typeof value !== "string" || value.trim().length === 0;

const normalizeAddressData = (input = {}) => {
    const data = {};
    for (const field of STRING_FIELDS) {
        if (input[field] !== undefined && input[field] !== null) {
            data[field] = String(input[field]).replace(/\s+/g, " ").trim();
        }
    }
    return data;
};

const validateAddressData = (data, { partial = false, effectiveCountry } = {}) => {
    if (!partial) {
        for (const field of REQUIRED_FIELDS) {
            if (isBlank(data[field])) throw new ApiError(400, `${field} is required`);
        }
    }

    if (data.fullName !== undefined) {
        if (isBlank(data.fullName)) throw new ApiError(400, "fullName cannot be empty");
        if (data.fullName.length > 100) throw new ApiError(400, "fullName is too long (max 100 characters)");
    }

    if (data.phone !== undefined) {
        if (isBlank(data.phone)) throw new ApiError(400, "phone cannot be empty");
        if (!PHONE_RE.test(data.phone)) throw new ApiError(400, "Invalid phone number format");
    }

    if (data.address !== undefined) {
        if (isBlank(data.address)) throw new ApiError(400, "address cannot be empty");
        if (data.address.length > 300) throw new ApiError(400, "address is too long (max 300 characters)");
    }

    if (data.city !== undefined) {
        if (isBlank(data.city)) throw new ApiError(400, "city cannot be empty");
        if (data.city.length > 100) throw new ApiError(400, "city is too long (max 100 characters)");
    }

    if (data.state !== undefined) {
        if (isBlank(data.state)) throw new ApiError(400, "state cannot be empty");
        if (data.state.length > 100) throw new ApiError(400, "state is too long (max 100 characters)");
    }

    if (data.pincode !== undefined) {
        if (isBlank(data.pincode)) throw new ApiError(400, "pincode cannot be empty");
        if (data.pincode.length > 20) throw new ApiError(400, "pincode is too long");
        const country = String(effectiveCountry ?? data.country ?? "India").toLowerCase();
        if (country === "india" && !INDIA_PINCODE_RE.test(data.pincode)) {
            throw new ApiError(400, "Invalid pincode. Must be a 6-digit Indian pincode");
        }
    }

    if (data.type !== undefined && !ADDRESS_TYPES.includes(data.type)) {
        throw new ApiError(400, `Invalid address type. Must be one of: ${ADDRESS_TYPES.join(", ")}`);
    }

    if (data.landmark !== undefined && data.landmark.length > 200) {
        throw new ApiError(400, "landmark is too long (max 200 characters)");
    }
};

export const getAddresses = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId, city, state, pincode, isDefault, search } = req.query;

        const pageNum = Math.max(1, Number(page) || 1);
        const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

        const filter = {};

        if (userId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(userId)) throw new ApiError(400, "Invalid userId");
            filter.userId = userId;
        }
        if (city) filter.city = { $regex: escapeRegex(city), $options: "i" };
        if (state) filter.state = { $regex: escapeRegex(state), $options: "i" };
        if (pincode) filter.pincode = String(pincode).trim();
        if (isDefault !== undefined) filter.isDefault = isDefault === "true" || isDefault === true;

        if (search) {
            const safe = escapeRegex(search);
            filter.$or = ["fullName", "phone", "address", "city", "state", "pincode", "country"].map((field) => ({
                [field]: { $regex: safe, $options: "i" },
            }));
        }

        const [addresses, total] = await Promise.all([
            Address.find(filter)
                .populate("userId", "username email first_name last_name")
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Address.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: addresses,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
                hasNextPage: pageNum * limitNum < total,
                hasPreviousPage: pageNum > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getMyAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

        const filter = { userId };

        const [addresses, total] = await Promise.all([
            Address.find(filter)
                .sort({ isDefault: -1, createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Address.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            data: addresses,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPreviousPage: page > 1,
            },
        });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const createAddress = async (req, res) => {
    try {
        const userId = req.user.id;

        const normalized = normalizeAddressData(req.body);
        normalized.country = normalized.country || "India";

        validateAddressData(normalized, { effectiveCountry: normalized.country });

        const existingCount = await Address.countDocuments({ userId });
        const shouldBeDefault = existingCount === 0 || req.body.isDefault === true;

        if (shouldBeDefault && existingCount > 0) {
            await Address.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });
        }

        let newAddress;
        try {
            newAddress = await Address.create({
                userId,
                fullName: normalized.fullName,
                phone: normalized.phone,
                address: normalized.address,
                city: normalized.city,
                state: normalized.state,
                pincode: normalized.pincode,
                country: normalized.country,
                type: normalized.type,
                landmark: normalized.landmark,
                isDefault: shouldBeDefault,
            });
        } catch (error) {
            if (error.code === 11000) {
                throw new ApiError(409, "Could not set default address due to a conflicting request. Please try again.");
            }
            throw error;
        }

        res.status(201).json({ success: true, message: "Address created successfully", data: newAddress });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getAddressByUserId = async (req, res) => {
    try {
        const { id: userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid userId");
        }

        if (req.user.role !== "admin" && String(userId) !== String(req.user.id)) {
            throw new ApiError(403, "You can only view your own addresses");
        }

        const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
        res.status(200).json({ success: true, message: "Addresses fetched successfully", data: addresses });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const getAddressById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid address id");
        }

        const address = await Address.findById(id).lean();
        if (!address) throw new ApiError(404, "Address not found");

        if (req.user.role !== "admin" && String(address.userId) !== String(req.user.id)) {
            throw new ApiError(403, "Access denied. You can only view your own addresses.");
        }

        res.status(200).json({ success: true, message: "Address fetched successfully", data: address });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid address id");
        }

        const address = await Address.findById(id);
        if (!address) throw new ApiError(404, "Address not found");

        if (req.user.role !== "admin" && String(address.userId) !== String(req.user.id)) {
            throw new ApiError(403, "Access denied. You can only update your own addresses.");
        }

        const rawUpdates = {};
        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (req.body[field] !== undefined) rawUpdates[field] = req.body[field];
        }

        const normalizedUpdates = normalizeAddressData(rawUpdates);
        const effectiveCountry = normalizedUpdates.country || address.country;
        validateAddressData(normalizedUpdates, { partial: true, effectiveCountry });

        for (const field of ALLOWED_UPDATE_FIELDS) {
            if (normalizedUpdates[field] !== undefined) {
                address[field] = normalizedUpdates[field];
            }
        }

        const wasDefault = address.isDefault;
        const { isDefault } = req.body;

        if (isDefault === true && !wasDefault) {
            await Address.updateMany(
                { userId: address.userId, _id: { $ne: address._id }, isDefault: true },
                { $set: { isDefault: false } }
            );
            address.isDefault = true;
        } else if (isDefault === false && wasDefault) {
            address.isDefault = false;
        }

        let result;
        try {
            result = await address.save({ validateModifiedOnly: true });
        } catch (error) {
            if (error.code === 11000) throw new ApiError(409, "Another address is already set as default");
            throw error;
        }

        if (isDefault === false && wasDefault) {
            const candidate = await Address.findOne({ userId: address.userId, _id: { $ne: address._id } }).sort({
                createdAt: 1,
            });
            if (candidate) {
                try {
                    await Address.updateOne({ _id: candidate._id }, { $set: { isDefault: true } });
                } catch (error) {
                    if (error.code !== 11000) throw error;
                }
            }
        }

        res.status(200).json({ success: true, message: "Address updated successfully", data: result });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid address id");
        }

        const address = await Address.findById(id);
        if (!address) throw new ApiError(404, "Address not found");

        if (req.user.role !== "admin" && String(address.userId) !== String(req.user.id)) {
            throw new ApiError(403, "Access denied. You can only manage your own addresses.");
        }

        if (address.isDefault) {
            return res.status(200).json({ success: true, message: "Address is already the default", data: address });
        }

        await Address.updateMany(
            { userId: address.userId, isDefault: true },
            { $set: { isDefault: false } }
        );

        address.isDefault = true;

        let result;
        try {
            result = await address.save({ validateModifiedOnly: true });
        } catch (error) {
            if (error.code === 11000) {
                throw new ApiError(409, "Could not set default address due to a conflicting request. Please try again.");
            }
            throw error;
        }

        res.status(200).json({ success: true, message: "Default address updated successfully", data: result });
    } catch (error) {
        handleError(error, req, res);
    }
};

export const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new ApiError(400, "Invalid address id");
        }

        const address = await Address.findById(id);
        if (!address) throw new ApiError(404, "Address not found");

        if (req.user.role !== "admin" && String(address.userId) !== String(req.user.id)) {
            throw new ApiError(403, "Access denied. You can only delete your own addresses.");
        }

        const wasDefault = address.isDefault;
        const userId = address.userId;

        await Address.findByIdAndDelete(id);

        if (wasDefault) {
            const candidate = await Address.findOne({ userId }).sort({ createdAt: 1 });
            if (candidate) {
                try {
                    await Address.updateOne({ _id: candidate._id }, { $set: { isDefault: true } });
                } catch (error) {
                    if (error.code !== 11000) throw error;
                }
            }
        }

        res.status(200).json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
        handleError(error, req, res);
    }
};