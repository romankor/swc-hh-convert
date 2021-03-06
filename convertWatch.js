/**
 * This script watches the directory specified by the first argument to the script
 * and will take Seals With Clubs hand histories and convert them to Full Tilt
 * hand histories.
 */
var sys = require("sys");
var fs = require('fs');
var path = require('path');
var swcConvert = require('./swcConvert.js');
var bovadaConvert = require('./bovadaConvert.js');
var _ = require('underscore')._;
var hhDir = process.argv[2];
var outputDir = process.argv[3];


var converters = {
    bovada: {
        regex: /^Bovada Hand #[0-9]+.*/,
        converter: swcConvert
    }
    ,
    swc: {
        regex: /^Hand #[0-9]+-[0-9]+.*/,
        converter: bovadaConvert
    }

};

if (!hhDir) {
    sys.puts("You must provide the swc hand history directory as the first argument.");
    process.exit(1);
}

if (!outputDir) {
    sys.puts("You must provide the output directory as the second argument.");
    process.exit(1);
}

console.log("WRITING TO", outputDir);
var hands = {};
/**
 * Tail all existing files in hh directory
 */

var convertedFiles = fs.readdirSync(outputDir);

// Read all files in the folder in parallel.
function convertFile(fileName) {
    fs.readFile(path.join(hhDir, fileName), {encoding: 'UTF-8'}, function (error, data) {
        if (error) {
            console.log("Error: ", error);
        } else {
            hands[fileName] = "";
            var lines = data.split('\n');
            _.each(lines, function (line) {
                bufferTillRake(line.toString(), fileName)
            });
            console.log("Successfully converted file " + fileName);
        }
    });
}
fs.readdir(hhDir, function (err, files) {
    if (err) {
        console.log("Error reading files: ", err);
    } else {
        // keep track of how many we have to go.
        var remaining = files.length;
        var totalBytes = 0;

        if (remaining == 0) {
            console.log("Done reading files. totalBytes: " +
                totalBytes);
        }

        // for each file,
        for (var i = 0; i < files.length; i++) {
            if (files[i].match(/[^\\/]+\.txt$/) == null)
                continue;

            if (convertedFiles.indexOf(files[i]) != -1) {
                console.log('file ' + files[i] + ' already converted');
                continue;
            }
            // read its contents.
            convertFile(files[i]);
        }
    }
});


fs.watch(hhDir, function (event, filename) {
    if (filename && event == 'rename') {
        try {
            convertFile(filename)
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
function bufferTillRake(data, fileName) {
    if (data.match(/.*Hand #.*/))
        hands[fileName + 'inHand'] = true;

    hands[fileName] += data + '\n';
    if (hands[fileName + 'inHand'] == true && data.trim() == "") {
        try {
            //var converter = undefined;
            //for (i in converters) {
            //    if (converters.hasOwnProperty(i)) {
            //        match = hands[fileName].trim().match(converters[i].regex);
            //        if (match) {
            //            converter = converters[i].converter;
            //            break;
            //        }
            //    }
            //}
            //if (converter == undefined) {
            //    console.log('No converter found for hand + ' + hands[fileName]);
                //return;
            //}
            var convertedHand = swcConvert.convert(hands[fileName], 1) + "\n\n";
            if (convertedHand.trim().length > 0) {
                fs.appendFile(path.join(outputDir, fileName), convertedHand, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        //console.log("The file was saved!");
                    }
                });
            }
            //console.log(convertedHand);
        } catch (e) {
            console.log(e);
            //console.log('Could not convert hand : \n ' + data);
        } finally {
            hands[fileName + 'inHand'] = false;
            hands[fileName] = "";
        }
    }
}

