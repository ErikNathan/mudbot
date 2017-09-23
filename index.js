"use strict";
const INTEST = true;

//var Discordie = require("discordie"); // discord APIa
var Discord = require("discord.js");
var fs = require("fs"); // Node filesystem
var express = require('express'); // require express API for network stuffs
var request = require('request'); // request API
var plist = require("plist"); // plist parser
var Jimp = require("jimp"); // image manipulator
var atob = require("atob"); // base 64 decoder
//var spawn = require("child_process").spawn;

let config = require("./config.json");
let points = JSON.parse(fs.readFileSync("./points.json", "utf8"));
let cards = require("./cards.json");

const client = new Discord.Client(); // creates new bot instance
if(INTEST === false) var app = express(); // creates new express app instance

var port = process.env.PORT || 8080; // assign port. if no port given use localhost
if(INTEST === false) initExpress(); // initializes express port listening

client.login(config.token); // connects to the Discord servers using token.

// when the bot has connected succesfully and is receiving inputs.
client.on("ready", () => {
	console.log("Connected! " + client.user.username + " [" + client.user.id + "] ");
	console.log(client.users.size + " Users!\n" + client.guilds.size + " Servers!")
	client.user.setGame(client.users.size + " Users!"); // online, playing
	client.user.setUsername(config.name); // username
})

//////////////////// Points ////////////////////

client.on("message", message => {
	if (message.author.bot) return; // always ignore bots!

	// if the points don"t exist, init to 0;
	if (points[message.author.id]) {
		if (message.content.startsWith(".")) {
			return
		}
		else {
			let userData = points[message.author.id]
			userData.username = message.author.username
			userData.points++
			fs.writeFile("./points.json", JSON.stringify(points), (err) => {
				if (err) console.error(err)
			})
			return
		}
	}
	else points[message.author.id] = {
		username: message.author.username,
		points: 500
	}
	// And then, we save the edited file.
	fs.writeFile("./points.json", JSON.stringify(points), (err) => {
		if (err) console.error(err)
	})
})

//////////////////// Commands ////////////////////

client.on("message", message => {

	function commandIs(str){
		return message.content.toLowerCase().startsWith("." + str)
	}
	const channel = message.channel;
	const content = message.content;
	var args = content.split(" ")
	if (commandIs('help')){
		channel.send('```.roll - Rolls a die with the specified number of sides\u000D.roast - Roasts the given user\u000D.deal - Deals 2 random cards (For blackjack in future update)\u000D.invite - Invite me to your channel\u000D.points - Tells you your current points\u000D.userid - Tells you your userid\u000D.randomcat - Picture of a random cat (WIP)```')
	}
	if (commandIs('icon')){
		channel.send('Request icons in #icon-requests')
	}
	if (commandIs('roll')){
		channel.send(':game_die: You rolled a ' + Math.floor((Math.random() * args[1]) + 1))
	}
	if (commandIs('roast')){
		channel.send(args[1] + ' is stupid lul')
	}
	if (commandIs('randomcat')){
		request.get('http://random.cat/meow/', function (error, response, body) {
			var thing = body.split('"')[3]
			channel.send("http://random.cat/i/" + thing.split('/')[4])
		})
	}
	if (commandIs('getpass')){
		var GD_levelname = content.substr(args[0].length + 1)
		getLevelPass(GD_levelname, message, function(pass){
			channel.send(pass)
		})
	}
	if (commandIs('thonking')){
		channel.send('https://cdn.discordapp.com/attachments/287993279616778240/328626316595167233/9ae51cda62bfb92815604ee95f1a60a8.png')
	}
	if (commandIs('invite')){
		channel.send({embed: {
  		"color": 14493019,
  		"footer": {
    		"text": "Bot made by moist & Mudstep"
  		},
  		"author": {
    		"name": message.author.username,
    		"url": "https://discord.gg/MYm96Uw",
    		"icon_url": message.author.avatarURL
  		},
  		"fields": [
		    {
      		"name": "Invite MudBot!",
      		"value": "You want to invite me? Click this link to add me to another channel!\u000Dhttps://goo.gl/GexKge"
    		}
  		]
		}})
	}
	if (commandIs('mobileinvite')){
		channel.send("https://goo.gl/GexKge")
	}
	if (commandIs('servers')){
		channel.send("MudBot is connected to " + client.guilds.size + " servers!")
	}

//////////////////// BlackJack Stuff ////////////////////

	if (commandIs('points')){
		channel.send({embed: {
  		"color": 14493019,
  		"footer": {
    		"text": "Bot made by moist & MudStep"
  		},
  		"author": {
    		"name": message.author.username,
    		"url": "https://discord.gg/MYm96Uw",
    		"icon_url": message.author.avatarURL
  		},
  		"fields": [
		    {
      		"name": "Points",
      		"value": points[message.author.id].points
    		}
  		]
		}})
	}
	if (commandIs('setpoints')){
		var user = args[1]
		var amount = args[2]
		if (message.author.id == 193215265998110720) {
			if (amount == undefined) {
				channel.send("You need to put a user and an amount!")
				return
			}
			else {
				console.log(amount)
				points[user].points = amount
				fs.writeFile("./points.json", JSON.stringify(points), (err) => {
					if (err) {
						console.error(err)
						channel.send(err)
						return
					}
				})
				channel.send("Success")
			}
		}
		else {
			channel.send("You can not use this command!")
		}
	}
	if (commandIs('userid')){
		channel.send(message.author.id)
	}
	if (commandIs('deal')){
		var cardlist = cards.cards
		var split = cardlist.split(',')
		var card1 = split[Math.floor(Math.random() * 51)]
		var card2 = split[Math.floor(Math.random() * 51)]
		if (card1 == card2) {
			var card2 = split[Math.floor(Math.random() * 51)]
		}
		channel.send(card1.split(' ')[1] + '\u000D' + card2.split(' ')[1])
		console.log(card1.split(' ')[1])
		console.log(card2.split(' ')[1])
	}
})

function getLevelPass(GD_levelname, mseg, cb) {
	request.post({
		url: 'http://www.boomlings.com/database/getGJLevels21.php',
		form: {
			gameVersion: "21",
			binaryVersion: "33",
			gdw: "0",
			type: "0",
			str: GD_levelname,
			diff: "-",
			len: "-",
			page: "0",
			total: "0",
			uncompleted: "0",
			onlyCompleted: "0",
			featured: "0",
			original: "0",
			twoPlayer: "0",
			coins: "0",
			epic: "0",
			secret: "Wmfd2893gb7"
			}
	},
	function(err, httpResponse, body) {
		if (err) {
			console.log(err + "\n" + httpResponse);
			return
		} else if (body == "-1") {
			return
		} else {
			var objectArray = body.split(":")
			console.log("Getting pass for " + objectArray[1])

			request.post({
				url: 'http://www.boomlings.com/database/downloadGJLevel22.php',
				form: {
					gameVersion: "21",
					binaryVersion: "33",
					gdw: "0",
					levelID: objectArray[1],
					inc: "1",
					extras: "0",
					secret: "Wmfd2893gb7"
					}
			},
			function(err2, httpResponse2, body2) {
				if (err2) {
					console.log(err2+ "\n" + httpResponse2);
					return
				} else if (body2 == "-1") {
					return
				} else {
					var objectArray2 = body2.split(":")
					console.log(objectArray2["65"])
					var passEn0 = objectArray2["65"].split("#")
					var passEn = passEn0["0"]
					var buf = Buffer.from(passEn, 'base64')
					var password = Vigenere(buf)
					console.log(password)
					cb(password)
				}
			})
		}
	})
}

function Vigenere(string) {
	var final = ""
	var xorchars = [50,54,51,54,52]
	for (var i = 0; i < string.length; i++) {
		var string2 = Buffer.from(string[i].toString(), "ascii")
		final += String.fromCharCode(string2 ^ xorchars[i%5])
	}
	if (final.length == 7) {
			final = final.slice(1)
			final = 'The password is ' + final
	} else if (final == "1") {
		final = 'This level has no password silly'
	} else {
		final = 'This level cannot be copied'
	}
	return final
}
