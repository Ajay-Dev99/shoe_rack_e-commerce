const express = require('express');
const { response } = require('../app');
const router = express.Router();
const admincontrol = require("../control/admincontroller")
const {categoryimgupload,updateProduct}= require("../utilities/imageUpload")

const multer = require('multer');
const { compareSync } = require('bcrypt');
const verifyLogin=require("../middlewares/adminMiddlewares")


router.get('/', admincontrol.getadminPage)
router.get("/home", verifyLogin,admincontrol.getAdminDashboard)
router.get("/logout",admincontrol.adminLogout)
router.get("/listusers",verifyLogin,admincontrol.getUserlist)
router.get("/blockuser/:id",verifyLogin,admincontrol.adminBlockUser)
router.get("/unblockuser/:id",verifyLogin,admincontrol.adminUnblockUser)
router.get("/addproduct",verifyLogin,admincontrol.adminAddproduct)
router.get("/categories",verifyLogin,admincontrol.adminCategoryManagement)
router.get("/editcategory/:id",verifyLogin,admincontrol.adminEditCategory)
router.get("/listproducts",verifyLogin,admincontrol.listProducts)
router.get("/orders",verifyLogin,admincontrol.adminListorders)
router.get("/orderaction/:id",verifyLogin,admincontrol.adminOrderDetails)
router.get("/addcoupon",verifyLogin,admincontrol.adminCouponMangement)
router.get("/editproduct/:id",verifyLogin,admincontrol.editProduct)
router.get("/editcoupon/:id",verifyLogin,admincontrol.editCoupon)


router.post('/login',admincontrol.adminLogin)
router.post("/addcategory",verifyLogin,categoryimgupload.single('image'),admincontrol.adminAddCategory)
router.post("/add_product",verifyLogin,categoryimgupload.array('image',4),admincontrol.adminAddProduct)
router.post("/changeorderstatus",admincontrol.adminChangeOrderStatus)
router.post("/addcoupon",verifyLogin,admincontrol.adminaddcoupon)
router.post("/disableproduct",verifyLogin,admincontrol.disableProduct)
router.post("/enableProduct",verifyLogin,admincontrol.enableProduct)
router.post("/deletecategory",verifyLogin,admincontrol.deleteCategory)
router.post("/updatecoupon",verifyLogin,admincontrol.updateCoupon)
router.post("/deletecoupon",verifyLogin,admincontrol.deleteCoupon)
router.post("/updatecategory",verifyLogin,categoryimgupload.single('image'),admincontrol.updateCategory)
router.post("/updateproduct",verifyLogin,updateProduct.fields([{name:"image0",maxCount:1},{name:"image1",maxCount:1},{name:"image2",maxCount:1},{name:"image3",maxCount:1}]),admincontrol.updateProduct)



module.exports = router;
