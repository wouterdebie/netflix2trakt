chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.action == "getDOM"){
        var titles = [];
        $(".title a").each(function(){
            ret = $(this).closest("tr").find(".progress-bar-wrapper label").map(function() {
                return this.innerHTML;
            }).get();
            ret.push(this.innerHTML);
            ret.push(this.href);
            titles.push(ret);
        });
        sendResponse({titles: titles});
    } else {
        sendResponse({}); // Send nothing..
    }
});