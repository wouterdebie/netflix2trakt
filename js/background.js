String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var active = false;

activateIcon = function(){
    chrome.browserAction.setIcon({path: 'img/netflix.png'});
    chrome.browserAction.setPopup({popup: 'html/popup.html'});
    active = true;
};

deactivateIcon = function(){
    chrome.browserAction.setIcon({path: 'img/netflix_inactive.png'});
    chrome.browserAction.setPopup({popup: ''});
    active = false;
};

checkLocation = function(tabId, changeInfo, tab) {
    chrome.tabs.getSelected(null,function(tab){
        if(tab.url.endsWith("netflix.com/WiViewingActivity")){
            activateIcon();
        } else {
            deactivateIcon();
        }
    });
};

chrome.tabs.onUpdated.addListener(checkLocation);
chrome.tabs.onActivated.addListener(checkLocation);