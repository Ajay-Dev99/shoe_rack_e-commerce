const admin = require("../models/admin")
const bcrypt = require("bcrypt")

module.exports = {

    doadminLogin: (adminData) => {
        console.log(adminData.email, "admindata")
        return new Promise(async (resolve, reject) => {
            try {
                let response={}
                const cleint = await admin.findOne({ email:adminData.email })
                if (cleint) {
                    
                    bcrypt.compare(adminData.password, cleint.password).then((status) => {
                        if (status) {
                            resolve({login:true})
                            // console.log("login succesful")
                        } else {
                            resolve({status:false})
                            // console.log("login failed")
                        }
                    })
                } else {
                    resolve({usernotfound:true})
                    // console.log("user not found")
                }

            } catch (error) {
                throw error
            }


        })
    }



}