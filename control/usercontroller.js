const user = require("../models/usermodel")
const bcrypt = require("bcrypt")
const e = require("express")
const dbConnect = require("../config/dbconnection")
const cart = require("../models/cartmodel")
const { default: mongoose, Error } = require("mongoose")
const { response } = require("../app")
const product = require("../models/productmodel")
const Ordercollection = require("../models/order")
const Razorpay = require('razorpay');
const { resolve } = require("path")
require("dotenv").config()


const instance = new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRETE_KEY,
});



module.exports = {
    doSingup: (userdata) => {

        return new Promise(async (resolve, reject) => {
            try {
                const alreadySignup = await user.findOne({ email: userdata.email })
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


    doLogin: (userdata) => {

        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                const client = await user.findOne({ email: userdata.email })
               
                if (client) {
                    bcrypt.compare(userdata.password, client.password).then((status) => {
                        if (status) {
                            if (client.blocked) {
                                resolve({ blockedstatus: true })
                            } else {
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

    //verify OTP

    verifyOtp:(userOtp,otp)=>{
  return new Promise((resolve,reject)=>{

  

    if(userOtp===otp){
      resolve({status:true})
    }else{
        resolve({status:false})
    }

  })


    },


    //add to cart

    addtoCart: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let usercart = await cart.findOne({ userId: userId })
                if (usercart) {
                    const alredyincart = await cart.findOne({ $and: [{ userId }, { products: { $elemMatch: { productId } } }] });
                    if (alredyincart) {
                        await cart.findOneAndUpdate({ $and: [{ userId }, { "products.productId": productId }] }, { $inc: { "products.$.quantity": 1 } });
                    } else {
                        const newProduct = {
                            productId: productId,
                            quantity: 1
                        }
                        await cart.findOneAndUpdate({ userId: userId }, { $inc: { totalquantity: 1 }, $push: { products: newProduct } })
                        resolve()
                    }

                } else {
                    const newcart = new cart({
                        userId: userId,
                        products: [
                            {
                                productId: productId,
                                quantity: 1
                            }
                        ],
                        totalquantity: 1
                    })
                    await newcart.save().then((data) => {
                        resolve(data)
                    }).catch((error) => {
                        throw error
                    })
                }
            } catch (error) {
                throw error
            }
        })

    },

    //display cart items
    totalquantity: async (userid) => {
        try {
            const userID = new mongoose.Types.ObjectId(userid)
            const Cart = await cart.findOne({ userId: userID }).lean()
            if (Cart) {
                return Cart.totalquantity

            } else {
                return 0
            }

        } catch (error) {
            throw new Error(error)
        }
    },

    getcartitems: (userId) => {
        return new Promise(async (resolve, reject) => {
            const userid = new mongoose.Types.ObjectId(userId)
            const usercart = await cart.findOne({ userId: userid })
            if (usercart) {
                const productdetails = await cart.aggregate([
                    { $match: { userId: userid } },

                    { $unwind: "$products" },

                    {
                        $project: {
                            totalquantity: '$totalquantity',
                            productId: '$products.productId',
                            quantity: '$products.quantity',
                            totalamount: '$totalamount',
                        }
                    }, {
                        $lookup: {
                            from: "products",
                            localField: "productId",
                            foreignField: "_id",
                            as: "cartproducts"
                        }
                    }, {
                        $project: {
                            totalquantity: 1,
                            productId: 1,
                            quantity: 1,
                            totalamount: 1,
                            cartproduct: {
                                $arrayElemAt: ['$cartproducts', 0]
                            }
                        }
                    },
                    {
                        $project: {
                            totalquantity: 1,
                            productId: 1,
                            quantity: 1,
                            cartproduct: 1,
                            subtotal: {
                                $multiply: ["$quantity", "$cartproduct.productSRP"]
                            },


                        }
                    },

                    {
                        $project: {
                            totalquantity: 1,
                            productId: 1,
                            quantity: 1,
                            cartproduct: 1,
                            subtotal: 1
                        }
                    },
                ])

                resolve({ productdetails, cartexist: true })
            } else {
                resolve({ cartexist: false })
            }

        })
    },

    //addproduct quantity

    changeproductquantity: async (details) => {
        const quantity = details.quantity;
        const cartid = new mongoose.Types.ObjectId(details.cart)
        const productId = new mongoose.Types.ObjectId(details.product)
        const count = parseInt(details.count)
        return new Promise(async (resolve, reject) => {
            if (quantity == 1 && count == -1) {
                await cart.findOneAndUpdate({ _id: cartid, products: { $elemMatch: { productId: productId } } }, {
                    $pull: { products: { productId: productId } },
                    $inc: { totalquantity: count }
                }, {}).then((response) => {
                    resolve({ removeProduct: true });
                })

            } else {

                await cart.findOneAndUpdate({ _id: cartid, products: { $elemMatch: { productId: productId } } }, { $inc: { "products.$.quantity": count } }).then((response) => {
                    resolve(response)
                })
            }
        })
    },

    //Remove product from cart

    removeCartitem: (details) => {
        const cartid = new mongoose.Types.ObjectId(details.cart)
        const productId = new mongoose.Types.ObjectId(details.product)
        return new Promise((resolve, reject) => {
            cart.findOneAndUpdate({ _id: cartid, products: { $elemMatch: { productId: productId } } }, {
                $pull: { products: { productId: productId } },
                $inc: { totalquantity: -1 }
            }).then((data) => {
                resolve({ removeProduct: true })
            })
        })
    },

    //total price of the cart items

    totalPrice: (userId) => {
        return new Promise(async (resolve, reject) => {
            const productdetails = await cart.findOne({ userId: userId }).populate('products.productId').lean();
            resolve(productdetails)
        })
    },

    //find sum of total price

    totalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            const userid = new mongoose.Types.ObjectId(userId)
            const usercart = await cart.findOne({ userId: userid })
            if (usercart) {
                const totalAmount = await cart.aggregate([
                    { $match: { userId: userid } },

                    { $unwind: "$products" },

                    {
                        $project: {
                            totalquantity: '$totalquantity',
                            productId: '$products.productId',
                            quantity: '$products.quantity',
                            totalamount: '$totalamount',
                        }
                    }, {
                        $lookup: {
                            from: "products",
                            localField: "productId",
                            foreignField: "_id",
                            as: "cartproducts"
                        }
                    }, {
                        $project: {
                            totalquantity: 1,
                            productId: 1,
                            quantity: 1,
                            totalamount: 1,
                            cartproduct: {
                                $arrayElemAt: ['$cartproducts', 0]
                            }
                        }
                    },
                    {
                        $project: {
                            totalquantity: 1,
                            productId: 1,
                            quantity: 1,
                            cartproduct: 1,
                            subtotal: {
                                $multiply: ["$quantity", "$cartproduct.productSRP"]
                            },


                        }
                    },

                    {
                        $project: {
                            subtotal: 1
                        }
                    }, {
                        $group: {
                            _id: null,
                            total: { $sum: "$subtotal" }
                        }
                    }, {
                        $project: {
                            _id: 0,
                            total: 1
                        }
                    }
                ])
                let total;
                if (totalAmount.length != 0) {
                    total = totalAmount[0].total
                }
                resolve(total)
            } else {
                resolve(0)

            }
        })

    },

    //singleproduct view

    productView: (proId) => {
        return new Promise(async (resolve, reject) => {
            const productDetails = await product.findOne({ _id: proId }).lean()
            resolve(productDetails)
        })
    },

    //add address to userdatabase

    addAddress: (userId, userdata) => {
        return new Promise(async (resolve, reject) => {

            const updateaddress = {
                name: userdata.name,
                email: userdata.email,
                phone: userdata.phone,
                house: userdata.address,
                city: userdata.city,
                postal: userdata.postal
            }
            const userdetails = await user.findOne({ _id: userId })
            if ('address' in userdetails) {

                await user.findOneAndUpdate({ _id: userId }, { $push: { address: updateaddress } })
            } else {

                await user.findOneAndUpdate({ _id: userId }, { $set: { address: updateaddress } })
            }




        })
    },

    //get useraddress
    showAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userdetails = await user.findOne({ _id: userId }).lean()

            const useraddress = userdetails.address

            resolve(useraddress)
        })
    },


    //find user Adderss

    userdetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           const userdata=await user.findOne({_id:userId})
           resolve(userdata)
        })
    },

    placeorder: (userId, order, cartproducts, total) => {
        return new Promise(async (resolve, reject) => {
            const userid = new mongoose.Types.ObjectId(userId);
            const addressid = new mongoose.Types.ObjectId(order.address);
            const addressDetails = await user.findOne({ _id: userid }, { address: { $elemMatch: { _id: addressid } } }).lean();
            const products = cartproducts
            const totalAmount = total
            let status = order['payment-method'] === "COD" ? "orderplaced" : "pending"
            const newOrder = new Ordercollection({
                userid: userId,
                address: addressDetails.address[0],
                paymentmethod: order['payment-method'],
                orderitem: [],
                totalamount: totalAmount,
                status: status,
                createdAt: new Date()
            });

            for (let i = 0; i < products.length; i++) {
                const orderitem = {
                    product: products[i].cartproduct._id,
                    quantity: products[i].quantity,
                    productprice: products[i].cartproduct.productSRP,
                    totalamount: products[i].subtotal
                };

                newOrder.orderitem.push(orderitem);
            }
            await newOrder.save().then((response) => {
                resolve(response._id)
            })


        })
    },

    deleteCart:(userid)=>{
        cart.findOneAndDelete({ userId: userid }).then(() => { console.log("Deleted") }).catch(err => console.log(err))
    },

    //view Orderlist
    viewOrderdetails: (userid) => {
        return new Promise(async (resolve, reject) => {
            const userId = new mongoose.Types.ObjectId(userid)
            const order = await Ordercollection.findOne({ userid: userId })

            if (order) {
                const orderdetails = await Ordercollection.aggregate([
                    { $match: { userid: userId } },

                    { $unwind: "$orderitem" },

                    {
                        $project: {
                            paymentmethod: "$paymentmethod",
                            OrdercreatedAt: "$OrdercreatedAt",
                            totalamount: "$totalamount",
                            status: "$status",
                            Productquantity: "$orderitem.quantity",
                            productprice: "$orderitem.productprice",
                            producttotal: "$orderitem.totalamount",
                            productId: "$orderitem.product"
                        }
                    }, {
                        $lookup: {
                            from: "products",
                            localField: "productId",
                            foreignField: "_id",
                            as: "orderedproducts"
                        }
                    },
                    {
                        $project: {
                            paymentmethod: 1,
                            OrdercreatedAt: 1,
                            totalamount: 1,
                            status: 1,
                            Productquantity: 1,
                            productprice: 1,
                            producttotal: 1,
                            productId: 1,
                            orderedproducts: {
                                $arrayElemAt: ["$orderedproducts", 0]
                            }
                        }
                    }

                ])

                resolve(orderdetails)
            }


        })
    },

    //Razorpay

    generateRazorpay: (orderId,total) => {

        return new Promise(async(resolve, reject) => {
           
            const options = { 
            amount: total*100,
            currency: "INR",
            receipt: ""+orderId
            };
            instance.orders. create (options, function(err, order) {
           
                resolve(order)
        });

        })
    },


    //Payment verification
    verifypayment:(details)=>{
        
        return new Promise((resolve,reject)=>{  
            const crypto=require('crypto')
            const hmac=crypto.createHmac('sha256','d3l0POxuqxCwAKIQKAPuMrdk')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            generated_signature=hmac.digest('hex')
           
            if(generated_signature==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
            
        })
    },

    //change status

    changeStatus:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            await Ordercollection.findOneAndUpdate({_id:orderId},{$set:{status:"orderplaced"}})
            resolve()
        })
    }
}






