import AddressModel from "../models/address.model.js";
import UserModel from "../models/user.model.js"; 

// Add Address
export const addAddressController = async (request, response) => {
    try {
        const userId = request.userId; // middleware
        const { name, building, address_line, district, city, state, pincode, country, mobile } = request.body;

        // Create address
        const createAddress = new AddressModel({
            userId,
            name,
            building,
            address_line,
            district,
            city,
            state,
            country,
            pincode,
            mobile,
            status: true
        });

        const saveAddress = await createAddress.save();

        // push into user document
        await UserModel.findByIdAndUpdate(userId, {
            $push: { address_details: saveAddress._id }
        });

        return response.json({
            message: "Address Created Successfully",
            error: false,
            success: true,
            data: saveAddress
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get Address List
export const getAddressController = async (request, response) => {
    try {
        const userId = request.userId; // middleware auth
        const data = await AddressModel.find({ userId }).sort({ createdAt: -1 });

        return response.json({
            data,
            message: "List of address",
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Update Address
export const updateAddressController = async (request, response) => {
    try {
        const userId = request.userId; // middleware auth
        const { _id, name, building, address_line, district, city, state, country, pincode, mobile } = request.body;

        const updateAddress = await AddressModel.updateOne(
            { _id, userId },
            { name, building, address_line, district, city, state, country, pincode, mobile }
        );

        return response.json({
            message: "Address Updated",
            error: false,
            success: true,
            data: updateAddress
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Delete (soft delete)
export const deleteAddresscontroller = async (request, response) => {
    try {
        const userId = request.userId; // auth middleware
        const { _id } = request.body;

        const disableAddress = await AddressModel.updateOne(
            { _id, userId },
            { status: false }
        );

        return response.json({
            message: "Address removed",
            error: false,
            success: true,
            data: disableAddress
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};
