/* global console, require */
"use strict";
var express = require('express');
var router = express.Router();
var request = require('request');
var spotify = require('../settings/settings').Spotify;
var crypto = require('crypto');
var Q = require('q');

var redis = require('redis'),
    client = redis.createClient();

function render_index_page(res, title, latestsearches, authenticated, username) {
    res.render('index', {
        title: title,
        latestsearches: latestsearches,
        authenticated: authenticated,
        username: username
    });
}
function restricted(req, res, next) {
    if (req.session.loggedin) {
        return next();
    } else {
        req.session.error = "Access denied!";
        return res.redirect("/");
    }
}
router.use(restricted);
/* GET home page. */
router.get('/', function (req, res) {
    console.log(req.session);
    if (req.session.token && req.session.username) {
        Q.ninvoke(client, "get", [req.session.username]).then(
            function (result_username) {
                console.log(result_username);
                var json = JSON.parse(result_username);
                //var hmac = crypto.createHash("md5").update(json.session.name + json.session.key, "utf8").digest("hex");
                var token = json.session.key;

                console.log(req.session);
                //console.log(hmac);

                if (token === req.session.token) {
                    return Q.ninvoke(client, "lrange", "latestsearches", -5, -1);
                } else {
                    throw new Error("The token is not matching");
                }
            }
        ).then(function (result) {
            render_index_page(res, 'Music Comparer', result, true, req.session.username);
            /*res.render('index', {
             title: 'Music comparer',
             latestsearches: result,
             authenticated: true,
             username: req.cookies.username
             });*/
        }).catch(function (error) {
            console.log(error);
            delete req.session.username;//res.cookie("username", "", {expires: new Date(1), httpOnly: true});
            delete req.session.hmac;//res.cookie("hmac", "", {expires: new Date(1), httpOnly: true});
            res.render("error", {title: "Music Comparer", error: error, message: error.message});
        });
    } else {
        client.lrange("latestsearches", -5, -1, function (error, result) {
            console.log(arguments);
            render_index_page(res, 'Music Comparer', result, false, null);
            /*res.render('index', {
             title: 'Music comparer',
             latestsearches: result,
             authenticated: false,
             username: null
             });*/
        });
    }
});

module.exports = router;
