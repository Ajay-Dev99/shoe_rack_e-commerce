const { default: mongoose } = require("mongoose")

const CartSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        require: true
    },
    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "products",
                require: true
            },
            quantity: {
                type: Number,
                default: 1
            },

        }
    ],
    totalquantity: {
        type: Number,
       
    },
    cuponsavings:{
        type:Number,
        default:0
    }

})


module.exports = new mongoose.model('cart', CartSchema)