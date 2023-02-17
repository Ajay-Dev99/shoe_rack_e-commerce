const mongoose = require("mongoose");
const admin = require("../models/admin")
const user = require("../models/usermodel")
const categorycollection = require("../models/categoriesmodel")
const product = require("../models/productmodel")
const bcrypt = require("bcrypt")
const e = require("express")
const { response } = require("../app")
const Ordercollection = require("../models/ordermodel")
const coupon = require("../models/couponmodel")
const salesreport = require("../utilities/pdfgenerator")


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
        const catergoryName = categoryDetails.categoryname
        const alreadyexist = await categorycollection.findOne({ categoryname: catergoryName })
        if (alreadyexist) {
            resolve({ alreadyexist: true })
        } else {
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

const addcoupon = (couponDetials) => {
    return new Promise(async (resolve, reject) => {
        const couponname = couponDetials.code
        const alreadyexist = await coupon.findOne({ couponCode: couponname })
        if (alreadyexist) {
            resolve({ alreadyexist: true })
        } else {
            const newCoupon = new coupon({
                couponCode: couponDetials.code,
                disCount: couponDetials.discount,
                expiryDate: couponDetials.expiryDate,
                maxDiscountAmount: couponDetials.maxDiscount,
                minOrderAmount: couponDetials.minAmount
            })
            await newCoupon.save()
            resolve({ status: true })
        }
    })
}

const listCoupon = async () => {
    try {
        const coupons = await coupon.find({}).lean()
        return coupons
    } catch (error) {
        throw new Error(error)
    }
}

//.............................................................................................................................................//

const getadminPage = (req, res) => {
    try {
        if (req.session.adminloggedin) {
            res.redirect("/admin/home")
        } else {
            res.render('admin/admin_login', { notfound: req.session.notfound, passErr: req.session.passwordErr });
            req.session.notfound = false
            req.session.passwordErr = false
        }
    } catch (error) {
        throw new Error(error)
    }
}

const getOrdersByMonth = () => {
    return new Promise(async (resolve) => {
        let orders = await Ordercollection.aggregate([

            {
                $group: {
                    _id: "$monthinNO",
                    total: { $sum: '$totalamount' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])
        let details = [];
        orders.forEach(element => {
            details.push(element.total)
        });
        resolve(details)
    })
}


const getAdminDashboard = async (req, res) => {
    try {
        const userCount = await user.countDocuments({})
        const productCount = await product.countDocuments({})
        const orderCount = await Ordercollection.countDocuments({})
        const total = await Ordercollection.aggregate([
            { $group: { _id: null, total: { $sum: "$totalamount" } } }
        ])
        const monthdetails = await getOrdersByMonth()




        res.render('admin/admin_dashboard', { admin: req.session.adminloggedin, userCount, productCount, orderCount, total, monthdetails })
    } catch (error) {
        throw new Error(error)
    }
}

const getSalesreport = (req, res) => {
    console.log("hoiii");
    const stream = res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Dispositon': 'attachement;filename=invoice.pdf'
    })

    pdfservice.buildPDF(
        (chunk) => stream.write(chunk),
        () => stream.end()
    )
}

const adminLogout = (req, res) => {
    try {
        res.redirect("/admin")
        req.session.destroy()
    } catch (error) {
        throw new Error(error)
    }
}

const getUserlist = (req, res) => {
    try {
        listUsers().then((response) => {
            res.render("admin/admin_userlist", { usersData: response })
        })
    } catch (error) {
        throw new Error(error)
    }
}

const adminBlockUser = (req, res) => {
    try {
        blockUser(req.params.id).then((data) => {
            res.redirect("/admin/listusers")
        })
    } catch (error) {
        throw new Error(error)
    }
}

const adminUnblockUser = (req, res) => {
    try {
        unblockUser(req.params.id).then((data) => {
            res.redirect("/admin/listusers")
        })
    } catch (error) {
        throw new Error(error)
    }
}

const adminAddproduct = (req, res) => {
    try {
        listCategory().then((categories) => {
            res.render("admin/admin_addproduct", { categories })
        })
    } catch (error) {
        throw new Error(error)
    }
}

const adminCategoryManagement = (req, res) => {
    try {
        listCategory().then((categories) => {
            res.render("admin/admin_categories", { categories })
        })
    } catch (error) {
        throw new Error(error)
    }
}

const adminEditCategory = async (req, res) => {
    try {
        const category = await editCategory(req.params.id)
        res.render("admin/admin_editcategory", { category })
    } catch (error) {
        throw new Error(error)
    }
}

const listProducts = (req, res) => {
    try {
        listProduct().then((response) => {
            res.render("admin/admin_product", { response })
        })
    } catch (error) {
        throw new Error(error)
    }
}

const adminListorders = async (req, res) => {
    try {
        const orders = await listOrders()
        res.render("admin/admin_orderlist", { orders })
    } catch (error) {
        throw new Error(error)
    }
}

const adminOrderDetails = async (req, res) => {
    try {
        const orderdetails = await viewOrderdetails(req.params.id)
        if (orderdetails[0].status === "Order cancelled") {
            const ordercancelled = true
            res.render("admin/orderstatuschange", { orderdetails, ordercancelled })
        } else {
            res.render("admin/orderstatuschange", { orderdetails })
        }
    } catch (error) {
        throw new Error(error)
    }
}

const adminLogin = (req, res) => {
    try {
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
    } catch (error) {
        throw new Error(error)
    }
}

const adminAddCategory = (req, res) => {
    try {
        addCategory(req.body, req.file).then((data) => {
            if (data.alreadyexist) {
                res.json({ alreadyexist: true })
            } else {

                res.json({ status: true })
            }
        })
    } catch (error) {
        throw new Error(error)
    }
}

const adminAddProduct = async (req, res) => {
    try {
        await addproduct(req.body, req.files).then((data) => {
            res.redirect("/admin/listproducts")
        })
    } catch (error) {
        throw new Error(error)
    }
}

const adminChangeOrderStatus = (req, res) => {
    try {
        changeOrderstatus(req.body)
        res.json({ status: true })
    } catch (error) {
        throw new Error(error)
    }
}

const adminCouponMangement = async (req, res) => {
    try {
        const coupons = await listCoupon()
        res.render("admin/admin_addcoupon", { coupons })
    } catch (error) {
        throw new Error(error)
    }
}

const adminaddcoupon = async (req, res) => {
    try {
        await addcoupon(req.body).then((response) => {

            if (response.alreadyexist) {
                res.json({ alreadyexist: true })
            } else {
                res.json({ status: true })
            }
        })
    } catch (error) {
        throw new Error(error)
    }
}

const disableProduct = async (req, res) => {
    try {
        const productId = req.body.proId
        await product.findOneAndUpdate({ _id: productId }, { $set: { status: false } })
        res.json({ status: true })
    } catch (error) {
        throw new Error(error)
    }
}

const enableProduct = async (req, res) => {
    try {
        const productId = req.body.proId
        await product.findOneAndUpdate({ _id: productId }, { $set: { status: true } })
        res.json({ status: true })
    } catch (error) {
        throw new Error(error)
    }
}

const editProduct = async (req, res) => {
    try {
        const proId = req.params.id
        const products = await product.findOne({ _id: proId }).lean()
        const categories = await listCategory()
        res.render("admin/admin_editproduct", { products, categories })
    } catch (error) {
        throw new Error(error)
    }
}

const editCoupon = async (req, res) => {
    try {
        const couponId = req.params.id
        const coupons = await coupon.findOne({ _id: couponId }).lean()
        res.render("admin/admin_editcoupon", { coupons })
    } catch (error) {
        throw new Error(error)
    }
}

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryId
        await categorycollection.deleteOne({ _id: categoryId })
        res.json({ status: true })
    } catch (error) {
        throw new Error(error)
    }
}

const updateCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId
        await coupon.findOneAndUpdate({ _id: couponId }, {
            $set: {
                couponCode: req.body.code,
                disCount: req.body.discount,
                expiryDate: req.body.expiryDate,
                maxDiscountAmount: req.body.maxDiscount,
                minOrderAmount: req.body.minAmount,
            }
        })
            .then(() => {
                res.json({ status: true })
            })
    } catch (error) {
        throw new Error(error)
    }
}

const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.body.couponId
        await coupon.deleteOne({ _id: couponId }).then(() => {
            res.json({ status: true })
        })
    } catch (error) {
        throw new Error(error)
    }

}

const updateCategory = async (req, res) => {
    try {
        const categoryId = req.body.categoryid
        if (req.file) {
            await categorycollection.findOneAndUpdate({ _id: categoryId }, {
                $set: {
                    categoryname: req.body.categoryname,
                    imageurl: req.file.filename
                }
            }).then(() => {
                res.redirect("/admin/categories")
            })
        } else {
            await categorycollection.findOneAndUpdate({ _id: categoryId }, {
                $set: {
                    categoryname: req.body.categoryname,

                }
            }).then(() => {
                res.redirect("/admin/categories")
            })
        }
    } catch (error) {
        throw new Error(error)
    }

}

const updateProduct = async (req, res) => {
    try {
        const productId = req.body.productid
        const products = await product.findOne({ _id: productId })


        const images = [];

        if (req.files) {
            if (!req.files.image0) {
                images.push(products.imageurl[0])
            } else {
                images.push(req.files.image0[0])
            }
            if (!req.files.image1) {
                images.push(products.imageurl[1])
            } else {
                images.push(req.files.image1[0])

            }
            if (!req.files.image2) {
                images.push(products.imageurl[2])
            } else {
                images.push(req.files.image2[0])

            }
            if (!req.files.image3) {
                images.push(products.imageurl[3])
            } else {
                images.push(req.files.image3[0])

            }

            await product.findOneAndUpdate({ _id: productId }, {
                $set: {
                    imageurl: images
                }
            })


        }


        if (req.body.image) {

        } else {
            await product.findOneAndUpdate({ _id: productId }, {
                $set: {
                    productname: req.body.productname,
                    productcategory: req.body.productcategory,
                    productMRP: req.body.productMRP,
                    productSRP: req.body.productSRP,
                    productstock: req.body.productstock,
                    productdescription: req.body.productdescription,
                }
            }).then(() => {
                res.redirect("/admin/listproducts")
            })

        }
    } catch (error) {
        throw new Error(error)
    }

}

const salesReport = (req, res) => {
    console.log(req.body);
    const details = req.body
    return new Promise(async (resolve, reject) => {
        if (new Date(details.fromdate) < new Date() && new Date(details.todate) < new Date()) {
            console.log("entered to if");
            let data = await Ordercollection.aggregate([
                {
                    $match: { status: "Delivered"}
                },
                {
                    $group: {
                        _id: "$_id",
                        total: { $sum: '$totalamount' },
                        orderCount: { $sum: 1 },

                    }
                },

            ])
            console.log(data, "llllll");
            salesreport(data).then(() => {
                res.json({status:true})
            })
        }
        else {
            console.log("entered to else");
            res.json({status:false})
        }
    })
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
    adminaddcoupon,
    addcoupon,
    listCoupon,
    disableProduct,
    enableProduct,
    getOrdersByMonth,
    editProduct,
    editCoupon,
    deleteCategory,
    updateCoupon,
    deleteCoupon,
    updateCategory,
    updateProduct,
    getSalesreport,
    salesReport


}