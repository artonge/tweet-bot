import * as Twit from "twit";

var StatsD = require("node-dogstatsd").StatsD;

import { credentials } from "./credentials";
import logger from "./log";

const dogstatsd = new StatsD();

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

const T: Twit = new Twit(credentials);

export function connect(queries: string[]) {
  logger.info(`Query: ${JSON.stringify(queries)}`);
  return T.stream("statuses/filter", { track: queries } as Twit.Params);
}

function getUser(screen_name: string, cb: (user: Twit.Twitter.User) => void) {
  T.get("users/show", { screen_name }, (error: Error, user: any) => {
    if (error) {
      logger.error(error);
    } else {
      dogstatsd.gauge("user.subscriptions", user.friends_count);
      dogstatsd.gauge("user.followers", user.followers_count);
      dogstatsd.gauge("user.retweets", user.status.retweet_count);
      cb(user);
    }
  });
}

export function registerUnfollower() {
  // Check every day if we reached the limit of 5000 subscribtion
  setInterval(() => {
    getUser("tulipe_fragile", user => {
      // If the limit is reached, start unfollow batches every 15 minutes
      if (user.friends_count > 5000) {
        dogstatsd.increment("unfollowBatch");

        const unfollowInterval = setInterval(() => {
          unfollowBatch(user.screen_name);
          // Unfollow until friends count is 0
          getUser("tulipe_fragile", user => {
            if (user.friends_count == 0) {
              clearInterval(unfollowInterval);
            }
          });
        }, 15 * MIN);
      }
    });
  }, DAY);
}

let FOLLOW_HISTORY: number[] = [];
function canFollow(): boolean {
  // Remove follows that are older than 15min.
  while (Date.now() - FOLLOW_HISTORY[0] > 15 * MIN) {
    FOLLOW_HISTORY.shift();
  }

  // FOLLOW_HISTORY.length is number of retweet in the last 15 minutes
  // If it's over 15, we reached the limit
  return FOLLOW_HISTORY.length < 15;
}

function follow(user: Twit.Twitter.User) {
  if (!canFollow()) {
    return;
  }

  // Follow only if we are not allready following
  T.get(
    "users/show",
    { screen_name: user.screen_name },
    (error: any, u: any) => {
      if (error) {
        logger.error(error);
      }

      const user = u as Twit.Twitter.User;
      if (user.following) {
        return;
      }

      dogstatsd.increment("follow");

      T.post(
        "friendships/create",
        { user_id: user.id_str } as Twit.Params,
        (error: any) => {
          if (error) {
            logger.error(error);
          } else {
            FOLLOW_HISTORY.push(Date.now()); // Add the retweet in history
          }
        }
      );
    }
  );
}

function unfollow(user: Twit.Twitter.User) {
  dogstatsd.increment("unfollow");
  T.post(
    "friendships/destroy",
    { user_id: user.id_str } as Twit.Params,
    (error: any) => {
      if (error) {
        logger.error(error);
      }
    }
  );
}

function unfollowBatch(name: string) {
  T.get(
    "friends/list",
    {
      screen_name: name,
      include_user_entities: false,
      skip_status: true,
      count: 40
    } as Twit.Params,
    (error: any, answer: any) => {
      if (error) {
        logger.error(error);
      } else {
        const users = answer.users as Twit.Twitter.User[];
        logger.info(`Unfollowing ${users.length} users`);
        for (let user of users) {
          unfollow(user);
        }
      }
    }
  );
}

function retweet(tweet: Twit.Twitter.Status) {
  dogstatsd.increment("retweet");

  T.post("statuses/retweet", { id: tweet.id_str }, (error: any) => {
    if (error) {
      logger.error(error);
    }
  });
}

function favorite(tweet: Twit.Twitter.Status) {
  if (tweet.text.search(/favorite/i) == -1) {
    return;
  }

  dogstatsd.increment("favorite");

  T.post("favorites/create", { id: tweet.id_str }, (error: any) => {
    if (error) logger.error(error);
  });
}

export function engage(tweet: Twit.Twitter.Status) {
  dogstatsd.increment("tweet");
  // Prevent useless engagement
  if (
    tweet.retweeted_status || // is a retweet
    tweet.quoted_status || // is a quote
    tweet.retweeted || // allready been retweeted
    tweet.in_reply_to_status_id || // is a reply
    tweet.user.screen_name.search(/b(o|0)t/i) != -1 || // might be a bot spooter. Shit bag
    tweet.text.search(/bet/i) != -1 || // probably an ad for betting site
    tweet.user.followers_count < 2000 || // need to have a least 500 folowers
    tweet.user.followers_count < tweet.user.friends_count * 1.5 || // need to have 0.3 more followers than subscriptions
    tweet.text.search(/steam/i) != -1
  ) {
    return; // it's for a steam key
  }

  logger.info(
    "Engage tweet " +
      tweet.id_str +
      " " +
      tweet.user.screen_name +
      " | " +
      tweet.user.follow_request_sent
  );

  setTimeout(() => {
    retweet(tweet);
    follow(tweet.user); // Follow user if needed
    favorite(tweet); // Favorite tweet if needed
  }, 15 * MIN); // Engage 15 minutes later to act more like a normal person
}
