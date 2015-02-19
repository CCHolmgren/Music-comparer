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
                var token = json.session.key;

                console.log(req.session);

                if (token === req.session.token) {
                    return Q.ninvoke(client, "lrange", "latestsearches", -5, -1);
                } else {
                    throw new Error("The token is not matching");
                }
            }
        ).then(function (result) {
                render_index_page(res, 'Music Comparer', result, true, req.session.username);
            }).catch(function (error) {
                console.log(error);
                delete req.session.username;
                res.render("error", {title: "Music Comparer", error: error, message: error.message});
            });
    } else {
        client.lrange("latestsearches", -5, -1, function (error, result) {
            console.log(arguments);
            render_index_page(res, 'Music Comparer', result, false, null);
        });
    }
});

module.exports = router;
