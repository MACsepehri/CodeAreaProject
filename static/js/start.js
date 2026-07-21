var start_number = document.getElementById("start");
var textarea_value = document.getElementById("value");
var submit_value = document.getElementById("submit_value");
var form = document.getElementById("submit-answer-form");

function check_send_answer() {
    var currentNumber = parseInt(start_number.innerText, 10);
    if (textarea_value.value != "") {
        if (currentNumber + 1 === 4) {
            form.submit();
        }
        else {
            start_number.innerText = currentNumber + 1;
            submit_value.value += `${textarea_value.value}|`
        }
    }
}