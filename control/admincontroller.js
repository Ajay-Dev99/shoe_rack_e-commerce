const mongoose = require("mongoose");
const admin = require("../models/admin")
const user = require("../models/usermodel")
const categorycollection = require("../models/categoriesmodel")
const product = require("../models/productmodel")
const bcrypt = require("bcrypt")
const e = require("express")
const { response } = require("../app")
const Ordercollection=require("../models/ordermodel")

module.exports = {

    //adminlogin
    doadminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                const cleint = await admin.findOne({ email: adminData.email })
                if (cleint) {

                    bcrypt.compare(adminData.password, cleint.password).then((status) => {
                        if (status) {
                            resolve({ login: true })
                          
                        } else {
                            resolve({ status: false })
                           
                        }
                    })
                } else {
                    resolve({ usernotfound: true })
                  
                }

            } catch (error) {
                throw error
            }
        })
    },

    //listusers
    listUsers: () => {

        return new Promise(async (resolve, reject) => {
            try {
                await user.find({}).lean().then((users) => {
                    resolve(users)
                }).catch((error) => {
                    throw error
                })


            } catch (error) {
                throw error;
            }

        })

    },

    //------block user---------
    blockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await user.updateOne({ _id: userId }, { $set: { blocked: true } }).then((response) => {
                    resolve({ status: true })
                }).catch((error) => {
                    throw error
                })
            } catch (error) {
                throw error
            }
        })
    },

    //------Unblock user---------
    unblockUser: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await user.updateOne({ _id: userId }, { $set: { blocked: false } }).then((respone) => {
                    resolve({ status: true })
                }).catch((error) => {
                    throw error
                })
            } catch (error) {
                throw error
            }

        })
    },
    //add category
    addCategory: (categoryDetails, img) => {

        return new Promise(async (resolve, reject) => {

            try {
                const newCategory = new categorycollection({
                    categoryname: categoryDetails.categoryname,
                    imageurl: img.filename
                })
                return await newCategory.save()
                    .then((data) => {
                        resolve(data)
                    }).catch((error) => {
                        throw error;
                    })
            } catch (error) {
                throw error
            }


        })
    },

    //editcategory

    editCategory:(catergoryId)=>{

        return new Promise((resolve,reject)=>{
            const category= categorycollection.findOne({_id:catergoryId}).lean()
            resolve(category)
        })
    },


    //Listcategory
    listCategory: () => {
        return new Promise(async (resolve, reject) => {
            try {
                await categorycollection.find({}).lean().then((categories) => {
                    resolve(categories)
                }).catch((error) => {
                    throw error
                })
            } catch (error) {
                throw error
            }
        })
    },

    //add product
    addproduct: (productDetails, img) => {

        return new Promise(async (resolve, reject) => {
            try {
                const newProduct = new product({
                    productname: productDetails.productname,
                    productcategory: productDetails.productcategory,
                    productMRP: productDetails.productMRP,
                    productSRP: productDetails.productSRP,
                    productstock: productDetails.productstock,
                    imageurl: img,
                    productdescription: productDetails.productdescription
                })

                return await newProduct.save().then((data) => {
                    resolve(data)
                }).catch((error) => {
                    throw error
                })

            } catch (error) {
                throw error
            }
        })

    },

    //List product

    listProduct: () => {
        return new Promise(async (resolve, reject) => {
            try {
                await product.find({}).lean().then((products) => {

                    resolve(products)
                }).catch((error) => {
                    throw error
                })
            } catch (error) {
                throw error
            }
        })
    },

    //list orders

    listOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            const orders = await Ordercollection.find().populate('orderitem.product').lean()
           resolve(orders)
        })
    },
    
    //changeorderstaatus

    changeOrderstatus:(data)=>{
        return new Promise(async(reject,resolve)=>{
            const orderstatus=data.orderstatus
            const orderId=new mongoose.Types.ObjectId(data.orderId)
          
            const order=await Ordercollection.findOneAndUpdate({_id:orderId},{$set:{status:orderstatus}})
           
        })
    }

}