const express = require('express');
const { response } = require('../app');
const router = express.Router();
const admincontrol = require("../control/admincontroller")
const categoryimgupload= require("../utilities/imageUpload")
const multer = require('multer');
const { compareSync } = require('bcrypt');
const usercontrol = require('../control/usercontroller');


const verifyLogin=(req,res,next)=>{
  if(req.session.adminloggedin){
   next()
  }else{
   res.redirect("/admin")
  }
 }


router.get('/', function (req, res, next) {

  if (req.session.adminloggedin) {
    res.redirect("/admin/home")
  } else {
    res.render('admin/admin_login', { notfound: req.session.notfound, passErr: req.session.passwordErr });
    req.session.notfound = false
    req.session.passwordErr = false
  }

});
router.get("/home", verifyLogin,(req, res) => {
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

router.get("/listusers",verifyLogin,(req,res)=>{
  admincontrol.listUsers().then((response)=>{
      res.render("admin/admin_userlist",{usersData:response})
  })

})

//block user
router.get("/blockuser/:id",verifyLogin,(req,res)=>{
admincontrol.blockUser(req.params.id).then((data)=>{
 
  res.redirect("/admin/listusers")
})
})
//unblock user
router.get("/unblockuser/:id",verifyLogin,(req,res)=>{
  admincontrol.unblockUser(req.params.id).then((data)=>{
    res.redirect("/admin/listusers")
  })
})

//add product
router.get("/addproduct",verifyLogin,(req,res)=>{
  admincontrol.listCategory().then((categories)=>{
    res.render("admin/admin_addproduct",{categories}) 
  })
 
})

//categories
router.get("/categories",verifyLogin,(req,res)=>{
  admincontrol.listCategory().then((categories)=>{
    res.render("admin/admin_categories",{categories})
  })
 
})

//add category
router.post("/addcategory",verifyLogin,categoryimgupload.single('image'),(req,res)=>{
  admincontrol.addCategory(req.body,req.file).then((data)=>{ 
    res.redirect("/admin/categories")
  })
  
})

//edit category

router.get("/editcategory/:id",verifyLogin,async(req,res)=>{
  const category=await admincontrol.editCategory(req.params.id)
  res.render("admin/admin_editcategory",{category})
})


//add product
router.post("/add_product",verifyLogin,categoryimgupload.array('image',4),(req,res)=>{
  admincontrol.addproduct(req.body,req.files).then((data)=>{
    
    res.redirect("/admin/addproduct",{data})
  })
})

//listproduct
router.get("/listproducts",verifyLogin,(req,res)=>{
  admincontrol.listProduct().then((response)=>{
    res.render("admin/admin_product",{response})
  })

})

//list orders
router.get("/orders",verifyLogin,async(req,res)=>{
  const orders=await admincontrol.listOrders()
  
 
  res.render("admin/admin_orderlist",{orders,})
})
  
//change order status

router.get("/orderaction/:id",verifyLogin,async(req,res)=>{  
  const orderdetails= await usercontrol.viewOrderdetails(req.params.id)
  res.render("admin/orderstatuschange",{orderdetails})
})

router.post("/changeorderstatus",(req,res)=>{
  
  admincontrol.changeOrderstatus(req.body)
  res.json({status:true})
})



module.exports = router;
