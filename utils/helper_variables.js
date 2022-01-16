
module.exports.PREFIX = process.env.PREFIX;

module.exports.maxSongDurationMs = 7200;

module.exports.deleteBotMessageMs = 8000;

module.exports.youtubeRegex = /^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+/;

module.exports.helpCommands = `
\`\`\`
Commands:
!play <youtube link>
!skip
!stop
!clear <number of messages (limit 100)>
!nukeplaylist
!removeduplicates
!quit
\`\`\` 
`;


module.exports.servers = {};
