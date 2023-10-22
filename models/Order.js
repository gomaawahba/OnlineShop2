const mongoose = require("mongoose");
// create Schema for Order contain title price imageUrl description
const orderSchema = new mongoose.Schema({
    products: [{
        product: { type: Object, required: true },
        quantity: { type: Number, required: true }
    }],
    user: {
        email: { type: String, required: true },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    }
});

module.exports = mongoose.model('Order', orderSchema);