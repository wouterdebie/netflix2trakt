$(document).ready(function(){
    
 });

show_info = {};

sanatize_episode_title = function(title){
    var newtitle = title.toLowerCase().replace(/"/g, '').replace(/the /g, "").replace(/-/g,"").replace(/  /g, " ").trim();
    console.log("Replacing", title, "with", newtitle);
    return newtitle;
};

sanatize_show_title = function(title){
    var newtitle = title.toLowerCase().replace(/- /g, "").replace(/ /g, "-").replace(/\./g,"").trim();
    console.log("Replacing show", title, "with", newtitle);
    return newtitle;
};

readyFn = function(){
    chrome.tabs.getSelected(null, function(tab) {
        var username, password;

        chrome.storage.local.get(["username", "password"], function(result){
            console.log(result);
            username = result.username;
            password = result.password;
            if(username && password){
                get_list(tab, username, password);
                console.log("Done..");
            } else {
                $("#status span").text("No username and password set!");
            }
        });
    });
};

get_list = function(tab, username, password){
    var all = 0;
    var seen = 0;
    var unseen = 0;
    var auth = {"username": username, "password": password};

    // Send a request to the content script.
    $("#status span").text("Parsing page..");
    chrome.tabs.sendRequest(tab.id, {action: "getDOM"}, function(response) {
        var titles = response.titles;
        $.each(titles, function(index, value){
            var minutes_seen = parseInt(value[0].substring(0, value[0].length - 1), 10);
            var total_minutes = parseInt(value[1].substring(0, value[1].length - 1), 10);

            if(minutes_seen > total_minutes - 3){
                var info = value[2];
                var title_url = value[3];
                var info_array = info.split(": ");

                $("#status span").text("Checking " + info_array[0] + "..");
                var title = sanatize_show_title(info_array[0]);
                var episode_title = sanatize_episode_title(info_array[0]);
                var season = 1;

                if (info_array.length == 2){
                    episode_title = info_array[1];
                } else if(info_array.length == 3){
                    season = info.split(": ")[1];
                    if(season.indexOf("Season") != -1)
                        season = season.replace("Season ", "");
                    else
                        season = 0;
                    episode_title = info_array[2];
                }

                episode_title = sanatize_episode_title(episode_title);
                console.log("Checking", title);
                if(!show_info[title]){
                    if(!show_info[title]){
                        show_info[title] = {};
                    }

                    if(!show_info[title]["seasons"])
                        show_info[title]["seasons"] = {};

                    jQuery.ajax({
                        url: 'http://api.trakt.tv/show/summary.json/b041c40a63507a5259705e60ce56b800/' + title + '/extended',
                        type: 'POST',
                        data: auth,
                        success: function(data) {
                                    if (data.seasons.length > 0) {
                                        for(j=0; j<data.seasons.length; j++){
                                            for(i=0; i<data.seasons[j].episodes.length; i++){
                                                var episode_data = data.seasons[j].episodes[i];
                                                var episode_season = "" + episode_data.season;
                                                if(!show_info[title]["seasons"][episode_season]){
                                                    show_info[title]["seasons"][episode_season] = {};
                                                }
                                                console.log(title, "seasons", episode_season, episode_data.title);
                                                show_info[title]["seasons"][episode_season][sanatize_episode_title(episode_data.title)] = episode_data;
                                            }
                                        }
                                    }
                                 },
                        error: function(xhr, status){
                            console.log("Fail on", title);
                        },
                        async: false
                    });
                }

                // We don't have the show title, this might be a movie
                if(!show_info[title]["seasons"][season][episode_title]){
                    console.log("Looks like a movie. Not supported currently..");
                } else {
                    console.log(show_info[title]["seasons"][season][episode_title]);
                    var eps_info = show_info[title]["seasons"][season][episode_title];
                    var eps_tvdbid = eps_info.tvdb_id;
                    var pad = "00";
                    var str = eps_info.episode + "";
                    var episode_pad = pad.substring(0, pad.length - str.length) + str;

                    var link = $("<a>", {
                        text: eps_info.tvdb_id,
                        title: eps_info.tvdb_id,
                        href: eps_info.url
                    }).click(function(){
                        chrome.tabs.create({url: $(this).attr('href')});
                        return false;
                    });
                    var img = $("<img>", {
                            src: "../img/" + eps_info.watched + ".png"
                        });

                    var seen_link = "";
                    if(!eps_info.watched){
                        seen_link = $("<a>", {
                            text: 'mark as seen',
                            title: 'mark as seen',
                            href: ''
                        }).click(function(){
                            var data = jQuery.extend({}, auth);
                            jQuery.ajax({
                                url: 'http://api.trakt.tv/show/episode/seen/b041c40a63507a5259705e60ce56b800/',
                                type: 'POST',
                                data: auth,
                                success: function(data) {
                                            if (data.length > 0) {
                                                for(i=0; i<data.length; i++){
                                                    var episode_data = data[i];
                                                    show_info[title]["seasons"][season][sanatize_episode_title(episode_data.title)] = episode_data;
                                                }
                                            }
                                         },
                                error: function(xhr, status){
                                    // Don't care if we fail..
                                },
                                async: false
                            });
                        });
                    }

                    var row = $('<tr>')
                        .append('<td>' + info + '</td>')
                        .append('<td>' + eps_info.season + 'x' + episode_pad + '</td>')
                        .append($('<td>').append(img))
                        .append($('<td>').append(link))
                        .append($('<td>').append(seen_link));

                    if(eps_info.watched){
                        $('#episode_list_seen tbody').append(row);
                        seen++;
                    } else {
                        $('#episode_list_unseen tbody').append(row);
                        unseen++;
                    }
                    $('#episode_list tbody').append(row.clone());
                    all++;
                }
            }
        });
        $('#all_count').html(all);
        $('#seen_count').html(seen);
        $('#unseen_count').html(unseen);
        $('#tab-container').easytabs();
        $("#wrapper").show();
        $("#status").hide();
    });
};

$(document).ready(readyFn);
