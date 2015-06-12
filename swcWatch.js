/**
 * This script watches the directory specified by the first argument to the script
 * and will take Seals With Clubs hand histories and convert them to Full Tilt
 * hand histories.
 */
var sys = require("sys");
var fs = require('fs');
var path = require('path');
var convert = require('./swcConvert.js');
var _ = require('underscore')._;

var hhDir = process.argv[2];
var outputDir = process.argv[3];


if (!hhDir) {
    sys.puts("You must provide the swc hand history directory as the first argument.");
    process.exit(1);
}

if (!outputDir) {
    sys.puts("You must provide the output directory as the second argument.");
    process.exit(1);
}

console.log("WRITING TO", outputDir)
var hands = {};
/**
 * Tail all existing files in hh directory
 */
function convertFromFile(fileName) {
    console.log('converting file ' + file_n);
    hands[fileName] = "";
    var lines = fs.readFileSync(path.join(hhDir, fileName)).toString().split('\n');
    _.each(lines, function (line) {
        bufferTillRake(line.toString(), this.toString())
    }, fileName);
}

var existingFiles = fs.readdirSync(hhDir);
var convertedFiles = fs.readdirSync(outputDir);

for (var i = 0; i < existingFiles.length; i++) {
    var file_n = existingFiles[i];

    if (file_n.match(/[^\\/]+\.txt$/) == null)
        continue;
    if (convertedFiles.indexOf(file_n) != -1) {
        console.log('file ' + file_n + ' already converted');
        continue;
    }

    convertFromFile(file_n);

}


fs.watch(hhDir, function (event, filename) {
    if (filename && event == 'rename') {
        try {
            convertFromFile(filename)
        } catch (e) {
            console.log(e)
        }
    }
});


/**
 * Buffers all lines of data sent to this function until it sees 'Rake (',
 * which signifies the end of the hand. Once the whole hand has been buffers
 * it is sent along to another function for processing.
 */
function bufferTillRake(data, filename) {
    hands[filename] = hands[filename] + "\n" + data;
    if (data.substr(0, 6) == "Rake (") {
        hands[filename] = hands[filename] + "\n\n";
        try {
            var convertedHand = convert.convert(hands[filename], 1);
            fs.appendFile(path.join(outputDir, filename), convertedHand, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    //console.log("The file was saved!");
                }
            });
        } catch (e) {
            console.log(e);
            console.log('Could not convert hand : \n ' + data);
        } finally {
            hands[filename] = "";
        }
    }
}

