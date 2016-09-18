"use strict";
var Twitter = require('twitter');
var credentials_1 = require('./credentials');
var log_1 = require('./log');
var SEARCHS = [
    "retweet a gagner follow",
    "retweet to win follow",
    "RT to win follow",
    "RT concours follow"
].join(',');
var FOLLOW_HISTORY = [];
var WINDOW_DURATION = 15 * 60 * 1000;
var t_client = new Twitter(credentials_1.credentials);
setInterval(function () { unfollowBatch("tulipe_fragile"); }, WINDOW_DURATION);
var stream = t_client.stream('statuses/filter', { track: SEARCHS });
stream.on('data', engage);
stream.on('error', log_1.error);
function isTweet(object) {
    return typeof object.contributors == "object"
        && typeof object.id_str == "string"
        && typeof object.text == "string";
}
function canFollow() {
    if (FOLLOW_HISTORY.length > 15) {
        var time_diff = FOLLOW_HISTORY[0] - (new Date()).getTime();
        if (time_diff < WINDOW_DURATION)
            return false;
    }
    return true;
}
function follow(user) {
    if (user.following) {
        log_1.error("Allready following");
        return;
    }
    if (!canFollow()) {
        log_1.error("Follow limit reached");
        return;
    }
    t_client.post('friendships/create', { user_id: user.id_str }, function (e, u, raw) {
        if (e)
            log_1.error(e);
        else
            FOLLOW_HISTORY.push((new Date()).getTime());
    });
}
function unfollow(user) {
    var time_diff = (new Date()).getTime() - (new Date(user.created_date)).getTime();
    if (time_diff < 1000 * 60 * 60 * 24 * 50)
        return;
    t_client.post('friendships/destroy', { user_id: user.id_str }, function (e, u, raw) {
        if (e)
            log_1.error(e);
    });
}
function unfollowBatch(name) {
    log_1.log("Starting masse unfollow");
    t_client.get('friends/list', { screen_name: name, include_user_entities: false, skip_status: true, count: 40 }, function (e, answer, raw) {
        if (e)
            log_1.error(e);
        else
            for (var _i = 0, _a = answer.users; _i < _a.length; _i++) {
                var user = _a[_i];
                unfollow(user);
            }
    });
}
function retweet(tweet) {
    t_client.post('statuses/retweet', { id: tweet.id_str }, function (e, t, raw) {
        if (e)
            log_1.error(e);
    });
}
function engage(tweet) {
    if (!isTweet(tweet))
        return;
    if (tweet.retweeted_status)
        return;
    if (tweet.quoted_status)
        return;
    if (tweet.retweeted)
        return;
    if (tweet.user.followers_count < tweet.user.friends_count)
        return;
    if (tweet.text.toLowerCase().includes('steam'))
        return;
    log_1.success("Engage tweet " + tweet.id_str + " " + tweet.user.screen_name);
    retweet(tweet);
    follow(tweet.user);
}
console.log("Streaming started: ", SEARCHS);
