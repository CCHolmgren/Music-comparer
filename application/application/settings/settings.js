/**
 * Created by Chrille on 2014-12-18.
 */
var request = require("request");

var Spotify = {
    search_url: "https://api.spotify.com/v1/search?q=",
    // Meant to represents the artist endpoints.
    artist: {
        search: function(query, callback){
            request(Spotify.search_url + query + "&type=artist", function(error, response, body){
                callback(body);
            });
        }
    },
    track: {
        search: function(query, callback){
            request(Spotify.search_url + query + "&type=track", function(error, response, body){
                callback(body);
            });
        }
    },
    album: {
        search: function(query, callback){
            request(Spotify.search_url + query + "&type=album", function(error, response, body){
                callback(body);
            });
        }
    },
    playlist: {
        search: function(query, callback){
            request(Spotify.search_url + query + "&type=playlist", function(error, response, body){
                callback(body);
            });
        }
    },
    search: function(query, type, callback){
        request(Spotify.search_url + query + "&type="+type, function(error, response, body){
            callback(body);
        });
    }
};

module.exports.Spotify = Spotify;