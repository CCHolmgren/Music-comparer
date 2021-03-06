/**
 * Created by Chrille on 2015-01-30.
 */
var tags = [];
var intersecting_tags;
var searchCount = 0;
var first_color;
var second_color;
var follower_chart;
var listeners_chart;
var playcount_chart;
var popularity_chart;
var charts;

window.onload = function () {
    var button_state = 0;
    initializeCharts();
    getLatestSearches();
    $("#table-button").on("click", function (event) {
        var that = $(this);
        $(that.data("target")).toggle();
        if (button_state % 2 == 0)
            that.text("Show table");
        else
            that.text("Hide table");
        button_state += 1;
    });
    $("#latestsearches").delegate("button", "click", function (event) {
        console.log(arguments);
        var that = $(this);
        var that_data = that.data("textbox");
        var that_selector = "#" + that_data;

        console.log(that.data("textbox"));
        console.log($(that_selector)[0]);

        $(that_selector)[0].value = decodeURI(that.data("query"));
    });

    if (!navigator.onLine) {
        $("#online").text("You are currently offline");
    }
    console.log("Adding eventlistener");
    $("#compare").on("click", function (e) {
        e.preventDefault();

        location.hash = "#spacer";
        popularity_chart.segments = [];
        $("#tbody_data").empty();

        var query1_textbox = $("#query1");
        var query2_textbox = $("#query2");

        if (query1_textbox.val() != "") {
            search(query1_textbox.val(), "artist", handleData.bind(undefined, "#result", 0), "#spinner1", "#query1_loading");
        }
        if (query2_textbox) {
            search(query2_textbox.val(), "artist", handleData.bind(undefined, "#result2", 1), "#spinner2", "#query2_loading");
        }
    });
    $("input[type=text]").keypress(function (e) {
        if (e.which == "13") {
            $("#compare").trigger("click");
        }
    });
};
function addCommas(nStr) {
    nStr += '';
    var x = nStr.split('.');
    var x1 = x[0];
    var x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ' ' + '$2');
    }
    return x1 + x2;
}
function showSearchInfo(spinner, target, query) {
    $(spinner).show();
    $(target).text("Searching for " + query);
}
function removeSearchInfo(spinner, target) {
    $(spinner).hide();
    $(target).text("");
}
function search(query, type, callback, spinner, target) {
    query = query.trim().toLowerCase();

    if (query === "") {
        return;
    }
    if (localStorage.getItem(query)) {
        console.log("Got item from storage");
        console.log(JSON.parse(localStorage.getItem(query)));
        callback(JSON.parse(localStorage.getItem(query)), true);

        console.log("Showing data");
        $(".search-data").show();
        return;
    }
    type = type || "artist";
    showSearchInfo(spinner, target, query);
    //$(spinner).show();
    //$(target).text("Searching for " + query);
    $.ajax({
        method: "post",
        url: "/api/search2",
        data: {query: query, type: type},
        error: function (x, y, z) {
            console.log("The api errored out");

            removeSearchInfo(spinner, target);
            //$(spinner).hide();
            //$(target).text("");

            console.log(arguments);
            console.log(x);
            $("#loading").text(x.responseJSON.message);
        }
    }).done(function (data, y, z) {
        console.log(arguments);
        console.log(data);

        removeSearchInfo(spinner, target);
        //$(spinner).hide();
        //$(target).text("");

        localStorage.setItem(query, JSON.stringify(data));

        callback(data, false);

        console.log("Showing data");
        $(".search-data").show();
    });
}

function putInSearchBox(text) {
    console.log(arguments);
    text = decodeURI(text);
    $("#query1").val(text);
}
function putInSearchBox2(text) {
    console.log(arguments);
    text = decodeURI(text);
    $("#query2").val(text);
}
function getLatestSearches() {
    $.ajax({method: 'GET', url: '/api/latestsearches'}).done(function (result) {
        "use strict";
        var div = $("#latestsearches");

        div.empty();

        result.forEach(function (item) {
            "use strict";
            var item_uri = encodeURI(item);
            div.append("<div><span>"
            + item
            + "</span><div><button data-textbox='query1' data-query='" + item_uri + "'"
            + ">Box 1</button><button data-textbox='query2'  data-query='" + item_uri + "'>Box 2</button></div>");
        });
        //setTimeout(getLatestSearches, 10000);
        console.log(arguments);
    });
}

function initializeCharts() {
    first_color = Please.make_color({
        base_color: "orangered",
        saturation: 0.9,
        value: 0.6
    });
    second_color = Please.make_color({
        base_color: "cyan",
        saturation: 0.9,
        value: 0.6
    });
    var follower_data = {
        labels: [
            "Followers"
        ],
        datasets: [
            {
                label: "Missing data",
                fillColor: first_color,
                data: [0]
            },
            {
                label: "Missing data",
                fillColor: second_color,
                data: [0]
            }
        ]
    };
    var listeners_data = {
        labels: [
            "Listeners"
        ],
        datasets: [
            {
                label: "Missing data",
                fillColor: first_color,
                data: [0]
            },
            {
                label: "Missing data",
                fillColor: second_color,
                data: [0]
            }
        ]
    };
    var playcount_data = {
        labels: [
            "Playcount"
        ],
        datasets: [
            {
                label: "Missing data",
                fillColor: first_color,
                data: [0]
            },
            {
                label: "Missing data",
                fillColor: second_color,
                data: [0]
            }
        ]
    };
    var popularity_data = [];

    var follower_ctx = follower_canvas.getContext("2d");
    var listeners_ctx = listeners_canvas.getContext("2d");
    var playcount_ctx = playcount_canvas.getContext("2d");
    var popularity_ctx = popularity_canvas.getContext("2d");

    follower_chart = new Chart(follower_ctx).Bar(follower_data);
    listeners_chart = new Chart(listeners_ctx).Bar(listeners_data);
    playcount_chart = new Chart(playcount_ctx).Bar(playcount_data);
    popularity_chart = new Chart(popularity_ctx).Doughnut();
    charts = [follower_chart, listeners_chart, playcount_chart, popularity_chart];
}
function handleData(target, offset, data, retrieved_from_cache) {
    "use strict";
    var colors = [first_color, second_color];
    var spotify_data = data.data[0].value || {
            followers: {
                total: 0
            },
            popularity: 0
        };
    var spotify_state = data.data[0].state;
    var lastfm_data = data.data[1].value || {
            artist: {
                name: "",
                stats: {
                    listeners: 0,
                    playcount: 0
                }
            }
        };
    var lastfm_state = data.data[1].state;
    var follower_canvas = document.getElementById("follower_canvas");
    var listeners_canvas = document.getElementById("listeners_canvas");
    var playcount_canvas = document.getElementById("playcount_canvas");
    var popularity_canvas = document.getElementById("popularity_canvas");


    $(target).html("<pre><code>" + JSON.stringify(data, undefined, 2) + "</code></pre>");

    console.log("Target", target);
    console.log("Target: ", $(target));
    console.log("Arguments", arguments);
    console.log("Got data", data);
    console.log(offset);
    console.log(follower_chart);

    $("#tbody_data").append("<tr><td>"
    + (lastfm_data.artist.name || spotify_data.name)
    + "</td><td>"
    + addCommas(spotify_data.followers.total)
    + "</td><td>"
    + addCommas(lastfm_data.artist.stats.playcount)
    + "</td><td>"
    + addCommas(lastfm_data.artist.stats.listeners)
    + "</td><td>"
    + spotify_data.popularity
    + "</td><td>"
    + (lastfm_data.artist.stats.playcount / spotify_data.followers.total).toFixed(1)
    + "</td><td>"
    + (lastfm_data.artist.stats.playcount / lastfm_data.artist.stats.listeners).toFixed(1)
    + "</td></tr>");

    console.log("Retrieved_from_cache: ", retrieved_from_cache);
    console.log("Adding stuff to ", retrieved_from);

    var retrieved_from = $("#query" + (offset + 1) + "_from");
    retrieved_from.text("Retrieved " + lastfm_data.artist.name + (retrieved_from_cache ? " from the cache." : " from the server."));

    //Set the charts datasets to the values that we got
    //Charts.js doesn't really provide any easy way to add values without previously
    //presetting the datasets and then change the bars in the datasets, which is really ugly, but it works
    follower_chart.datasets[offset].label = lastfm_data.artist.name;
    follower_chart.datasets[offset].bars[0].value = spotify_data.followers.total;
    listeners_chart.datasets[offset].bars[0].value = lastfm_data.artist.stats.listeners;
    playcount_chart.datasets[offset].bars[0].value = lastfm_data.artist.stats.playcount;

    $("#legend_location").html(follower_chart.generateLegend());

    popularity_chart.addData(
        {
            value: spotify_data.popularity || 0,
            color: colors[offset],
            highlight: Please.make_color({
                base_color: offset === 0 ? "orangered" : "cyan",
                saturation: 0.4,
                value: 0.6
            }),
            label: "Popularity"
        });

    //console.log("Or here?");
    //Update the charts to display the changed values
    charts.map(function (chart) {
        chart.update();
    });
    //follower_chart.update();
    //listeners_chart.update();
    //playcount_chart.update();
    //popularity_chart.update();

    $.get("/api/tags/" + lastfm_data.artist.name).done(function (result) {
        var matching_tags = $("#matchingtags");
        tags[offset] = result.toptags.tag.map(function (item) {
            return item.name;
        });

        if (tags.length == 2) {
            intersecting_tags = tags[0].filter(function (n) {
                return tags[1].indexOf(n) != -1;
            });
            console.log(intersecting_tags.toString());

            matching_tags.empty();
            matching_tags.html("<h6>These are the matching tags</h6>");
            var tag_result = "<p>";
            tag_result += intersecting_tags[0][0].toUpperCase() + intersecting_tags[0].slice(1) + (intersecting_tags.length > 1 ? ", " : "");
            for (var i = 1, j = intersecting_tags.length; i < j; i++) {
                tag_result += intersecting_tags[i] + ", ";
                //tag_result += intersecting_tags[i][0].toUpperCase() + intersecting_tags[i].slice(1) + " ";
            }
            tag_result += "</p>";
            matching_tags.append(tag_result);
            matching_tags.append("<p>A total of "
            + intersecting_tags.length
            + " of "
            + tags[offset].length
            + " tags. Or ~"
            + ((intersecting_tags.length / tags[offset].length) * 100).toPrecision(2)
            + "%.</p>");
        }
    });
}