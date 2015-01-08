/**
 * Created by Chrille on 2015-01-05.
 */
var express = require('express');
var router = express.Router();
var settings = require('../settings/settings');
var redis = require('redis'),
    client = redis.createClient();
var Q = require('q');

var spotify = settings.Spotify;
var LastFM = settings.LastFM;

client.on("error", function (err) {
    console.log("Error " + err);
});
client.on("connect", function () {
    console.log("Connected!");
});
var render_json_data = function (res, data) {
    data = data.map(JSON.parse);
    res.render("result2", {data: data});
};
var send_bad_request_response = function (res, message) {
    res.status(400).send({
        error: "400 Bad Request",
        message: message
    });
};
router.get('/latestsearches', function (req, res) {
    console.log("Going into latestsearches");
    Q.ninvoke(client, 'lrange', ["latestsearches", -5, -1]).then(function (result) {
        console.log("Got result", result);
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(result));
    }).done();
});
router.post('/search2', function (req, res) {
    var data_expiry_time = 10000;
    var query_string = req.body.query.toLowerCase().trim();

    if (query_string == "") {
        send_bad_request_response("The query must contain something, it can't be empty");
        return;
    }

    console.log("Going into the search2 function");

    Q.longStackSupport = true;

    console.log("body:", query_string);

    process.nextTick(function () {
        client.lpush("latestsearches", req.body.query, redis.print);
    });

    Q.ninvoke(client, "get", "artist:" + query_string).
        then(function (data) {
            console.log(data);

            if (data && data.length) {
                console.log("Retrieved data from the cache");

                return [data, []];
            } else {
                console.log("Doing the promiserinos");
                return [[], spotify.artist.get_details_without_artist_before(query_string)];
                //return [[], Q.allSettled([spotify.artist.get_details_without_artist_before(query_string),
                //    LastFM.artist.get_info(query_string)])]; //TODO: Since LastFM got more data than Spotify got, use the Spotify data to search for LastFM artist. This would be made by searching only spotify data, and then use the returned data for the lastfm search
            }
        }).
        spread(function(cached_data, spotify_data){
            if(cached_data != ""){
                //console.log("Sending cached data");
                //console.log(cached_data, cached_data.toString(), typeof cached_data);
                return [cached_data, []];
            } else {
                //console.log("Spotify_data: ",spotify_data);
                //console.log("That was the spotify data", spotify_data, typeof spotify_data);
                return [[], [{state: "fulfilled", value: spotify_data},{state: "fulfilled", value: LastFM.artist.get_info(JSON.parse(spotify_data).name)}]]//.then(function(result){
                    //console.log("result: ",result.slice(0, 100));
                    //return [[], [, {state:"fulfilled", value: result}]];
                //});
            }
        }, function(){
            console.log("Error");
            console.log(arguments);
            console.log(LastFM.artist.get_info(query_string).inspect())
            return [[], [{state: "rejected", value: ""},{state: "fulfilled", value: LastFM.artist.get_info(query_string)}]]//.then(function(result){
        }).
        spread(function (cached_data, retrieved_data) {
            //console.log("Inside the next step");
            if (cached_data.length) {
                //console.log("Rendering the cached data");

                //res.render("result2", {data: JSON.parse(cached_data)});
                res.send({data: JSON.parse(cached_data)});
            } else {
                if(!retrieved_data[0]["state"]){
                    res.send({error: "Damn", message: "Something happened that shouldn't have."});
                    return;
                }
                //console.log("typeof retrieved_data: ",typeof retrieved_data);
                //console.log("retrieved_data: ", retrieved_data);

                //The values in the fulfilled or rejected promises are stringified
                //so we need to parse them to get usable values

                if (retrieved_data[0].state === "fulfilled") {
                    //console.log("Did it throw here?");
                    retrieved_data[0].value = JSON.parse(retrieved_data[0].value);
                }
                retrieved_data[1].value.then(function(result){
                    if (retrieved_data[1].state === "fulfilled") {
                        //console.log("Or here?");
                        retrieved_data[1].value = JSON.parse(retrieved_data[1].value.valueOf());
                    }

                    //console.log("Sending new data");
                    //res.render("result2", {data: retrieved_data});
                    res.send({data: retrieved_data});

                    //console.log("Saving the data to the cache");

                    //JSON.stringify will block, so we timeout to get better percieved performance
                    process.nextTick(function () {
                        client.set("artist:" + query_string, JSON.stringify(retrieved_data), redis.print);
                        client.expire("artist:" + query_string, data_expiry_time, redis.print);
                    });
                });
            }
        }, function(error){
            console.log("An error was thrown: ", error);
        }).
        catch(function (error) {
            console.log("An error was thrown.");
            console.log(error);
            console.log(error.stack());
        });
});
router.post('/search', function (req, res) {
    Q.longStackSupport = true;
    if (req.body.query1 == "" || req.body.query2 == "") {
        res.status(400).send({
            error: "400 Bad Request",
            message: "You provided only 1 or even 0 of the required 2 names. As such we can't go on with the query."
        });
        return;
    }
    Q.spread([Q.ninvoke(client, "get", "artist:" + req.body.query1), Q.ninvoke(client, "get", "artist:" + req.body.query2)], function (query1, query2) {
        //console.log(query1, query2);
        return [[query1, query2], Q.all([spotify.artist.search(req.body.query1),
            spotify.artist.search(req.body.query2)])];
    }).spread(function (cached_data, spotify_search_results) {

        //console.log(spotify_search_results);
        spotify_search_results = [JSON.parse(spotify_search_results[0]), JSON.parse(spotify_search_results[1])];
        //console.log(spotify_search_results);
        //console.log("Do we get here?");

        return [cached_data, Q.all([spotify.artist.get_details(spotify_search_results[0].artists.items[0].id),
            spotify.artist.get_details(spotify_search_results[1].artists.items[0].id),
            LastFM.artist.get_info(req.body.query1),
            LastFM.artist.get_info(req.body.query2)])]
    }).spread(function (cached_data, data1) {
        spotify_details1 = JSON.parse(data1[0]);
        spotify_details2 = JSON.parse(data1[1]);
        lastfminfo1 = JSON.parse(data1[2]);
        lastfminfo2 = JSON.parse(data1[3]);
        //console.log(arguments);
        //console.log("This is my other data:", cached_data);
        //console.log("Or maybe this:", data1);
        console.log("Is this where it fails?");
        res.render("result", {
            data1: cached_data[0] || spotify_details1,
            data2: cached_data[1] || spotify_details2,
            data3: lastfminfo1,
            data4: lastfminfo2
        });
    }).fail(function (error) {
        throw new Error(error);
    }).done();
});

module.exports = router;