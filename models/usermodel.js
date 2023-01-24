const mongoose = require("mongoose")
const bcrypt = require("bcrypt")


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        index: { unique: true }
    },
    password: {
        type: String,
        required: true
    },
    blocked: {
        type: Boolean,
        default: false
    },
    address:[
        {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        phone:{
            type:Number,
            required:true
        },
        house:{
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        postal:{
            type:String,
            required:true
        }
    }
    ]

})


userSchema.pre('save', async function (next) {
    try {
        console.log("called before save user")
        const salt = await bcrypt.genSalt(10)
        const hassedpassword = await bcrypt.hash(this.password, salt)
        this.password = hassedpassword
        console.log(this.email, this.password)
    } catch (error) {
        next(error)
    }
})


module.exports = new mongoose.model("user", userSchema)