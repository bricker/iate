#!/usr/bin/env node

const json2csv = require('json2csv').parse;
const fs = require('fs');

const newline = "\r\n";
const filename = __dirname + '/iate.csv';
const [,, ...command] = process.argv;
var fields = ['Timestamp', 'Description'];

const printHelp = () => {
  console.log("iate is a command line tool to help you track your eating habits.");
  console.log("Usage: iate \"An entire pizza.\"");
  console.log("To view the log: iate what");
  console.log("To reset the log: iate clear");
  console.log("To read this help message: iate help");
};

const readLog = () => {  
  fs.readFile(filename, function(err, data) {
    if (err || data.length === 0) {
      console.log('No entries yet! Thank you.');
      return;
    }

    console.log(data.toString());
  });
};

const writeEntry = (text) => {
  const data = { [fields[0]]: Date.now(), [fields[1]]: text.join(' ') };

  fs.stat(filename, function (err, stat) {
    if (!err) {
      const csvEntry = json2csv([data]) + newline;
      fs.appendFile(filename, csvEntry, _ack);
    } else {
      const csvEntry = json2csv([data], { fields }) + newline;
      fs.writeFile(filename, csvEntry, _ack);
    }
  });
};

const clearLog = () => {
  fs.truncate(filename, 0, function() {
    console.log("I've cleared the log, thank you.");
  });
};

const _ack = (err) => {
  if (err) throw err;
  console.log("I've logged this entry, thank you.");
};

const firstWord = command[0];
switch (firstWord) {
  case 'help':
    printHelp();
    break;
  case 'what':
  case 'read':
    readLog();
    break;
  case 'clear':
    clearLog();
    break;
  default:
    writeEntry(command);
    break;
}
