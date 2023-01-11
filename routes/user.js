const express = require('express');
const router = express.Router();
const control = require("../control/usercontrol")
const admincontrol = require("../control/admincontrol")
/* GET home page. */


router.get('/', async function (req, res, next) {
await admincontrol.listProduct().then((data)=>{
  console.log(data,">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
  const product = data
  const productdata = product.map((product)=>{
return{
  _id:product._id,
  name:product.productname,
  price:product.productSRP,
  image:product.imageurl[0].filename
}
  })
  console.log(productdata,"/////////////////////////////////////////////////////////////////")
  res.render("user/home", { user: req.session.user,productdata })
})
  
});

router.get("/signup", (req, res) => {
  res.render("user/user_signup", { existed: req.session.existed })
  req.session.existed = false
})

router.post("/signup-user", (req, res) => {
  console.log(req.body)
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
      console.log("done>>>>>>>>>>>>>>>>")
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
  console.log("logouts")
  req.session.destroy()
  res.redirect("/")
})




module.exports = router;
