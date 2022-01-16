require('dotenv').config();
const { Client } = require('discord.js');
const { parsedUserInput } = require('./utils/helper_functions');
const PlaylistManager = require('./playlistController/playlistManager');
const { PREFIX } = require('./utils/helper_variables');

const bot = new Client();
const playlistManager = new PlaylistManager();

bot.on('ready', () => {
    console.log('BOT READY');
});

bot.on('message', message => {
    try {
        const { content = '', guild = {}, channel = {}, author = {} } = message;

        if (author.bot) {
            return;
        }

        if (content[0] !== PREFIX) {
            return;
        }

        const [command, userInput] = parsedUserInput(content);

        switch (command.toLowerCase()) {
            case 'play':
                playlistManager.play(message, userInput);
                break;

            case 'skip':
                playlistManager.skip(channel);
                break;

            case 'stop':
                playlistManager.stop(guild, channel);
                break;

            case 'quit':
                playlistManager.quit(guild, channel);
                break;

            case 'clear':
                playlistManager.clear(message, userInput);
                break;

            case 'nukeplaylist':
                playlistManager.nukePlaylist(message);
                break;

            case 'removeduplicates':
                playlistManager.clearDuplicates(message);
                break;

            case 'help':
                playlistManager.help(channel);
                break;

            default:
                message.reply("type `!help` to see all the commands");
                break;
        }
    } catch (err) {
        console.log(err);
    }
});


bot.login(process.env.BOT_TOKEN);
