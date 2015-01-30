/**
 * Created by Chrille on 2015-01-05.
 */
var express = require('express');
var router = express.Router();
var settings = require('../settings/settings');
var redis = require('redis'),
    client = redis.createClient();
var Q = require('q');
var ExpressBrute = require("express-brute");
var RedisStore = require("express-brute-redis");

var store = new RedisStore({
    host: "127.0.0.1",
    port: 6379
});

var bruteforce = new ExpressBrute(store, {
    freeRetries: 1000
});

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
    res.status(400).json({
        error: "400 Bad Request",
        message: message
    });
};
router.use(bruteforce.prevent);

router.get("/tags/:artist", function (req, res) {
    LastFM.artist.getTopTags(req.params.artist).then(function (result) {
        res.json(JSON.parse(result));
    });
});

router.get('/latestsearches', function (req, res) {
    Q.ninvoke(client, 'lrange', ["latestsearches", -5, -1]).then(function (result) {
        console.log("Got result", result);
        res.header('Content-Type', 'application/json');
        res.send(JSON.stringify(result));
    }).done();
});
router.post('/search2', function (req, res) {
    var data_expiry_time = 10000,
        query_string = req.body.query.toLowerCase().trim();

    if (query_string === "") {
        send_bad_request_response("The query must contain something, it can't be empty");
        return;
    }

    Q.longStackSupport = true;

    Q.ninvoke(client, "get", "artist:" + query_string).
        then(function (data) {
            console.log(data);

            if (data && data.length) {
                return [data, []];
            }
            console.log("Doing the promiserinos");
            return [[], spotify.artist.get_details_without_artist_before(query_string)];
        }).
        spread(function (cached_data, spotify_data) {
            if (cached_data != "") {
                return [cached_data, []];
            }
            return [[], [{state: "fulfilled", value: spotify_data}, {
                state: "fulfilled",
                value: LastFM.artist.get_info(JSON.parse(spotify_data).name)
            }]];
        }, function (error) {
            console.log("Error");
            console.log(arguments);
            if (error.code === "ENOTFOUND") {
                res.status(500);
                res.json(error);
            }

            console.log(LastFM.artist.get_info(query_string).inspect());

            return [[], [{state: "rejected", value: ""}, {
                state: "fulfilled",
                value: LastFM.artist.get_info(query_string)
            }]];
        }).
        spread(function (cached_data, retrieved_data) {
            function getName(spotify_data, lastfm_data) {
                return spotify_data.value.name || lastfm_data.value.artist.name;
            }

            if (cached_data.length) {
                res.send({data: JSON.parse(cached_data)});
            } else {
                if (!retrieved_data[0].state) {
                    res.send({error: "Damn", message: "Something happened that shouldn't have."});
                    return;
                }

                //The values in the fulfilled or rejected promises are stringified
                //so we need to parse them to get usable values

                if (retrieved_data[0].state === "fulfilled") {
                    retrieved_data[0].value = JSON.parse(retrieved_data[0].value);
                }
                retrieved_data[1].value.then(function (result) {
                    if (retrieved_data[1].state === "fulfilled") {
                        retrieved_data[1].value = JSON.parse(retrieved_data[1].value.valueOf());
                    }

                    res.send({data: retrieved_data});

                    //JSON.stringify will block, so we timeout to get better percieved performance
                    process.nextTick(function () {
                        client.set("artist:" + query_string, JSON.stringify(retrieved_data), redis.print);
                        client.expire("artist:" + query_string, data_expiry_time, redis.print);
                        client.rpush("latestsearches", getName(retrieved_data[0], retrieved_data[1]), redis.print);
                        //Better
                        try {
                            var x = (+retrieved_data[1].value.artist.stats.playcount / +retrieved_data[0].value.followers.total);
                            if (x > 60 && retrieved_data[0].value.followers.total > 10000) {
                                client.zadd("highpf", x, JSON.stringify(retrieved_data), redis.print);
                            }
                        } catch (e) {
                            if (e instanceof TypeError) {
                                return;
                            }
                            throw e;
                        }
                    });
                });
            }
        }, function (error) {
            console.log("An error was thrown: ", error);
        }).
        catch(function (error) {
            console.log("An error was thrown.");
            console.log(error);
            console.log(error.stack());
        });
});

module.exports = router;