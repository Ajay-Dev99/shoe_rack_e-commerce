const express = require('express');
const router = express.Router();
const usercontrol = require("../control/usercontroller")
const e = require('express');
const {verifyLogin,cartCount}=require("../Middlewares/userMiddlewares");
const admin = require('../models/admin');


  //Get Methods
router.get('/', cartCount, usercontrol.getHomepage)
router.get("/login",usercontrol.getLoginpage)
router.get("/signup",usercontrol.getSignupPage)
router.get("/logout",usercontrol.logout)
router.get("/addtocart/:id", verifyLogin, usercontrol.addTOCart)
router.get("/cart", verifyLogin, cartCount,usercontrol.getCartPage)
router.get("/productview/:id", verifyLogin, cartCount,usercontrol.singleProductview)
router.get("/checkout", verifyLogin, cartCount,usercontrol.getCheckoutPage)
router.get("/addaddress", verifyLogin, cartCount,usercontrol.addAnotherAddress)
router.get("/account", verifyLogin, cartCount,usercontrol.getUserProfile)
router.get("/ordersuccess", verifyLogin, cartCount,usercontrol.displayOrderSuccessPage)
router.get("/orderdetials", verifyLogin, cartCount, usercontrol.getOrderDetails)
router.get("/allorderdetials", verifyLogin, cartCount,usercontrol.getAllOrderDetails)
router.get("/singleview/:id", verifyLogin, cartCount,usercontrol.getSingleView)
router.get("/changepassword", verifyLogin,usercontrol.getChangePasswordPage)
router.get("/wishlist",verifyLogin,cartCount,usercontrol.getWishlist)
router.get("/usercoupons",verifyLogin,cartCount,usercontrol.getcoupons)

  //Post Methods
router.post("/signup-user", usercontrol.userSignUp)
router.post("/otpverification",usercontrol.otpVerification)
router.post("/login",usercontrol.userLogin)
router.post("/change-product-quantity", verifyLogin,usercontrol.changeCartProductQuantity)
router.post("/removecartitem", verifyLogin,usercontrol.removeUserCartitem)
router.post("/checkoutform", verifyLogin,usercontrol.userCheckout)
router.post("/place-order", verifyLogin, usercontrol.userPlaceOrder)
router.post("/verify-payment", verifyLogin,usercontrol.verifyOnlineypayment)
router.post("/edituserdetails", verifyLogin,usercontrol.editUserProfile)
router.post("/resetpassword", verifyLogin,usercontrol.resetPassword) 
router.post("/cancelorder",verifyLogin,usercontrol.userCancelOrder)
router.post("/addtowishlist",verifyLogin,usercontrol.addTowishlist)
router.post("/removefromwishlist",verifyLogin,usercontrol.removeWishlistItem)
router.post("/applycoupon",usercontrol.userApplyCoupon)
router.post("/categoryfilter",usercontrol.categoryFilter)


 



module.exports = router;
