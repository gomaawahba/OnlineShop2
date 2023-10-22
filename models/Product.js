const mongoose = require("mongoose");
// create Schema for proudect contain title price imageUrl description

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

//create Modee
module.exports = mongoose.model('Product', productSchema);

/**--------------------------------------------------------
 * const Product= mongoose.model('Product', productSchema);
    module.exports=Product
 * 
 ------------------------------------------------------------*/








/**
 * 
 *   title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});
 */