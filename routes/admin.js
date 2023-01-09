var express = require('express');
const { response } = require('../app');
var router = express.Router();
const admincontrol = require("../control/admincontrol")

/* GET users listing. */
router.get('/', function (req, res, next) {

  if (req.session.adminloggedin) {
    res.redirect("/admin/home")
  } else {
    res.render('admin/admin_login', { notfound: req.session.notfound, passErr: req.session.passwordErr });
    req.session.notfound = false
    req.session.passwordErr = false
  }

});
router.get("/home", (req, res) => {
  res.render('admin/admin_dashboard',{admin:req.session.adminloggedin})
})

router.post('/login', (req, res) => {
  admincontrol.doadminLogin(req.body).then((response) => {
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

})

router.get("/logout",(req,res)=>{
  res.redirect("/admin")
  req.session.destroy()
})



//dashborad

router.get("/listusers",(req,res)=>{
  admincontrol.listUsers().then((response)=>{
      res.render("admin/admin_userlist",{usersData:response})
  })

})

//block user
router.get("/blockuser/:id",(req,res)=>{
admincontrol.blockUser(req.params.id).then((data)=>{
  console.log(data,">>>>>>>>>>>>")
  res.redirect("/admin/listusers")
})
})
//unblock user
router.get("/unblockuser/:id",(req,res)=>{
  admincontrol.unblockUser(req.params.id).then((data)=>{
    res.redirect("/admin/listusers")
  })
})

//add product
router.get("/addproduct",(req,res)=>{
  res.render("admin/admin_addproduct")
})

module.exports = router;
