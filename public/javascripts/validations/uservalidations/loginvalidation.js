


const loginform = document.getElementById("loginform");
loginform.addEventListener("submit", validateLogin)

function validateLogin(e) {



    document.getElementById("logmail").innerText = ""

    e.preventDefault()
    const emaillog = document.getElementById("logemail")
    const emailRegax2 = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegax2.test(emaillog.value)) {
        document.getElementById("logmail").innerText = "enter a valid email address"
        document.getElementById("logmail").style.display = "block"
        return false
    }
    loginform.submit()
}