const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
  fullname: {
    type: String,
    minLength: 3,
    trim: true,
  },
  email: String,
  password: String,
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product"
      },
      quantity: {
        type: Number,
        default: 1
      }
    }
  ],
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order"
    }
  ],
  addresses: [
    {
      fullname: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: String,
      isDefault: {
        type: Boolean,
        default: false
      }
    }
  ],
  profilePicture: String,
  contact: Number,
  picture: String
})

module.exports = mongoose.model("user", userSchema);