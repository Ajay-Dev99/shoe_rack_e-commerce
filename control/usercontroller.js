const user = require("../models/usermodel")
const bcrypt = require("bcrypt")
const cart = require("../models/cartmodel")
const { default: mongoose, Error } = require("mongoose")
const product = require("../models/productmodel")
const Ordercollection = require("../models/ordermodel")
const Razorpay = require('razorpay');
const { resolve } = require("path")
const { response } = require("../app")
const admincontrol = require("../control/admincontroller")
const wishList = require("../models/wishlist")
const sendmail = require('../config/nodemailer')
require("dotenv").config()
const coupon=require("../models/couponmodel")
const category=require("../models/categoriesmodel")

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRETE_KEY,
});



const doSingup = (userdata) => {

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
}


const doLogin = (userdata) => {

    return new Promise(async (resolve, reject) => {
        try {
            let response = {}
            const client = await user.findOne({ email: userdata.email })

            if (client) {
                bcrypt.compare(userdata.password, client.password).then((status) => {
                    if (status) {
                        if (client.verified) {
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

}

//verify OTP

const verifyOtp = (userOtp, otp) => {
    return new Promise((resolve, reject) => {

        if (userOtp === otp) {
            resolve({ status: true })
        } else {
            resolve({ status: false })
        }

    })
}

//change verification status
const changeverificationstatus = (userId) => {
    return new Promise(async (resolve, reject) => {
        const client = new mongoose.Types.ObjectId(userId)

        const cllientdata = user.findOne({ _id: client })

        await user.updateOne({ _id: client }, { $set: { verified: true } })
        resolve()
    })
}

//add to cart

const addtoCart = (productId, userId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let usercart = await cart.findOne({ userId: userId })
            if (usercart) {
                const alredyincart = await cart.findOne({ $and: [{ userId }, { products: { $elemMatch: { productId } } }] });
                if (alredyincart) {
                    await cart.findOneAndUpdate({ $and: [{ userId }, { "products.productId": productId }] }, { $inc: { "products.$.quantity": 1 } });
                    resolve({ alredyincart: true })
                } else {
                    const newProduct = {
                        productId: productId,
                        quantity: 1
                    }
                    await cart.findOneAndUpdate({ userId: userId }, { $inc: { totalquantity: 1 }, $push: { products: newProduct } })
                    resolve({ status: true })
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
                    resolve({ status: true })
                }).catch((error) => {
                    throw error
                })
            }
        } catch (error) {
            throw error
        }
    })

}

//display cart items
const totalquantity = async (userid) => {
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
}

const getcartitems = (userId) => {
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
}

//addproduct quantity

const changeproductquantity = async (details) => {
    const quantity = parseInt(details.quantity);
    const cartid = new mongoose.Types.ObjectId(details.cart)
    const productId = new mongoose.Types.ObjectId(details.product)
    const productdata=await product.findOne({_id:productId}).lean()
    const productStock=parseInt(productdata.productstock)
    const count = parseInt(details.count)
    const totalquantity=quantity+count
    console.log(totalquantity,"totalquantity");
    if(count>productStock){
        console.log("greater...");
    }
    return new Promise(async (resolve, reject) => {
        if (quantity == 1 && count == -1) {
            await cart.findOneAndUpdate({ _id: cartid, products: { $elemMatch: { productId: productId } } }, {
                $pull: { products: { productId: productId } },
                $inc: { totalquantity: count }
            }, {}).then((response) => {
                resolve({ removeProduct: true });
            })

        } else if(totalquantity>productStock){
            resolve({exceedstatus:true})
        }
        else {
            

            await cart.findOneAndUpdate({ _id: cartid, products: { $elemMatch: { productId: productId } } }, { $inc: { "products.$.quantity": count } }).then((response) => {

                // if(totalcount>=productStock){
                //     console.log("greater...");
                //     resolve({exceedstatus:true,productStock})
                // }
                
                         resolve(response)
                
            })
        }
    })
}

//Remove product from cart

const removeCartitem = (details) => {
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
}

//total price of the cart items

const totalPrice = (userId) => {
    return new Promise(async (resolve, reject) => {
        const productdetails = await cart.findOne({ userId: userId }).populate('products.productId').lean();
        resolve(productdetails)
    })
}

//find sum of total price

const totalamount = (userId) => {
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

}

//singleproduct view

const productView = (proId) => {
    return new Promise(async (resolve, reject) => {
        const productDetails = await product.findOne({ _id: proId }).lean()
        resolve(productDetails)
    })
}

//add address to userdatabase

const addAddress = (userId, userdata) => {
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
}

//get useraddress
const showAddress = (userId) => {
    return new Promise(async (resolve, reject) => {
        let userdetails = await user.findOne({ _id: userId }).lean()
        const useraddress = userdetails.address

        resolve(useraddress)
    })
}


//find user Adderss

const userdetails = (userId) => {
    return new Promise(async (resolve, reject) => {
        const userdata = await user.findOne({ _id: userId })
        resolve(userdata)
    })
}

const placeorder = (userId, order, cartproducts, total) => {
    return new Promise(async (resolve, reject) => {

        const userid = new mongoose.Types.ObjectId(userId);
        const addressid = new mongoose.Types.ObjectId(order.address);
        const addressDetails = await user.findOne({ _id: userid }, { address: { $elemMatch: { _id: addressid } } }).lean();
        const products = cartproducts
        const totalAmount = total
        let status = order['payment-method'] === "COD" ? "orderplaced" : "pending"
        const  monthInNo= new Date().getMonth()+1
        // const monthName = new Date(2023, monthInNo - 1).toLocaleString('default', { month: 'long' });
      
        const newOrder = new Ordercollection({
            userid: userId,
            address: addressDetails.address[0],
            paymentmethod: order['payment-method'],
            orderitem: [],
            totalamount: totalAmount,
            status: status,
            createdAt: new Date(),
            monthinNO:monthInNo
          
        });

        for(let i=0;i<products.length;i++){
            const productid=products[i].cartproduct._id
            const quantity=products[i].quantity
            const Stock=await product.findOne({_id:productid},{productstock:1,_id:0}).lean()
            const totalstock=Stock.productstock
            const stock=parseInt(totalstock-quantity)
            await product.findOneAndUpdate({_id:productid},{$set:{productstock:stock}})
        }

      
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
}

const deleteCart = (userid) => {
    cart.findOneAndDelete({ userId: userid }).then(() => { console.log("Deleted") }).catch(err => console.log(err))
}

//view Orderlist
const viewOrderdetails = (orderID) => {
    return new Promise(async (resolve, reject) => {
        const orderId = new mongoose.Types.ObjectId(orderID)
        const order = await Ordercollection.findOne({ _id: orderId })

        if (order) {
            const orderdetails = await Ordercollection.aggregate([
                { $match: { _id: orderId } },

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
                        productId: "$orderitem.product",
                        userId: "$userid"
                    }
                }, {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "orderedproducts"
                    }
                }, {

                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userdata"
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
                        },
                        userdata: {
                            $arrayElemAt: ["$userdata", 0]
                        }
                    }
                },
                {
                    $sort: { OrdercreatedAt: -1 }
                }

            ])

            resolve(orderdetails)
        }


    })
}
const viewallOrderdetails = (userid) => {
    return new Promise(async (resolve, reject) => {
        const userId = new mongoose.Types.ObjectId(userid)
        const order = await Ordercollection.findOne({ userid: userId })
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
            },
            {
                $sort: { OrdercreatedAt: -1 }
            }

        ])
        resolve(orderdetails)
    })
}

//Razorpay

const generateRazorpay = (orderId, total) => {

    return new Promise(async (resolve, reject) => {
        const options = {
            amount: total * 100,
            currency: "INR",
            receipt: "" + orderId
        };
        instance.orders.create(options, function (err, order) {

            resolve(order)
        });

    })
}


//Payment verification
const verifypayment = (details) => {

    return new Promise((resolve, reject) => {
        const crypto = require('crypto')
        const hmac = crypto.createHmac('sha256', 'd3l0POxuqxCwAKIQKAPuMrdk')
        hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
        generated_signature = hmac.digest('hex')

        if (generated_signature == details['payment[razorpay_signature]']) {
            resolve()
        } else {
            reject()
        }

    })
}

//change status

const changeStatus = (orderId) => {
    return new Promise(async (resolve, reject) => {
        await Ordercollection.findOneAndUpdate({ _id: orderId }, { $set: { status: "orderplaced" } })
        resolve()
    })
}

//Edit user details

const editUserdetails = (userId, userdata) => {
    return new Promise(async(resolve, reject) => {
        user.findOneAndUpdate({ _id: userId }, {
            $set: {
                name: userdata.name,
                email: userdata.email,
                address:[{
                    name: userdata.name,
                    house:userdata.house,
                    city:userdata.city,
                    postal:userdata.postal,
                    phone:userdata.phone
            }]
            }
        }).then((data) => {
            resolve(data)
        })

    })
}

//Change password

const changePassword = (data, userId) => {
    return new Promise(async (resolve, reject) => {
        const userdata = await user.findOne({ _id: userId })

        bcrypt.compare(data.currentpassword, userdata.password).then(async (status) => {
            if (status) {

                if (data.newpassword == data.confirmpassword) {
                    const salt = await bcrypt.genSalt(10)
                    const hashedpassword = await bcrypt.hash(data.newpassword, salt)
                    data.newpassword = hashedpassword
                    const update = await user.findOneAndUpdate({ _id: userId }, { $set: { password: data.newpassword } })
                    resolve({ status: true })

                } else {
                    resolve({ status: false })
                }
            } else {
                resolve({ status: false })
            }
        })
    })
}

const cancelOrder = (orderId) => {
    const orderid = new mongoose.Types.ObjectId(orderId)
    return new Promise(async (resolve, reject) => {
        const order = await Ordercollection.findOneAndUpdate({ _id: orderid }, { $set: { status: "Order cancelled" } })

        resolve()
    })
}

const addtowishlist = async (productid, userid) => {
    try {
        const productId = mongoose.Types.ObjectId(productid)
        const userWishlist = await wishList.findOne({ userId: userid })
        if (userWishlist) {
            await wishList.findOneAndUpdate({ userId: userid }, { $push: { products: { productId: productId } } })
        } else {
            const newWishlist = new wishList({
                userId: userid,
                products: [{
                    productId: productid
                }]
            })
            await newWishlist.save()
        }


    } catch (error) {
        throw error
    }
}

const productExistInCart = (productId, userId) => {
    return new Promise(async (resolve, reject) => {
        const usercart = await cart.findOne({ userId: userId })

        if (usercart) {
            const productAlreadyExist = await cart.findOne({ userid: userId }, { products: { $elemMatch: { productId: productId } } });
            const productLength = productAlreadyExist.products.length
            if (productLength != 0) {
                resolve(true)
            } else {
                resolve(false)
            }
        } else {
            resolve(false)
        }
    })
}
const productExistInWishlist = (productId, userId) => {
    return new Promise(async (resolve, reject) => {
        const userwishList = await wishList.findOne({ userId: userId })

        if (userwishList) {
            const productAlreadyExist = await wishList.findOne({ userId: userId }, { products: { $elemMatch: { productId: productId } } });
            const productLength = productAlreadyExist.products.length
            if (productLength != 0) {
                resolve(true)
            } else {
                resolve(false)
            }
        } else {
            resolve(false)
        }
    })
}


const getwishListitems = (userId) => {
    return new Promise(async (resolve, reject) => {
        const userid = new mongoose.Types.ObjectId(userId)
        const userwishList = await wishList.findOne({ userId: userid })
        if (userwishList) {
            const productdetails = await wishList.aggregate([
                { $match: { userId: userid } },

                { $unwind: "$products" },

                {
                    $project: {

                        productId: '$products.productId',
                    }
                }, {
                    $lookup: {
                        from: "products",
                        localField: "productId",
                        foreignField: "_id",
                        as: "wishlistproducts"
                    }
                }, {
                    $project: {

                        productId: 1,
                        wishListProduct: {
                            $arrayElemAt: ['$wishlistproducts', 0]
                        }
                    }
                },
                {
                    $project: {
                        productId: 1,
                        wishListProduct: 1,
                    }
                },
            ])

            if (productdetails.length != 0) {
                resolve({ productdetails, wishlistExist: true })
            } else {
                resolve({ wishlistExist: false })
            }
        } else {
            resolve({ wishlistExist: false })
        }

    })
}

const removefromwishlist = (details) => {
    const wishListId = new mongoose.Types.ObjectId(details.wishlistId)
    const productId = new mongoose.Types.ObjectId(details.productId)
    return new Promise(async (resolve, reject) => {
        await wishList.findOneAndUpdate({ _id: wishListId, products: { $elemMatch: { productId: productId } } }, {
            $pull: { products: { productId: productId } },
        })
        resolve()
    })
}

const listCoupon=async()=>{
    const coupons=await coupon.find({}).lean()
    return coupons
}


//......................................................................................................................................//


const getSignupPage = (req, res) => {
    res.render("user/user_signup", { existed: req.session.existed })
    req.session.existed = false
}
const getCartPage = async (req, res) => {
    const userProducts = await getcartitems(req.session.user._id)
    const userproducts = userProducts.productdetails
    const totalAmount = await totalamount(req.session.user._id)
    res.render("user/usercart", { userproducts, user: req.session.user, usercart: res.usercart, totalAmount })
}

const getHomepage = async (req, res) => {
    await admincontrol.listProduct().then(async(data) => {
        const product = data
        const productdata = product.map((product) => {
            return {
                _id: product._id,
                name: product.productname,
                price: product.productSRP,
                status:product.status,
                image: product.imageurl[0].filename
            }
        })
        const categories=await category.find({})
        const cagtegoryName=categories.map((category)=>{
            return{
                  _id:category._id,
                  name:category.categoryname
            }
        })
        res.render("user/home", { user: req.session.user, productdata, usercart: res.usercart,cagtegoryName })
    })
}

const getLoginpage = (req, res) => {
    if (req.session.loggedIn) {
        res.redirect("/")
    } else {
        res.render("user/user_login", { notexisted: req.session.usernotexist, pass: req.session.passErr, block: req.session.blocked })
        req.session.usernotexist = false
        req.session.passErr = false
        req.session.blocked = false
    }
}

const logout = (req, res) => {
    req.session.destroy()
    res.redirect("/")
}

const addTOCart = (req, res) => {
    addtoCart(req.params.id, req.session.user._id).then((data) => {
        if (data.status) {
            res.json({ status: true })
        } else if (data.alredyincart) {
            res.json({ alredyincart: true })
        }
    })
}

const singleProductview = (req, res) => {
    productView(req.params.id).then(async (response) => {
        const productdetails = response
        const cartExist = await productExistInCart(req.params.id, req.session.user._id)
        const wishlistExist = await productExistInWishlist(req.params.id, req.session.user._id)

        res.render("user/productview", { user: req.session.user, usercart: res.usercart, productdetails, cartExist, wishlistExist })

    })

}

const getCheckoutPage = async (req, res) => {
    let useraddress = await showAddress(req.session.user._id)
    const userproduct = await getcartitems(req.session.user._id)
    const userproducts = userproduct.productdetails
    const totalAmount = await totalamount(req.session.user._id)
    const cartdata = await cart.findOne({userId:req.session.user._id})
    const couponSavings=cartdata.cuponsavings
    const allTotal=parseInt(totalAmount-couponSavings)

  
    res.render("user/checkout", { user: req.session.user, usercart: res.usercart, userproducts, totalAmount, useraddress ,couponSavings,allTotal})
}

const addAnotherAddress = (req, res) => {
    res.render("user/address", { user: req.session.user, usercart: res.usercart })
}

const getUserProfile = async(req, res) => {
    const userdata=await user.findOne({_id:req.session.user._id}).lean()
    console.log(userdata,"888888888");
    
    res.render("user/userprofile", { userdata, usercart: res.usercart ,user:req.session.user})
}

const displayOrderSuccessPage = async (req, res) => {
    await deleteCart(req.session.user._id)
    res.render("user/ordersuccess", { user: req.session.user, usercart: res.usercart })
}

const getOrderDetails = async (req, res) => {
    const orderdetails = await viewOrderdetails(req.session.orderId)
    res.render("user/orderlist", { orderdetails, user: req.session.user, usercart: res.usercart })
}

const getAllOrderDetails = async (req, res) => {
    const orderdetails = await viewallOrderdetails(req.session.user._id)
    res.render("user/allorderlist", { orderdetails, user: req.session.user, usercart: res.usercart })
}

const getSingleView = async (req, res) => {
    const orderdetails = await viewOrderdetails(req.params.id)
    const orderstatus = orderdetails[0].status
    let delivered;
    if (orderstatus == "Delivered" || orderstatus == "Order cancelled") {
        delivered = true
    } else {
        delivered = false
    }
    res.render("user/orderlist", { orderdetails, user: req.session.user, usercart: res.usercart, delivered })
}

const getChangePasswordPage = (req, res) => {
    res.render("user/changepassword", { passErr: req.session.passErr })
    req.session.passErr = false
}

const userSignUp = (req, res) => {
    doSingup(req.body).then((data) => {
        req.session.clientid = data.data._id
        if (data.exist) {
            req.session.existed = true;
            res.redirect("/signup")
        } else {
            const useremail = req.body.email
            sendmail(useremail, req)
            res.render("user/otpverification")
        }
    })
}

const otpVerification = (req, res) => {
    const otp = parseInt(req.session.otp)
    const userOtp = parseInt(req.body.otp)
    verifyOtp(userOtp, otp).then(async (response) => {
        if (response.status) {
            await changeverificationstatus(req.session.clientid).then(() => {
                res.json({ status: true })
                req.session.otp = null;
                req.session.clientid = null
            })
        } else {
            res.json({ status: false })
        }
    })
}

const userLogin = (req, res) => {
    doLogin(req.body).then((response) => {
        if (response.usernotfound) {

            req.session.usernotexist = true;
            res.redirect("/login")
        }
        else if (response.blockedstatus) {
            req.session.blocked = true
            res.redirect("/login")
        }

        else {
            req.session.user = response.user
            if (response.status) {

                req.session.loggedIn = true;

                res.redirect("/")
            } else {


                req.session.passErr = true;
                res.redirect('/login')
            }
        }

    })
}

const changeCartProductQuantity = (req, res) => {
    changeproductquantity(req.body).then((response) => {
        console.log(response,"response from function");
        if(response.exceedstatus){
            console.log("false he");
            res.json({exceedstatus:true})
        }else{

            res.json(response)
        }
    })
}

const removeUserCartitem = (req, res) => {
    removeCartitem(req.body).then((response) => {
        res.json(response)
    })
}

const userCheckout = (req, res) => {
    addAddress(req.session.user._id, req.body)
    res.redirect("/checkout")
}

const userPlaceOrder = async (req, res) => {
    const cartproducts = await getcartitems(req.session.user._id)
    const cartproduct = await cartproducts.productdetails
    const totalAmount = await totalamount(req.session.user._id)
    placeorder(req.session.user._id, req.body, cartproduct, totalAmount).then(async (orderId) => {
        req.session.orderId = orderId
        if (req.body['payment-method'] === "COD") {
            res.json({ success: true })
        } else {
            await generateRazorpay(orderId, totalAmount).then(async (response) => {
                const userdata = await userdetails(req.session.user._id)
                const data = {
                    response: response,
                    user: userdata.address
                }

                res.json(data)
            })
        }
    })
}

const verifyOnlineypayment = async (req, res) => {
    await verifypayment(req.body).then(() => {
        changeStatus(req.body['order[receipt]']).then(() => {
            // req.session.orderId=req.body['order[receipt]']
            res.json({ paymentsuccess: true })
        })
    }).catch((err) => {
        res.json({ paymentsuccess: false })
    })
}

const editUserProfile = async (req, res) => {
    console.log("one");
    const updation = await editUserdetails(req.session.user._id, req.body)
    res.redirect("/account")
}

const resetPassword = async (req, res) => {
    const data = await changePassword(req.body, req.session.user._id)
    if (data.status) {

        res.json({ status: true })
    } else {
        req.session.passErr = true
        res.json({ status: false })
    }
}

const userCancelOrder = async (req, res) => {
    const orderId = req.body.orderid;
    const cancel = await cancelOrder(orderId)
    res.json({ status: true })
}

const addTowishlist = async (req, res) => {
    const productId = req.body.ProductId
    await addtowishlist(productId, req.session.user._id)
    res.json({ status: true })

}

const getWishlist = async (req, res) => {
    const products = await getwishListitems(req.session.user._id)
    let wishlistExist;
    if (products.wishlistExist == true) {
        wishlistExist = true
    } else {
        wishlistExist = false
    }
    res.render("user/wishlist", { user: req.session.user, products, usercart: res.usercart, wishlistExist })
}

const removeWishlistItem = async (req, res) => {
    const details = req.body
    await removefromwishlist(details)
    res.json({ status: true })
}

const getcoupons=async(req,res)=>{
    const coupons=await listCoupon()
    res.render("user/usercoupons",{user:req.session.user,usercart: res.usercart,coupons})
}

const userApplyCoupon=async(req,res)=>{
    const couponcode=req.body.code
    const date= new Date();
    const Coupon=await coupon.findOne({couponCode:couponcode})
    const totalAmount = await totalamount(req.session.user._id)   
    if(Coupon){
        const minimumAmount=Coupon.minOrderAmount
        const exdate=new Date(Coupon.expiryDate)
        if(exdate>=date){
           if(totalAmount>Coupon.minOrderAmount){
            let discount=parseInt((totalAmount*Coupon.disCount)/100)
            let totaldisconut=0;
            if (Coupon.maxDiscountAmount> discount) {
                totaldisconut = discount
            } else {
                totaldisconut = Coupon.maxDiscountAmount
            }          
            await cart.findOneAndUpdate({userId:req.session.user._id},{$set:{cuponsavings:totaldisconut}})
            res.json({ status: true, Coupon, min_total: true, totaldisconut ,minimumAmount})        
           }else{
            res.json({ status: true, min_total: false, Coupon })
           }
        }else{
            res.json({ status: false })
        }
    }else {
        res.json({ status: false })
    }
  

}

const categoryFilter=async(req,res)=>{
    const categoryName=req.params.id
    const products =await product.find({ productcategory:categoryName })
    const productdata = products.map((product) => {
        return {
            _id: product._id,
            status:product.status,
            name: product.productname,
            price: product.productSRP,
            image: product.imageurl[0].filename
        }
    })
        const categories=await category.find({})

    const cagtegoryName=categories.map((category)=>{
        return{
              _id:category._id,
              name:category.categoryname
        }
    })
    res.render("user/categorywise", { user: req.session.user, productdata, usercart: res.usercart })
    
    
    
 

}

module.exports = {

    doSingup,
    doLogin,
    verifyOtp,
    changeverificationstatus,
    addtoCart,
    totalquantity,
    getcartitems,
    changeproductquantity,
    removeCartitem,
    totalPrice,
    totalamount,
    productView,
    addAddress,
    showAddress,
    userdetails,
    placeorder,
    deleteCart,
    viewOrderdetails,
    viewallOrderdetails,
    generateRazorpay,
    verifypayment,
    changeStatus,
    editUserdetails,
    changePassword,
    cancelOrder,
    getSignupPage,
    getCartPage,
    getHomepage,
    getLoginpage,
    logout,
    addTOCart,
    singleProductview,
    getCheckoutPage,
    addAnotherAddress,
    getUserProfile,
    displayOrderSuccessPage,
    getOrderDetails,
    getAllOrderDetails,
    getSingleView,
    getChangePasswordPage,
 
    userSignUp,
    otpVerification,
    userLogin,
    changeCartProductQuantity,
    removeUserCartitem,
    userCheckout,
    userPlaceOrder,
    verifyOnlineypayment,
    editUserProfile,
    resetPassword,
    userCancelOrder,
    addTowishlist,
    addtowishlist,
    productExistInCart,
    getWishlist,
    productExistInWishlist,
    removeWishlistItem,
    removefromwishlist,
    getcoupons,
    listCoupon,
    userApplyCoupon,
    categoryFilter
}







