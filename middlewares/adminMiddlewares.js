

const verifyLogin=(req,res,next)=>{
    if(req.session.adminloggedin){
     next()
    }else{
     res.redirect("/admin")
    }
   }

module.exports=verifyLogin