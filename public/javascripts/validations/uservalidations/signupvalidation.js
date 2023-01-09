

const form = document.getElementById("signup")
form.addEventListener("submit", validateForm)

function validateForm(e) {

    document.getElementById("mail").innerText = ""
    document.getElementById("confirmpassword").innerText = ""
    document.getElementById("password").innerText = ""
    document.getElementById("confirmpasswordmsg").innerText = ""

    e.preventDefault();
    //get the form elements

    const email = document.getElementById("signupemail");
    const password = document.getElementById("signuppassword")
    const confirm_Password = document.getElementById("confirmpassword")

    //check that all fields are required

    if (email.value == '' || password.value == '' || confirm_Password.value == '') {
        alert("All fields are required")
        return false
    }

    //verify that the emailaddress is in the correct fomate

    const emailRegax = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegax.test(email.value)) {
        document.getElementById("mail").innerText = "invalid email address"
        document.getElementById("mail").style.display = "block"
        return false
    }

    // check that the password meets the requirments

    if (password.value.length < 8) {

        document.getElementById("password").innerText = "password must contains minimum 8 characters"
        document.getElementById("password").style.display = "block"
        return false
    }
    const passwordRegax = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])(?!.*\s).{8,}$/;
    if (!passwordRegax.test(password.value)) {
        console.log(password.value)
        document.getElementById("password").innerText = "Password must contain at least one number, one capital letter, and one special character!"
        document.getElementById("password").style.display = "block"
        //alert("Password must contain at least one number, one capital letter, and one special character!")
        return false
    }

    //verify that the password and confirmpassword are match

    if (password.value != confirm_Password.value) {
        console.log(confirm_Password.value)
        document.getElementById("confirmpasswordmsg").innerText = "password do not match"
        document.getElementById("confirmpasswordmsg").style.display = "block"
        return false
    }

    form.submit()
}
