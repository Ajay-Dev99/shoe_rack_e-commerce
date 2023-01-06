var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('admin/admin_login');
});

router.post('/login',(req,res)=>{
  res.render('admin/admin_dashboard')
})

module.exports = router;
