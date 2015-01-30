/**
 * Created by Chrille on 2015-01-30.
 */

window.addEventListener("offline", function (e) {
    $("#online").text("Connection: Offline");
    $("#online").attr("title", "You are offline. You can only compare with cached values.");
});
window.addEventListener("online", function (e) {
    $("#online").text("Connection: Online");
    $("#online").attr("title", "You are online. You can search for anything that you want.");
});