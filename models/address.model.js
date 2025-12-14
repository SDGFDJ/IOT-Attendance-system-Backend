import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.ObjectId, 
    ref: "User", 
    required: true 
  },
  name: { type: String, required: true },
  building: { type: String, required: true },
  address_line: { type: String, required: true },  // React form field
  district: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },      // React form field
  country: { type: String, default: "India" },
  mobile: { type: String, required: true },
  status: { type: Boolean, default: true }
}, { timestamps: true });

const AddressModel = mongoose.model("Address", addressSchema);
export default AddressModel;
