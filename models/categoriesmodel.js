const { default: mongoose } = require("mongoose");


const categorySchema = new mongoose.Schema({
    categoryname:{
        type:String,
        required:true
    },
    imageurl:{
        type:String,
        required:true
    }
})

module.exports = new mongoose.model("category", categorySchema)