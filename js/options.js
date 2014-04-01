// Saves options to localStorage.
function save_options() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;
  var status = document.getElementById("status");
  if(username === ""){
    status.innerHTML = "Username can't be empty!";
  } else if (password === ""){
    status.innerHTML = "Password can't be empty!";
  } else {
    var hash = CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex);
    chrome.storage.local.set({'username': username, 'password': hash});
    status.innerHTML = "Settings saved!";
  }
}

// Restores select box state to saved value from localStorage.
function restore_options() {
  chrome.storage.local.get("username", function(result){
    if(result.username)
      document.getElementById("username").value = result.username;
  });
  document.getElementById("password").value = "";
}
document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#buttonSave').addEventListener('click', save_options);