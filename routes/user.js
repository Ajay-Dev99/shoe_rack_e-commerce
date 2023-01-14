const express = require('express');
const router = express.Router();
const control = require("../control/usercontrol")
const admincontrol = require("../control/admincontrol");
const { response } = require('../app');
const verifyLogin=(req,res,next)=>{
 if(req.session.loggedIn){
  next()
 }else{
  res.redirect("/login")
 }
}


router.get('/', async function (req, res, next) {
await admincontrol.listProduct().then((data)=>{
  const product = data
  const productdata = product.map((product)=>{
return{
  _id:product._id,
  name:product.productname,
  price:product.productSRP,
  image:product.imageurl[0].filename
}
  })
 
  res.render("user/home", { user: req.session.user,productdata})
})
  
});

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
    res.render("user/user_login", { notexisted: req.session.usernotexist, pass: req.session.passErr,block:req.session.blocked})
    req.session.usernotexist = false
    req.session.passErr = false
    req.session.blocked=false
  }

})

router.post("/login", (req, res) => {
  control.toLogin(req.body).then((response) => {
    if (response.usernotfound) {
      req.session.usernotexist = true;
      res.redirect("/login")
    }
    else if(response.blockedstatus){
      req.session.blocked=true
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

router.get("/addtocart/:id",verifyLogin,(req,res)=>{
  console.log(req.session.user._id,"user///////////////////////")
  control.addtoCart(req.params.id,req.session.user._id).then((data)=>{
    
  })
  res.redirect("/")
  })

  //cart
  router.get("/cart",verifyLogin,(req,res)=>{
    control.getcartitems(req.session.user._id).then((response)=>{
      res.render("user/usercart")
    })
    
  })

module.exports = router;
