const fs = require('fs');
const ytdl = require('ytdl-core');
const { helpCommands, youtubeRegex, maxSongDurationMs, deleteBotMessageMs } = require('../utils/helper_variables');
const jsonData = require('./playlist.json');

module.exports = class PlaylistManager {
    constructor() {
        const { currentSongId, playlist } = jsonData;

        this.currentSongId = currentSongId;
        this.playlist = playlist;
        this.stillPlaying = false;
        this.dispatcher = null;
    }

    play(message, youtubeLink, playNextSong = false) {
        const { member = {} } = message;

        if (!youtubeRegex.test(youtubeLink)) {
            message.reply("Paste a youtube link, you muppet")
                .then(msg => msg.delete({ timeout: deleteBotMessageMs }))
                .catch(err => console.log(err));
            return;
        }

        if (!playNextSong) {
            this.playlist.push(youtubeLink);
            this.savePlaylistChanges({ currentSongId: this.currentSongId, playlist: this.playlist });
        }

        if (member && member.voice && member.voice.channel) {
            member.voice.channel.join()
                .then(connection => {
                    if (this.playlist.length === 0) {
                        return;
                    }

                    const song = ytdl(youtubeLink, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });

                    song.on("info", info => {
                        const { lengthSeconds, title } = info.videoDetails;
                        const songLength = Number(lengthSeconds);

                        if (songLength > maxSongDurationMs) {
                            this.sendBotMessage(message.channel, `**${title || 'video'}** is longer than ${maxSongDurationMs / 60} minutes`);
                        } else if (this.stillPlaying) {
                            this.sendBotMessage(message.channel, `**${title || 'video'}** queued up`);
                        } else {
                            this.dispatcher = connection.play(song);

                            this.dispatcher.on('start', () => {
                                this.stillPlaying = true;
                                this.sendBotMessage(message.channel, `**${title || 'video'}** is now playing`);
                            });

                            this.dispatcher.on("finish", () => {
                                this.stillPlaying = false;
                                this.currentSongId += 1;

                                let nextSong = this.playlist[this.currentSongId];
                                const playNextSong = true;

                                if (nextSong) {
                                    this.play(message, nextSong, playNextSong);
                                } else {
                                    this.currentSongId = 0;
                                    nextSong = this.playlist[this.currentSongId];

                                    if (nextSong) {
                                        this.play(message, nextSong, playNextSong);
                                        this.sendBotMessage(message.channel, "No more new songs, replaying from the start");
                                    } else {
                                        this.sendBotMessage(message.channel, "The playlist is empty");
                                    }

                                    // connection.disconnect();
                                }
                            });
                        }
                    });
                })
                .catch(err => console.log(err));
        } else {
            message.reply("You need to join a voice channel first, you muppet")
                .then(msg => msg.delete({ timeout: deleteBotMessageMs }))
                .catch(err => console.log(err));
        }
    }

    skip(channel) {
        if (this.dispatcher) {
            this.dispatcher.end();
            this.sendBotMessage(channel, "Skipping song");
        }
    }

    stop(guild, channel) {
        if (guild.voice && guild.voice.connection) {
            // if (this.dispatcher) {
            //     this.dispatcher.end();
            // }
            this.sendBotMessage(channel, "Ending queue, leaving channel");
            guild.voice.connection.disconnect();
        }
    }

    quit(guild, channel) {
        this.sendBotMessage(channel, "Bye Cuck");
        if (guild.voice && guild.voice.connection) {
            guild.voice.connection.disconnect();
        }
    }

    help(channel) {
        this.sendBotMessage(channel, helpCommands);
    }

    clear(message, userInput = 1) {
        let numOfMessages = parseInt(userInput + 1);
        if (numOfMessages > 100) {
            numOfMessages = 100;
        }

        if (message && message.channel && message.member.hasPermission('ADMINISTRATOR')) {
            message.channel.bulkDelete(numOfMessages, true)
                .then(() => this.sendBotMessage(message.channel, "Cleared messages"))
                .catch(err => console.log(err));
        }
    }

    nukePlaylist(message) {
        this.currentSongId = 0;
        this.playlist = [];

        this.savePlaylistChanges({ currentSongId: this.currentSongId, playlist: this.playlist });

        this.sendBotMessage(message.channel, "Playlist cleared");
    }

    clearDuplicates(message) {
        this.currentSongId = 0;
        this.playlist = [...new Set(this.playlist)];

        this.savePlaylistChanges({ currentSongId: this.currentSongId, playlist: this.playlist });

        this.sendBotMessage(message.channel, "Removed song duplicates from playlist");
    }

    sendBotMessage(channel, botMessage) {
        channel.send(botMessage)
            .then(msg => msg.delete({ timeout: deleteBotMessageMs }))
            .catch(err => console.log(err));
    }

    savePlaylistChanges(data) {
        fs.writeFile("./playlistController/playlist.json", JSON.stringify(data, null, 4), err => {
            if (err) {
                console.log(err);
            } else {
                console.log("Added new song to playlist");
            }
        });
    }
}