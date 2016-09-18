import * as http    from 'http';
import * as Promise from 'promise';

const Twitter = require('twitter');

import { credentials } from './credentials';
import { log, success, error } from './log';


const SEARCHS: [string] = [
  "retweet 'a gagner' OR 'à gagner' -vote -steam",
  "retweet to win -vote -steam",
  "RT concours -steam -vote"
];

const FOLLOW_HISTORY: Array<number> = [];

const WINDOW_DURATION = 15 * 60 * 1000; // 15 min

const t_client = new Twitter(credentials);

// A new unfollow batch every 15 min
setInterval(function() { unfollowBatch("tulipe_fragile") }, WINDOW_DURATION);


var stream = t_client.stream('statuses/filter', {track: SEARCHS.join(',')});
stream.on('data', engage);
stream.on('error', error);


function isTweet(object: any): boolean {
	return typeof object.contributors == "object"
			&& typeof object.id_str       == "string"
			&& typeof object.text         == "string"
}

function canFollow(): boolean {
	if (FOLLOW_HISTORY.length > 15) { // If 15 requests have been made
		// Difference between latest request and now
		let time_diff: number = FOLLOW_HISTORY[0] - (new Date()).getTime();
		// If the latest request have been made less than 15 minutes ago, return false
		if (time_diff < WINDOW_DURATION) return false;
	}

	// Add the request in history and return true
	FOLLOW_HISTORY.push((new Date()).getTime());
	return true;
}

function follow(user: any) {
	if (!canFollow()) return;
	t_client.post('friendships/create', {user_id: user.id},  function(e: any, user: any, raw: any) {
		if (e) error(e);
		else console.log("Followed user");
	});
}

function unfollow(user: any) {
	console.log("Unfollowing", user.id);

	t_client.post('friendships/destroy', {user_id: user.id},  function(e: any, user: any, raw: any) {
		if (e) error(e);
		else log("Unfollowed user");
	});
}

function unfollowBatch(name: any) {
	console.log("Starting masse unfollow");
	t_client.get('friends/list', {screen_name: name},  function(e: any, answer: any, raw: any) {
		if (e) error(e);
		else for (let user of answer.users) unfollow(user);
	});
}

function retweet(tweet: any) {
	t_client.post('statuses/retweet', {id: tweet.id_str},  function(e: any, tweet: any, raw: any) {
		if (!e) console.log("Retweeted");
		else error(e);
	});
}

function engage(tweet: any) {
	log("Engage tweet");
	console.log("Engage tweet");

	if (!isTweet(tweet)) return; // If it's not a tweet, return
  if (tweet.retweeted_status) tweet = tweet.retweeted_status; // If the tweet is a retweet, get the original tweet
  if (tweet.quoted_status) tweet = tweet.quoted_status; // If the tweet is a quote, get the original tweet

  if (!tweet.retweeted) retweet(tweet); // If the tweet is not allready retweeted, retweet
  if (tweet.text.search(/follow/i) != -1) follow(tweet.user); // If a follow is asked, follow the user

	log("Done");
}


console.log("Streaming started");
