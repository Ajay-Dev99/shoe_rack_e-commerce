const mongoose = require("mongoose");
const admin = require("../models/admin")
const user = require("../models/usermodel")
const categorycollection = require("../models/categoriesmodel")
const product = require("../models/productmodel")
const bcrypt = require("bcrypt")
const e = require("express")
const { response } = require("../app")
const Ordercollection=require("../models/ordermodel")



    //adminlogin
  const  doadminLogin= (adminData) => {
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
    }

    //listusers
   const listUsers= () => {

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

    }

    //------block user---------
   const blockUser= (userId) => {
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
    }

    //------Unblock user---------
   const unblockUser= (userId) => {
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
    }
    //add category
   const addCategory = (categoryDetails, img) => {

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
    }

    //editcategory

   const editCategory=(catergoryId)=>{

        return new Promise((resolve,reject)=>{
            const category= categorycollection.findOne({_id:catergoryId}).lean()
            resolve(category)
        })
    }


    //Listcategory
  const  listCategory= () => {
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
    }

    //add product
   const addproduct = (productDetails, img) => {

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

    }

    //List product

   const listProduct = () => {
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
    }

    //list orders

  const  listOrders=()=>{
        return new Promise(async(resolve,reject)=>{
            const orders = await Ordercollection.find().populate('orderitem.product').lean()
           resolve(orders)
        })
    }
    
    //changeorderstaatus

  const  changeOrderstatus=(data)=>{
        return new Promise(async(reject,resolve)=>{
            const orderstatus=data.orderstatus
            const orderId=new mongoose.Types.ObjectId(data.orderId) 
            const order=await Ordercollection.findOneAndUpdate({_id:orderId},{$set:{status:orderstatus}})
           
        })
    }


    const getadminPage=(req,res)=>{
        if (req.session.adminloggedin) {
            res.redirect("/admin/home")
          } else {
            res.render('admin/admin_login', { notfound: req.session.notfound, passErr: req.session.passwordErr });
            req.session.notfound = false
            req.session.passwordErr = false
          }
    }

  module.exports={
    
    doadminLogin,
    listUsers,
    blockUser,
    unblockUser,
    addCategory,
    editCategory,
    listCategory,
    addproduct,
    listProduct,
    listOrders,
    changeOrderstatus,


    getadminPage,


  }