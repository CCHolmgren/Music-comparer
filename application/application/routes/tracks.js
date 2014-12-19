/**
 * Created by Chrille on 2014-12-18.
 */
var express = require('express');
var router = express.Router();
var spotify = require('../settings/settings').Spotify;
var redis = require('redis'),
    client = redis.createClient();

/* GET users listing. */
client.on("connect", function () {
    console.log("Connected!");
});
client.on("error", function (err) {
    console.log("Error " + err);
});
router.get('/:trackname', function (req, res, next) {
    var trackname = req.params["trackname"];
    if (trackname) {
        client.get("track:"+trackname, function (err, result) {
            if (err) {
                console.log("There was an error: ",err);
            } else {
                console.log("Result: ", result);
                if (result) {
                    client.ttl("track:"+trackname, redis.print);

                    res.render("track", {
                        result: JSON.parse(result),
                        stringresult: result
                    });

                } else {
                    spotify.track.search("track:"+trackname, function (result) {
                        var stringresult = result;

                        result = JSON.parse(result);
                        res.render("track", {result: result, stringresult: stringresult});

                        console.log("Saving that shit to the server");

                        client.set("track:"+trackname, JSON.stringify(result), redis.print);
                        client.expire("track:"+trackname, 1000);
                    });
                }
            }
        });
    }
    else {
        next();
    }
});
router.get('/', function (req, res) {
    res.render('track', {});
});

module.exports = router;
