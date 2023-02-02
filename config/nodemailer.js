const nodemailer = require('nodemailer')
require("dotenv").config()

const sendMail = async function (useremail,req) {
    const OTP = Math.floor(100000 + Math.random() * 900000).toString().substr(0, 6);
    req.session.otp=OTP
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ADMIN_EMAIL, // generated ethereal user
            pass: process.env.ADMIN_PASSWORD, // generated ethereal password
        },
    });

    let info = await transporter.sendMail({
        from: '"Shoe Rack" <shoerackshoping@gmail.com>', // sender address
        to: useremail, // list of receivers
        subject:  'OTP for your account', // Subject line
        text: `Your OTP is: ${OTP}`, // plain text body
       


    });
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));


   
    

}

module.exports = sendMail;