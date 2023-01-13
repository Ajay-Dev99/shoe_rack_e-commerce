const user = require("../models/usermodel")
const bcrypt = require("bcrypt")
const e = require("express")
const dbConnect = require("../connection/dbconnection")
const cart = require("../models/cartmodel")
module.exports = {
    toSingup: (userdata) => {
        
        return new Promise(async (resolve, reject) => {
            try {
                let alreadySignup = await user.findOne({ email: userdata.email })
                if (alreadySignup) {
                    resolve({ exist: true })
                }
                const newUser = new user({
                    name: userdata.name,
                    email: userdata.email,
                    password: userdata.confirm_Password
                })
                return await newUser.save()
                    .then((data) => {
                        resolve({ status: true, data })

                    })
                    .catch((err) => {
                        resolve({ status: false })
                    })
            }
            catch (error) {
                throw error;
            }
        })
    },


    toLogin: (userdata) => {
        // console.log(userdata)
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                const client = await user.findOne({ email: userdata.email })
                if (client) {
                    bcrypt.compare(userdata.password, client.password).then((status) => {
                        if (status) {
                            if(client.blocked){
                                resolve({blockedstatus:true})
                            }else{
                            response.status = true;
                            response.user = client
                            resolve(response)
                        }
                        } else {
                            resolve({ status: false })
                        }

                    })

                } else {
                    resolve({ usernotfound: true })
                }
            } catch (error) {

            }
        })

    },

    //add to cart

    addtoCart:(productId,userId)=>{
        console.log(productId,"<<<<<<<<<productid>>>>>>>>>"),
        console.log(userId,"<<<<<<<<<userid>>>>>>>>>>>>>")
    return new Promise(async(resolve,reject)=>{
       try {
        let usercart=await cart.findOne({userId:userId})
        console.log(usercart,"<<<<<<<<<<<<<<usercart>>>>>>>")
        if(usercart){
            const alredyincart=cart.findOne({productId:productId})
            // if(alredyincart){
            //      await cart.updateOne({userId:userId},{$inc:{quantity:1}})
            // }else{
                const newProduct={
                    productId:productId,
                    quantity:1
                }
                await cart.findOneAndUpdate({ userId: userId }, { $inc: { totalquantity: 1 }, $push: { products: newProduct } })
            // }
           
        }else{
           const newcart = new cart({
            userId:userId,
            products:[
                {
                    productId:productId,
                    quantity:1
                }
            ],
            totalquantity:1
           })
           await newcart.save().then((data)=>{
            console.log(data,"<<<<<<<<<<<<data>>>>>>>>>>")
            resolve()
           }).catch((error)=>{
            throw error
           })
        }
       } catch (error) {
        throw error
       }
    })

    }
}