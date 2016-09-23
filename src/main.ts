const Twitter = require('twitter');

import { credentials } from './credentials';
import { log, success, error } from './log';


const SEARCHS: string = [
  "retweet a gagner",
  "retweet to win",
  "RT to win",
  "RT concours"
].join(',');

const FOLLOW_HISTORY: Array<number> = [];

const MIN_15 = 15 * 60 * 1000; // 15 min

const t_client = new Twitter(credentials);

// A new unfollow batch every 15 min
setInterval(function() { unfollowBatch("tulipe_fragile") }, MIN_15);


var stream = t_client.stream('statuses/filter', {track: SEARCHS});
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
		if (time_diff < MIN_15) return false;
	}

	return true;
}

function follow(user: any) {
	if (user.following) { error("Allready following");   return; }
	if (!canFollow())   { /*error("Follow limit reached");*/ return; }

	t_client.post('friendships/create', {user_id: user.id_str},  function(e: any, u: any, raw: any) {
		if (e) error(e);
		else FOLLOW_HISTORY.push((new Date()).getTime()); // Add the request in history
	});
}

function unfollow(user: any) {
	const time_diff: number = (new Date()).getTime() - (new Date(user.created_date)).getTime();
	if (time_diff < MIN_15) return; // Return if friendship was created less than 5 days agos

	t_client.post('friendships/destroy', {user_id: user.id_str},  function(e: any, u: any, raw: any) {
		if (e) error(e);
	});
}

function unfollowBatch(name: any) {
	// log("Starting masse unfollow");
	t_client.get('friends/list', {screen_name: name, include_user_entities: false, skip_status: true, count: 40},  function(e: any, answer: any, raw: any) {
		if (e) error(e);
		else for (let user of answer.users) unfollow(user);
	});
}

function retweet(tweet: any) {
	t_client.post('statuses/retweet', {id: tweet.id_str},  function(e: any, t: any, raw: any) {
		if (e) error(e);
	});
}

function engage(tweet: any) {
	// Prevent useless engagement
	if (!isTweet(tweet) || // not a tweet
			tweet.retweeted_status || // is a retweet
			tweet.quoted_status ||  // is a quote
			tweet.retweeted || // allready been retweeted,
			tweet.user.screen_name.search(/b(o|0)t/i) || // might be a bot spooter. Shit bag
			tweet.user.followers_count < 500 || // need to have a least 500 folowers
			tweet.user.followers_count*1.5 < tweet.user.friends_count || // need to have 0.5 more followers than subscriptions
			tweet.text.toLowerCase().includes('steam')) return; // it's for a steam key

	setTimeout(()=> {
		success("Engage tweet " + tweet.id_str + " " + tweet.user.screen_name);
		retweet(tweet);
		follow(tweet.user);
	}, 1000*60*15); // Engage 15 minutes later to act more like a normal person
}


console.log("Streaming started: ", SEARCHS);
