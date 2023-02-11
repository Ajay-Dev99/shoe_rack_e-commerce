const { default: mongoose } = require("mongoose");


const couponSchema= new mongoose.Schema({
    couponCode:{
        type:String,
        requirde:true
    },
    disCount:{
        type:Number,
        required:true
    },
    expiryDate:{
        type:String,
        required:true
    },
    maxDiscountAmount:{
        type:Number,
        required:true
    },
    minOrderAmount:{
        type:Number,
        required:true
    }

})

module.exports=new mongoose.model("coupon",couponSchema)