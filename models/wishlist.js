const { default: mongoose } = require("mongoose");



const wishlistSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    products:[
        {
        productId:{
            type:mongoose.Schema.Types.ObjectId
        }
    }
    ]

})

module.exports=new mongoose.model('wishlist',wishlistSchema)