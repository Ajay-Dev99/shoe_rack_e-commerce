const adminlogin = document.getElementById("adminlogin")
if(adminlogin){
    adminlogin.addEventListener("submit", logvalidation)

}

function logvalidation(e) {

    e.preventDefault()
    document.getElementById("warning").innerText = ""
    document.getElementById("warningpassword").innerText = ""



    const adminemail = document.getElementById("adminemail")
    const adminpassword = document.getElementById("adminpassword")

    const emailRegax = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!adminemail.value) {
        console.log("hey")
        document.getElementById("warning").innerText = "* email is required"
        return false
    }

    else {
        if (!emailRegax.test(adminemail.value)) {
            document.getElementById("warning").innerText = "enter a valid email address"
            // document.getElementById("warning").style.display="block"
            return false
        }
    }

    if (!adminpassword.value) {
        document.getElementById("warningpassword").innerText = "password required"
        return false
    }
    adminlogin.submit()
}