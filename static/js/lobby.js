var lobbyID = null;
var isAdmin = false;

function getLobbyID() {
    if (lobbyID) return lobbyID;
    const idInput = document.getElementById("id");
    if (idInput) {
        lobbyID = idInput.value;
        return lobbyID;
    }
    console.error("Could not find lobby ID input");
    return null;
}

function getElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`Element with id "${id}" not found`);
    }
    return el;
}
function updateUI(field, value) {
    if (field === 'language') {
        const langEl = getElement('programing-language');
        if (langEl) {
            langEl.innerText = value;
            langEl.style.color = "#00a2ff";
        }
    } else if (field === 'defficulty') {
        const diffEl = getElement('defficulty');
        if (diffEl) {
            diffEl.innerText = value;
            setDifficultyColor(value);
        }
    }
}

async function saveLobbyData(field, value) {
    try {
        const currentLobbyID = getLobbyID();
        if (!currentLobbyID) {
            console.error("No lobby ID available");
            alert("خطا: شناسه لابی یافت نشد");
            return false;
        }
        
        const formData = new FormData();
        formData.append('lobby_id', currentLobbyID);
        formData.append('field', field);
        formData.append('value', value);
        
        const response = await fetch('/update_lobby_data', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error response:", errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            updateUI(field, value);
            return true;
        } else {
            console.error("Update failed:", data.error);
            return false;
        }
        
    } catch (error) {
        console.error("Error saving lobby data:", error);
        alert(`خطا در ذخیره اطلاعات: ${error.message}`);
        return false;
    }
}

async function updateLobbyUsers() {
    try {
        const currentLobbyID = getLobbyID();
        if (!currentLobbyID) {
            console.error("No lobby ID for user update");
            return;
        }

        const endpoint = `/get_lobby_data?id=${currentLobbyID}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const usersElement = document.getElementById('inner-lobby-users');
        if (usersElement) {
            usersElement.innerHTML = data.total_users || 0;
        }

        const usersListElement = document.getElementById('users-list');
        if (usersListElement && data.users_list) {
            usersListElement.innerHTML = data.users_list.map(u => `<span>${u}</span>`).join(', ');
        }

        if (data.language && data.language !== "-") {
            updateUI('language', data.language);
        }

        if (data.defficulty && data.defficulty !== "-") {
            updateUI('defficulty', data.defficulty);
        }

    } catch (error) {
        console.error("Error loading lobby data:", error);
        const usersElement = document.getElementById('inner-lobby-users');
        if (usersElement) {
            usersElement.innerHTML = '0';
        }
    }
}

async function setDifficulty(value, displayName) {
    await saveLobbyData('defficulty', value);
}

function setDifficultyColor(text) {
    const colors = {
        "آسون": "#68d268",
        "متوسط": "#ffa500",
        "سخت": "#ff0000",
        "غیر ممکن 🔥": "#9b30ff"
    };
    const diffEl = getElement('defficulty');
    if (diffEl) {
        diffEl.style.color = colors[text] || "rgb(255, 103, 103)";
    }
}

async function easy() {
    await setDifficulty('آسون', 'آسان');
}

async function mediume() {
    await setDifficulty('متوسط', 'متوسط');
}

async function hard() {
    await setDifficulty('سخت', 'سخت');
}

async function imposible() {
    await setDifficulty('غیر ممکن 🔥', 'غیر ممکن');
}

async function select_language(lang) {
    await saveLobbyData('language', lang);
}

function copy_element() {
    const currentLobbyID = getLobbyID();
    if (!currentLobbyID) {
        alert("خطا: شناسه لابی یافت نشد");
        return;
    }
    
    const url = `${window.location.origin}/lobby&id=${currentLobbyID}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            alert("لینک لابی با موفقیت کپی شد");
        }).catch(err => {
            console.error("Failed to copy: ", err);
            copyUsingInput(url);
        });
    } else {
        copyUsingInput(url);
    }
}

function copyUsingInput(text) {
    const input = document.getElementById("lobby_id");
    if (input) {
        input.value = text;
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand('copy');
        alert("لینک لابی با موفقیت کپی شد");
    }
}

function send_data_to_server() {
    const languageInput = document.getElementById("language_f");
    const defficultyInput = document.getElementById("defficulty_f");
    const languageTag = document.getElementById("programing-language");
    const defficultyTag = document.getElementById("defficulty");
    
    if (!languageInput || !defficultyInput) {
        console.error("Form inputs not found");
        alert("خطا در ارسال اطلاعات");
        return false;
    }
    
    languageInput.value = languageTag ? languageTag.innerText : "-";
    defficultyInput.value = defficultyTag ? defficultyTag.innerText : "-";
    
    if (languageInput.value === "-" || defficultyInput.value === "-") {
        alert("لطفا زبان برنامه نویسی و درجه سختی را انتخاب کنید");
        return false;
    }

    const form = document.querySelector('.start-button form');
    if (form) {
        form.submit();
        return true;
    } else {
        console.error("Form not found");
        alert("خطا در ارسال فرم");
        return false;
    }
}

async function checkGameStarted() {
    try {
        const currentLobbyID = getLobbyID();
        if (!currentLobbyID) {
            return;
        }

        const endpoint = `/get_lobby_data?id=${currentLobbyID}`;
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            return;
        }

        const data = await response.json();
        
        if (data.game_started === true) {
            const language = data.language || '-';
            const defficulty = data.defficulty || '-';
            
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = '/start';
            
            const languageInput = document.createElement('input');
            languageInput.type = 'hidden';
            languageInput.name = 'language';
            languageInput.value = language;
            form.appendChild(languageInput);
            
            const defficultyInput = document.createElement('input');
            defficultyInput.type = 'hidden';
            defficultyInput.name = 'defficulty';
            defficultyInput.value = defficulty;
            form.appendChild(defficultyInput);
            
            const lobbyInput = document.createElement('input');
            lobbyInput.type = 'hidden';
            lobbyInput.name = 'lobby_id';
            lobbyInput.value = currentLobbyID;
            form.appendChild(lobbyInput);
            
            document.body.appendChild(form);
            form.submit();
        }
        
    } catch (error) {
        console.error("Error checking game state:", error);
    }
}

function initializeLobby() {
    const ownerInput = document.getElementById("owner");
    if (ownerInput && ownerInput.value) {
        isAdmin = true;
    }
    
    getLobbyID();
    
    const languageContainer = document.querySelector('.select-language');
    if (languageContainer) {
        languageContainer.addEventListener('click', function(e) {
            const button = e.target.closest('button');
            if (!button) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const lang = button.title || button.innerText.trim();
            
            if (lang && lang !== "") {
                select_language(lang);
            }
        });
    } else {
        console.warn("Language container not found");
    }
    
    const difficultyContainer = document.querySelector('.select-defficulty');
    if (difficultyContainer) {
        difficultyContainer.addEventListener('click', function(e) {
            const button = e.target.closest('button');
            if (!button) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const title = button.title;
            
            const difficultyMap = {
                "آسان": easy,
                "متوسط": mediume,
                "سخت": hard,
                "غیر ممکن": imposible
            };
            
            const func = difficultyMap[title];
            if (func) {
                func();
            }
        });
    } else {
        console.warn("Difficulty container not found");
    }
    
    const diffEl = document.getElementById('defficulty');
    if (diffEl) {
        setDifficultyColor(diffEl.innerText);
    }
    
    if (isAdmin) {
        updateLobbyUsers();
        setInterval(updateLobbyUsers, 3000);
    }
    
    checkGameStarted();
    setInterval(checkGameStarted, 2000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeLobby, 100);
    });
} else {
    setTimeout(initializeLobby, 100);
}

function exit_lobby() {
    var lobbyID = document.getElementById("id").value;
    window.location.href = "/leave_lobby&id="+lobbyID
}