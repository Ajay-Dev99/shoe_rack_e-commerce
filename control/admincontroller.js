const mongoose = require("mongoose");
const admin = require("../models/admin")
const user = require("../models/usermodel")
const categorycollection = require("../models/categoriesmodel")
const product = require("../models/productmodel")
const bcrypt = require("bcrypt")
const e = require("express")
const { response } = require("../app")
const Ordercollection = require("../models/ordermodel")




//adminlogin
const doadminLogin = (adminData) => {
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
const listUsers = () => {

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
const blockUser = (userId) => {
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
const unblockUser = (userId) => {
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

const editCategory = (catergoryId) => {

    return new Promise((resolve, reject) => {
        const category = categorycollection.findOne({ _id: catergoryId }).lean()
        resolve(category)
    })
}


//Listcategory
const listCategory = () => {
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

const listOrders = () => {
    return new Promise(async (resolve, reject) => {
        const orders = await Ordercollection.find().populate('orderitem.product').lean()
        resolve(orders)
    })
}

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

//changeorderstaatus

const changeOrderstatus = (data) => {
    return new Promise(async (reject, resolve) => {
        const orderstatus = data.orderstatus
        const orderId = new mongoose.Types.ObjectId(data.orderId)
        const order = await Ordercollection.findOneAndUpdate({ _id: orderId }, { $set: { status: orderstatus } })

    })
}


const getadminPage = (req, res) => {
    if (req.session.adminloggedin) {
        res.redirect("/admin/home")
    } else {
        res.render('admin/admin_login', { notfound: req.session.notfound, passErr: req.session.passwordErr });
        req.session.notfound = false
        req.session.passwordErr = false
    }
}

const getAdminDashboard = (req, res) => {
    res.render('admin/admin_dashboard', { admin: req.session.adminloggedin })
}

const adminLogout=(req,res)=>{
    res.redirect("/admin")
    req.session.destroy()
}

const getUserlist=(req,res)=>{
    listUsers().then((response)=>{
        res.render("admin/admin_userlist",{usersData:response})
    })
}

const adminBlockUser=(req,res)=>{
    blockUser(req.params.id).then((data)=>{
        res.redirect("/admin/listusers")
      })
}

const adminUnblockUser=(req,res)=>{
    unblockUser(req.params.id).then((data)=>{
        res.redirect("/admin/listusers")
      })
}

const adminAddproduct=(req,res)=>{
    listCategory().then((categories)=>{
        res.render("admin/admin_addproduct",{categories}) 
      })
}

const adminCategoryManagement=(req,res)=>{
        listCategory().then((categories)=>{
        res.render("admin/admin_categories",{categories})
      })
     
}

const adminEditCategory=async(req,res)=>{
    const category=await editCategory(req.params.id)
    res.render("admin/admin_editcategory",{category})
}

const listProducts=(req,res)=>{
    listProduct().then((response)=>{
     res.render("admin/admin_product",{response})
      })
}

const adminListorders=async(req,res)=>{
    const orders=await listOrders()
    res.render("admin/admin_orderlist",{orders,})
}

const adminOrderDetails=async(req,res)=>{
    const orderdetails= await viewOrderdetails(req.params.id)
  res.render("admin/orderstatuschange",{orderdetails})
}

const adminLogin=(req,res)=>{
    doadminLogin(req.body).then((response) => {
        if (response.usernotfound) {
          req.session.notfound = true
          res.redirect("/admin")
        } else {
          if (response.login) {
            req.session.adminloggedin = true
            res.redirect("/admin/home")
          } else {
            req.session.passwordErr = true
            res.redirect("/admin")
          }
        }
      })
}

const adminAddCategory=(req,res)=>{
    addCategory(req.body,req.file).then((data)=>{ 
        res.redirect("/admin/categories")
      })
}

const adminAddProduct=async(req,res)=>{
  await addproduct(req.body,req.files).then((data)=>{  
    res.redirect("/admin/addproduct")
  })
}

const adminChangeOrderStatus=(req,res)=>{
    changeOrderstatus(req.body)
    res.json({status:true})
}

const adminCouponMangement=(req,res)=>{
    res.render("admin/admin_addcoupon")
}

module.exports = {

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
    viewOrderdetails,
    changeOrderstatus,


    getadminPage,
    getAdminDashboard,
    adminLogout,
    getUserlist,
    adminBlockUser,
    adminUnblockUser,
    adminAddproduct,
    adminCategoryManagement,
    adminEditCategory,
    listProducts,
    adminListorders,
    adminOrderDetails,
    
    adminLogin,
    adminAddCategory,
    adminAddProduct,
    adminChangeOrderStatus,
    adminCouponMangement,
    

}