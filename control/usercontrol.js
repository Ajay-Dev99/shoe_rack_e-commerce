const user = require("../models/usermodel")
const bcrypt = require("bcrypt")
const e = require("express")
const dbConnect = require("../connection/dbconnection")
const cart = require("../models/cartmodel")
const { default: mongoose } = require("mongoose")
const { response } = require("../app")
const product = require("../models/productmodel")
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

    getcartitems: (userId) => {
        return new Promise(async (resolve, reject) => {
            const userid = new mongoose.Types.ObjectId(userId)
            const usercart = await cart.findOne({ userId: userid })

            if (usercart) {
                const productDetails = await cart.aggregate([
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
                const productdetails = productDetails
                console.log(productdetails, "productdetails")

                let totalquantity;
                if (productdetails.length != 0) {

                    totalquantity = parseInt(productdetails[0].totalquantity)
                }


                if (totalquantity >= 1) {
                    resolve({ productdetails, cartexist: true })
                } else {
                    resolve({ cartexist: false })
                }

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
            console.log(productdetails.products[0].productId.productSRP, ";;;;;;;;")
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
                    // console.log(totalAmount[0].total,"totalamount")

                }
                resolve(total)
            }
        })

    },

    //singleproduct view

    productView:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            const productDetails=await product.findOne({_id:proId})
            console.log(productDetails,"????????????")
            resolve(productDetails)
        })
    }



}



