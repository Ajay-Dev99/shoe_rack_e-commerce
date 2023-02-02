const express = require('express');
const router = express.Router();
const control = require("../control/usercontroller")
const admincontrol = require("../control/admincontroller");
const e = require('express');
const usercontrol = require('../control/usercontroller');
const sendmail = require('../config/nodemailer')
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect("/login")
    res.json({loggedin:false})
  }
}

const cartCount = async (req, res, next) => {
  if (req.session.loggedIn) {
    const totalqty = await control.totalquantity(req.session.user._id)
    res.usercart = totalqty
    next()
  } else {
    let totalqty = 0;
    res.usercart = totalqty
    next();
  }

}

router.get('/', cartCount, async function (req, res,) {
  
 
  await admincontrol.listProduct().then((data) => {
    const product = data
    const productdata = product.map((product) => {
      return {
        _id: product._id,
        name: product.productname,
        price: product.productSRP,
        image: product.imageurl[0].filename
      }
    })
    res.render("user/home", { user: req.session.user, productdata, usercart: res.usercart })
  })
})



router.get("/signup", (req, res) => {
  res.render("user/user_signup", { existed: req.session.existed })
  req.session.existed = false
})

router.post("/signup-user", (req, res) => {
  control.doSingup(req.body).then((data) => {
    if (data.exist) {
      req.session.existed = true;
      res.redirect("/signup")
    } else {
      const useremail=req.body.email
      sendmail(useremail,req)
     
      res.render("user/otpverification")

    }
  })
})
//otp verification
router.post("/otpverification",(req,res)=>{

  const otp=parseInt(req.session.otp)
  const userOtp=parseInt(req.body.otp)
  control.verifyOtp(userOtp,otp).then((response)=>{
    if(response.status){
      res.json({status:true})
      req.session.otp=null;
    }else{
      res.json({status:false})
    }
  })
  
})

router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/")
  } else {
    res.render("user/user_login", { notexisted: req.session.usernotexist, pass: req.session.passErr, block: req.session.blocked })
    req.session.usernotexist = false
    req.session.passErr = false
    req.session.blocked = false
  }

})

router.post("/login", (req, res) => {

  control.doLogin(req.body).then((response) => {
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
})

router.get("/logout", (req, res) => {
  req.session.destroy()
  res.redirect("/")
})


//addtocart
router.get("/addtocart/:id", verifyLogin, (req, res) => {
  control.addtoCart(req.params.id, req.session.user._id).then((data) => {
    res.json({ status: true })
  })
})

//cart
router.get("/cart", verifyLogin, cartCount, async (req, res) => {

  const userProducts = await control.getcartitems(req.session.user._id)
  const userproducts = userProducts.productdetails
  const totalAmount = await control.totalAmount(req.session.user._id)

  res.render("user/usercart", { userproducts, user: req.session.user, usercart: res.usercart, totalAmount })



})

//cart increment

router.post("/change-product-quantity", verifyLogin, (req, res) => {
  control.changeproductquantity(req.body).then((response) => {
    res.json(response)
  })
})

//Remove cart items

router.post("/removecartitem", verifyLogin, (req, res) => {
  control.removeCartitem(req.body).then((response) => {
    res.json(response)
  })
})

//single product view

router.get("/productview/:id", verifyLogin, cartCount, (req, res) => {
  control.productView(req.params.id).then((response) => {
    const productdetails = response
    res.render("user/productview", { user: req.session.user, usercart: res.usercart, productdetails })
  })
})

//checkout
router.get("/checkout", verifyLogin, cartCount, async (req, res) => {
  let useraddress = await control.showAddress(req.session.user._id)
  const userproduct = await control.getcartitems(req.session.user._id)
  const userproducts = userproduct.productdetails
  const totalAmount = await control.totalAmount(req.session.user._id)

  res.render("user/checkout", { user: req.session.user, usercart: res.usercart, userproducts, totalAmount, useraddress })
})

//add address

router.get("/addaddress", verifyLogin, cartCount, (req, res) => {
  res.render("user/address", { user: req.session.user, usercart: res.usercart })
})



router.post("/checkoutform", (req, res) => {
  control.addAddress(req.session.user._id, req.body)
  res.redirect("/checkout")
})


//place order

router.post("/place-order", async (req, res) => {

  const cartproducts = await control.getcartitems(req.session.user._id)
  const cartproduct = await cartproducts.productdetails
  const totalAmount = await control.totalAmount(req.session.user._id)
  control.placeorder(req.session.user._id, req.body, cartproduct, totalAmount).then(async(orderId) => {
   
    if(req.body['payment-method'] === "COD"){
        res.json({ success: true })
    }else{
      await control.generateRazorpay(orderId,totalAmount).then((response)=>{
        const data={
          response:response,
          user:req.session.user.address
        }

        res.json(data)
      })
    }
  })
})

//place order successfull

router.get("/ordersuccess",verifyLogin,cartCount, async(req, res) => {
   await control.deleteCart(req.session.user._id)
  res.render("user/ordersuccess", { user: req.session.user, usercart: res.usercart })
})

//account

router.get("/account", cartCount, (req, res) => {
  res.render("user/userprofile", { user: req.session.user, usercart: res.usercart })
})

//orderlist

router.get("/orderdetials", verifyLogin, cartCount, async (req, res) => {
  const orderdetails = await control.viewOrderdetails(req.session.user._id)
  res.render("user/orderlist", { orderdetails, user: req.session.user, usercart: res.usercart })
})

router.post("/verify-payment",async(req,res)=>{
  
    await control.verifypayment(req.body).then(()=>{
        control.changeStatus(req.body['order[receipt]']).then(()=>{
        res.json({paymentsuccess:true})
      })
  }).catch((err)=>{
        res.json({paymentsuccess:false})
   })
})

module.exports = router;
