const express = require('express');
const router = express.Router();
const control = require("../control/usercontrol")
/* GET home page. */


router.get('/', function (req, res, next) {
  res.render("user/home", { user: req.session.user })
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
    res.render("user/user_login", { notexisted: req.session.usernotexist, pass: req.session.passErr })
    req.session.usernotexist = false
    req.session.passErr = false
  }

})

router.post("/login", (req, res) => {
  control.toLogin(req.body).then((response) => {
    if (response.usernotfound) {
      req.session.usernotexist = true;
      res.redirect("/login")
    } else {

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
