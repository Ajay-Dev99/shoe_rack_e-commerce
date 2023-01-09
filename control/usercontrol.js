const user = require("../models/usermodel")
const bcrypt = require("bcrypt")
const e = require("express")
const dbConnect = require("../connection/dbconnection")
module.exports = {
    toSingup: (userdata) => {
        // console.log(userdata,"userdata>>>>>>>>>>>>>>>>>")

        return new Promise(async (resolve, reject) => {
            try {
                let alreadySignup = await user.findOne({ email: userdata.email })
                if (alreadySignup) {
                    resolve({ exist: true })
                }
                const newUser = new user({
                    name: userdata.name,
                    email: userdata.email,
                    password: userdata.confirm_Password
                })
                return await newUser.save()
                    .then((data) => {
                        resolve({ status: true, data })

                    })
                    .catch((err) => {
                        console.log(err, "error>>>>>>>>>>>>>")
                        resolve({ status: false })
                    })
            }
            catch (error) {
                throw error;
            }
        })
    },


    toLogin: (userdata) => {
        // console.log(userdata)
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                const client = await user.findOne({ email: userdata.email })
                if (client) {
                    console.log(userdata.password, client.password)
                    bcrypt.compare(userdata.password, client.password).then((status) => {
                        if (status) {
                            if(client.blocked){
                                console.log("blocked")
                                resolve({blockedstatus:true})
                            }else{
                            response.status = true;
                            response.user = client
                            resolve(response)
                            console.log("user login succesfull")
                        }
                        } else {
                            resolve({ status: false })
                            console.log("login failed")
                        }

                    })

                } else {
                    // const usernotfound=true
                    console.log("user not exist")
                    resolve({ usernotfound: true })
                }
            } catch (error) {

            }
        })

    }
}