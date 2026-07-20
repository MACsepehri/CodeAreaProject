var passwordState = "hide";
var passwordButton = document.getElementsByClassName("password-state")[0];
var password = document.getElementsByName("password")[0];
var repeat_password = document.getElementsByName("repeat_password")[0];

function redirect (url) {
    window.location.href = `${url}`;
}

function password_state() {
    if (passwordState === "hide") {
        passwordState = "show";
        password.type = "text"
        repeat_password.type = "text"
        passwordButton.innerText = "پنهان رمز";
    }
    else {
        passwordState = "hide";
        password.type = "password"
        repeat_password.type = "password"
        passwordButton.innerText = "آشکار رمز";
    }
}