from flask import Flask, render_template, redirect, request, session, jsonify
import json
import time
import os

app = Flask(__name__)
app.secret_key = "secret_key"

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def session_check():
    if not session.get("login"):
        session["login"] = False
        session["in_lobby"] = False
        session["lobby_admin"] = False
        session["data"] = {}
        return False
    return session["login"]

def in_lobby():
    return session.get("in_lobby", False)

def login(username, email, password):
    global session

    os.makedirs("static/user", exist_ok=True)
    
    if os.path.exists("static/user/data.json"):
        with open("static/user/data.json", "r") as file:
            data = json.load(file)
    else:
        data = {"users": []}
    
    for user in data["users"]:
        if user["username"] == username or user["email"] == email:
            if user["username"] == username and user["email"] == email and user["password"] == password:
                session["data"] = {"username": username, "email": email, "password": password}
                session["login"] = True
                return True
            return False
    
    data["users"].append({"username": username, "email": email, "password": password})
    with open("static/user/data.json", "w") as file:
        json.dump(data, file, indent=4)
    
    session["login"] = True
    session["data"] = {"username": username, "email": email, "password": password}
    return True

def find_lobby_data(lobbyID):
    os.makedirs("static/lobby", exist_ok=True)
    
    try:
        path = os.listdir("static/lobby")
        for p in path:
            if p.endswith('.json'):
                with open(f"static/lobby/{p}", "r") as file:
                    data = json.load(file)
                    if data.get("lobbyID") == lobbyID:
                        return data
    except Exception as e:
        print(f"Error finding lobby data: {e}")
    return None

def update_lobby_data(lobbyID, updates):
    data = find_lobby_data(lobbyID)
    if data:
        data.update(updates)
        file_path = f"static/lobby/{data['admin']}-lobby.json"
        with open(file_path, "w") as file:
            json.dump(data, file, indent=4)
        return True
    return False

@app.route("/")
def index():
    session_check()
    session["in_lobby"] = False
    session["lobby_admin"] = False
    return render_template("index.html", session=session)

@app.route("/create")
def create_lobby():
    if not session_check():
        return redirect("/")
    else:
        if not in_lobby():
            lobbyID = str(time.time()).replace(".", "_")
            session["lobby_admin"] = True
            session["in_lobby"] = True
            
            os.makedirs("static/lobby", exist_ok=True)
            
            lobby_data = {
                "admin": session["data"]["username"],
                "users": 1,
                "lobbyID": lobbyID,
                "language": "-",
                "defficulty": "-",
                "users_list": [session["data"]["username"]],
                "user_data": [
                    {
                        "name": session["data"]["username"],
                        "answers": [],
                        "answer_data": []
                    }
                ]
            }
            
            with open(f"static/lobby/{session['data']['username']}-lobby.json", "w") as file:
                json.dump(lobby_data, file, indent=4)
            return redirect(f"/lobby&id={lobbyID}")
        else:
            return redirect("/")
        
@app.route("/register", methods=["POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip()
        password = request.form.get("password", "")
        r_password = request.form.get("repeat_password", "")
        
        if not username or not email or not password:
            return render_template("exception/error.html", msg="همه فیلدها باید پر شوند.")
        
        if password != r_password:
            return render_template("exception/error.html", msg="رمز عبور یکسان نیست.")
        
        login_check = login(username, email, password)
        if not login_check:
            return render_template("exception/error.html", msg="یکی از داده ها برای کاربر دیگری صدق میکند.")
        else:
            return redirect("/")
    else:
        return redirect("/")

@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")

@app.route("/report")
def report():
    if not session_check():
        return redirect("/")
    return render_template("report.html")

@app.route("/lobby&id=<lobbyID>")
def render_lobby(lobbyID):
    if not session_check():
        return redirect("/")
    
    data = find_lobby_data(lobbyID)
    if not data:
        return render_template("exception/error.html", msg="لابی پیدا نشد.")

    if session.get("login"):
        username = session.get("data", {}).get("username")
        
        if username != data["admin"]:
            if "users_list" not in data:
                data["users_list"] = []
            if "user_data" not in data:
                data["user_data"] = []
            
            user_exists = False
            for user in data["user_data"]:
                if user.get("name") == username:
                    user_exists = True
                    break
            
                data["users_list"].append(username)
                
                new_user_data = {
                    "name": username,
                    "answers": [],
                    "answer_data": []
                }
                data["user_data"].append(new_user_data)
                data["users"] = len(data["users_list"])
                
                with open(f"static/lobby/{data['admin']}-lobby.json", "w") as file:
                    json.dump(data, file, indent=4)
    
    return render_template("lobby/lobby.html", lobby=data, session=session)

@app.route("/get_lobby_data")
def get_lobby_data():
    try:
        lobbyID = request.args.get("id")
        
        if not lobbyID:
            return jsonify({"error": "Missing lobby ID"}), 400
        
        data = find_lobby_data(lobbyID)
        if data:
            response_data = {
                "total_users": data.get("users", 0),
                "id": data.get("lobbyID", ""),
                "language": data.get("language", "-"),
                "defficulty": data.get("defficulty", "-"),
                "admin": data.get("admin", ""),
                "users_list": data.get("users_list", [data.get("admin")]),
                "user_data": data.get("user_data", [])
            }
            return jsonify(response_data)
        else:
            return jsonify({"error": "Lobby not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/update_lobby_data", methods=["POST"])
def update_lobby_data():
    try:
        
        if request.content_type and 'application/json' in request.content_type:
            data = request.get_json()
            lobby_id = data.get("lobby_id")
            field = data.get("field")
            value = data.get("value")
        else:
            lobby_id = request.form.get("lobby_id")
            field = request.form.get("field")
            value = request.form.get("value")
        
        if not lobby_id:
            return jsonify({"error": "Missing lobby_id"}), 400
        
        if not field:
            return jsonify({"error": "Missing field"}), 400
        
        lobby_data = find_lobby_data(lobby_id)
        if not lobby_data:
            return jsonify({"error": "Lobby not found"}), 404
        
        if session.get("data", {}).get("username") != lobby_data.get("admin"):
            return jsonify({"error": "Only admin can change lobby settings"}), 403
        
        if field == "language":
            lobby_data["language"] = value
        elif field == "defficulty":
            lobby_data["defficulty"] = value
        else:
            return jsonify({"error": "Invalid field"}), 400
        
        file_path = f"static/lobby/{lobby_data['admin']}-lobby.json"
        with open(file_path, "w") as file:
            json.dump(lobby_data, file, indent=4)
        
        return jsonify({
            "success": True, 
            "message": f"{field} updated successfully",
            "data": lobby_data
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/start", methods=["POST"])
def start_game():
    if not session_check():
        return redirect("/")
    
    language = request.form.get("language", "-")
    defficulty = request.form.get("defficulty", "-")
    lobby_id = request.form.get("lobby_id", "")
    
    print(f"Starting game with language: {language}, difficulty: {defficulty}, lobby: {lobby_id}")
    
    return render_template("game/start.html", 
                          language=language, 
                          defficulty=defficulty,
                          lobby_id=lobby_id)

@app.route("/leave_lobby&id=<lobbyID>")
def leave_lobby(lobbyID):
    if not session_check():
        return redirect("/")

    data = find_lobby_data(lobbyID)

    if data:
        username = session.get("data", {}).get("username")
        if username == data["admin"]:
            file_path = f"static/lobby/{data['admin']}-lobby.json"
            if os.path.exists(file_path):
                os.remove(file_path)

        else:
            if username in data["users_list"]:
                data["users_list"].remove(username)

            data["user_data"] = [
                user for user in data["user_data"]
                if user["name"] != username
            ]

            data["users"] = len(data["users_list"])

            with open(f"static/lobby/{data['admin']}-lobby.json", "w") as file:
                json.dump(data, file, indent=4)

    session["in_lobby"] = False
    session["lobby_admin"] = False

    return redirect("/")

@app.route("/debug_lobby/<lobbyID>")
def debug_lobby(lobbyID):
    data = find_lobby_data(lobbyID)
    if data:
        return jsonify(data)
    return jsonify({"error": "Lobby not found"}), 404

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")