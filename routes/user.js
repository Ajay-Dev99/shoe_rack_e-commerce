const express = require('express');
const router = express.Router();
const control = require("../control/usercontrol")
const admincontrol = require("../control/admincontrol");
const { response } = require('../app');
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect("/login")
  }
}

const cartCount = (req, res, next) => {
  if (req.session.loggedIn) {
    control.getcartitems(req.session.user._id).then((data) => { 
      if(data.cartexist){
       
        if(data.length !=0){
         res.usercart = data.productdetails[0].totalquantity 
        }
        
        next();
      }
      else{
        res.usercart=0;
        next();
      }
     
    })
  } else {
    let usercart = 0;
    res.usercart = usercart
    next();
  }

}

router.get('/',cartCount, async function (req, res,) {

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
    res.render("user/home", { user: req.session.user, productdata, usercart: res.usercart})
  })
})



router.get("/signup", (req, res) => {
  res.render("user/user_signup", { existed: req.session.existed })
  req.session.existed = false
})

router.post("/signup-user", (req, res) => {
  control.toSingup(req.body).then((data) => {
    if (data.exist) {
      req.session.existed = true;
      res.redirect("/signup")
    } else {
      res.redirect('/login')
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
  control.toLogin(req.body).then((response) => {
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
router.get("/cart", verifyLogin, cartCount,async(req, res) => {
  control.getcartitems(req.session.user._id).then( async(response) => {
      const userproducts = response.productdetails
    const totalAmount=await control.totalAmount(req.session.user._id)
      res.render("user/usercart", { userproducts, user: req.session.user, usercart: res.usercart,totalAmount})
   
  })

})

//cart increment

router.post("/change-product-quantity",(req,res)=>{
  control.changeproductquantity(req.body).then((response)=>{
      res.json(response)
  })
})

//Remove cart items

router.post("/removecartitem",(req,res)=>{
  console.log("done999",req.body)
  control.removeCartitem(req.body).then((response)=>{
   res.json(response)
  })
})

//single product view

 router.get("/productview/:id",cartCount,(req,res)=>{
  control.productView(req.params.id).then((response)=>{
    console.log(response,"response????????????");
    const productdetails=response
    res.render("user/productview",{user: req.session.user,usercart: res.usercart,productdetails})
  })
 })

//checkout
router.get("/placeorder",(req,res)=>{
  res.render("user/orderpage")
})

module.exports = router;
