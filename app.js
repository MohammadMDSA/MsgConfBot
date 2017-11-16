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
	session.beginDialog('root');
});

bot.dialog('root', (session) => {
	if (session.message.address.conversation.id === process.env.TARGET_GROUP_ID)
		session.send('use commands');
	else
		session.send('Got an invalid user(group)');
})
	.triggerAction({
		matches: /^start$/i
	});


bot.dialog('main', [
	(session) => {
		if (session.message.address.conversation.id === process.env.TARGET_GROUP_ID) {
			session.sendTyping();
			session.send('getting updates');
			db.find('userMessages', {}, (result) => {
				result.forEach((item) => {
					let msg = item.message;
					if (msg.text !== '')
						item.message.text += '\n\n\n/accept' + item.msgId + '\n/decline' + item.msgId;
					else
						msg.attachments[0].name += '\n\n\n/accept' + item.msgId + '\n/decline' + item.msgId;
					session.send(msg);
				});
			});
		}
	}
]).
	triggerAction({
		matches: /^\/get$/i
	});

bot.dialog('end', (session) => {
	session.endConversation('The End');
})
	.triggerAction({
		matches: /^end$/i
	});

bot.dialog('acceptMessage', (session) => {
	if (session.message.address.conversation.id === process.env.TARGET_GROUP_ID) {
		let id = session.message.text.split('/accept')[0];
		session.send('data is ' + id);
	}
})
	.triggerAction({
		matches: /^(\/accept)[0-9]+/i
	});