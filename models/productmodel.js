const { default: mongoose } = require("mongoose");
const { array } = require("../utilities/imageUpload");

const productSchema=new mongoose.Schema({
    productname:{
        type:String,
        required:true
    },
    productcategory:{
        type:String,
        required:true
    },
    productMRP:{
        type:Number,
        required:true
    },
    productSRP:{
       type:Number,
       required:true
    },
    imageurl:{
        type:[Object],
        default:true
    },
    productdescription:
    {
        type:String,
        required:true
    },
    status:{
        type:Boolean,
        default:true
    },
    productstock:{
        type:Number,
        required:true
    }
})

module.exports=new mongoose.model("products",productSchema)