require('dotenv-extended').load();
const { setInterval } = require('timers');
const builder = require('botbuilder');
const { Prompts, UniversalBot, ChatConnector, Message } = builder;
const restify = require('restify');
const Mongo = require('./MongoInterface');

let db = new Mongo();

const server = restify.createServer();
server.listen(process.env.PORT, () => {
	console.log(`${server.name} listening to ${server.url}`);
});

let connector = new ChatConnector({
	appId: process.env.MICROSOFT_APP_ID,
	appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('api/messages', connector.listen());

let bot = new UniversalBot(connector, (session, args) => {
	db.insert('messages', session.message, () => {
		session.send('done');
	});
	session.beginDialog('root');
});

bot.dialog('root', (session) => {
	if(session.message.address.conversation.id === process.env.TARGET_GROUP_ID)
		session.beginDialog('main');
	else
		session.send('Got an invalid user(group)');
})
	.triggerAction({
		matches: /^start$/i
	});


bot.dialog('main', [
	(session) => {
		session.send('Got a valid one');
	}
]);

bot.dialog('end', (session) => {
	session.endConversation('The End');
})
	.triggerAction({
		matches: /^end$/i
	});