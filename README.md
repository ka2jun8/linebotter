# Line-botter

lineの秘書bot

開発時
```js
npm install
gulp
```

実行時
```js
redis-server /your/path/redis.conf &
nf start
```

* !注意
* redisを利用
* nfは、nodeの環境変数（トークン）を参照するためのもの

ローカル環境でテストするときは、以下を叩く

http://localhost:5000

AWS(aws.ka2jun8.xyz:443)で起動予定

## 使い方
+ フリートーク機能
　基本これ。なんでもOK。適当な言葉を選んで返す。
+ レストラン検索機能
　「ごはん」：検索開始。
　フリーワード検索。
+ 友達機能（未実装）
　友達になる。
+ アラーム機能
　設定した時間にしゃべりかけてくれる。
+ マップ機能
　「〜ってどこ？」：〜の場所を探索。
　「〜から〜まで」：行き方を検索。
+ お天気機能
　「〜の天気」：〜の降水強度を調べる。









==== fork前

# node-js-getting-started

A barebones Node.js app using [Express 4](http://expressjs.com/).

This application supports the [Getting Started with Node on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs) article - check it out.

## Running Locally

Make sure you have [Node.js](http://nodejs.org/) and the [Heroku Toolbelt](https://toolbelt.heroku.com/) installed.

```sh
$ git clone git@github.com:heroku/node-js-getting-started.git # or clone your own fork
$ cd node-js-getting-started
$ npm install
$ npm start
```

Your app should now be running on [localhost:5000](http://localhost:5000/).

## Deploying to Heroku

```
$ heroku create
$ git push heroku master
$ heroku open
```
or

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

## Documentation

For more information about using Node.js on Heroku, see these Dev Center articles:

- [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)
- [Best Practices for Node.js Development](https://devcenter.heroku.com/articles/node-best-practices)
- [Using WebSockets on Heroku with Node.js](https://devcenter.heroku.com/articles/node-websockets)
