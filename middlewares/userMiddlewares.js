const usercontrol=require("../control/usercontroller")
const user=require("../models/usermodel")
const verifyLogin = async(req, res, next) => {

    if (req.session.loggedIn) {
      const blocked=await user.findOne({_id:req.session.user._id,blocked:true})
      console.log(blocked,"o");
      if(blocked){
        req.session.loggedIn=false
        res.redirect("/login")
      }else{
        next()
      }

    } else {
      res.redirect("/login")
      // res.json({ loggedin: false })
    }
  }
  
  const cartCount = async (req, res, next) => {
    if (req.session.loggedIn) {
      const totalqty = await usercontrol.totalquantity(req.session.user._id)
      res.usercart = totalqty
      next()
    } else {
      let totalqty = 0;
      res.usercart = totalqty
      next();
    }
  
  }

  module.exports={
    verifyLogin,
    cartCount
  }