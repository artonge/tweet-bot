# tweet-bot
A bot that participates to twitter retweet contests.


# Notes
If a want to follow an account for 40 days after I enter a contest, knowing that I can't have more than 5000 subscriptions,
5000/40/24 = 125/24 ~= 5 ==> I can't enter more than 5 contests by hour.


# REQUIREMENTS
You need to create a `credentials.ts` file in src like this :
```
export const credentials = {
  consumer_key        : "...",
  consumer_secret     : "...",
  access_token        : "...",
  access_token_secret : "..."
};
```


# INSTALL
clone repo then :
- `yarn`


# RUN
`yarn start`
