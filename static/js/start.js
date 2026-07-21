var start_number = document.getElementById("start");
var form = null;

function check_send_answer() {
    if (start_number.value === 3) {
        form.submit();
    }
    else {
        start_number.value += 1
    }
}