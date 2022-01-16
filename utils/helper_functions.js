
const { PREFIX } = require('./helper_variables');

module.exports.parsedUserInput = (content) => {
    // returns an array (arr[0] is the command, arr[1] is a youtubelink or something else depending on the command..)
    return content.substring(PREFIX.length).split(" ");
}
