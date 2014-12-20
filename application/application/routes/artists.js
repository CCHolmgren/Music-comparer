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
router.get('/:artistname/:artisturi', function (req, res, next) {
    var artisturi = req.params["artisturi"];
    var artistname = req.params["artistname"];

    client.get("artist:" + artistname + ":albums:" + artisturi, function (err, result) {
        if (err) {
            console.log("There was an error: ", err);
        } else {
            if (result) {
                client.ttl("artist:" + artistname + ":albums:" + artisturi, redis.print);
                res.render("album", {
                    result: JSON.parse(result)
                });
            } else {
                spotify.artist.get_albums(artisturi, function (result) {
                    client.set("artist:" + artistname + ":albums:" + artisturi, result, redis.print);
                    client.expire("artist:" + artistname + ":albums:" + artisturi, 1000);
                });
            }
        }
    });
});
router.get('/:artistname', function (req, res, next) {
    var artistname = req.params["artistname"];

    if (artistname) {
        client.get("artist:" + artistname, function (err, result) {
            console.log(result);
            if (err) {
                console.log("There was an error: ", err);
            } else {
                console.log("Result: ", result);
                if (result) {
                    client.ttl("artist:" + artistname, redis.print);

                    res.render("artist", {
                        result: JSON.parse(result),
                        stringresult: result
                    });

                } else {
                    spotify.artist.search(artistname, function (result) {
                        console.log(result);
                        var stringresult = result;

                        result = JSON.parse(result);
                        res.render("artist", {result: result, stringresult: stringresult});

                        console.log("Saving that shit to the server");

                        client.set("artist:" + artistname, JSON.stringify(result), redis.print);
                        client.expire("artist:" + artistname, 1000);
                    });
                }
            }
        });
    }
    else {
        next();
    }
});
/* GET users listing. */
router.get('/', function (req, res) {
    res.render('artist', {});
});

module.exports = router;
