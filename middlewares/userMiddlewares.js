const usercontrol=require("../control/usercontroller")

const verifyLogin = (req, res, next) => {
    if (req.session.loggedIn) {
      next()
    } else {
      res.redirect("/login")
      res.json({ loggedin: false })
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