const { default: mongoose, Schema } = require("mongoose");


const orderShema=new mongoose.Schema({
    
    userid:{
        type: mongoose.Schema.Types.ObjectId,
        required:true
    },
    address:{
        type:Object,
        required:true
    },
    paymentmethod:{
        type:String,
        required:true
    },
    orderitem:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"products",
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        productprice:{
            type:Number,
        },
        totalamount:{
            type:Number
        }
    }],
    totalamount:{
        type:Number
    },
    status:{
        type:String,
        required:true
    }


})

module.exports = new mongoose.model('order',orderShema)