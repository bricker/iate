#!/usr/bin/env node

const csv = require('papaparse');
const fs = require('fs');
const os = require('os');
const chrono = require('chrono-node');

const dir = os.homedir() + '/.iate';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, '0744');
}

const newline = "\r\n";
const filename = dir + '/iate.csv';
const [,, ...command] = process.argv;

const printHelp = () => {
  console.log("iate is a command line tool to help you track your eating habits.");
  console.log("Usage: iate \"An entire pizza.\"");
  console.log("To add an entry for a specific time: iate a pint of ice cream at 10am");
  console.log("To view the log in pretty format: iate what");
  console.log("To print a CSV: iate csv");
  console.log("To reset the log: iate clear");
  console.log("To see the location of the raw log: iate where");
  console.log("To edit the raw log: iate edit");
  console.log("To read this help message: iate help");
};

const readLog = ({ pretty = false }) => {
  fs.readFile(filename, function(err, data) {
    if (err || data.length === 0) {
      console.log('No entries yet! Thank you.');
      return;
    }

    if (!pretty) {
      console.log(data.toString());
      return;
    }

    const { data: parsedData } = csv.parse(data.toString())
    const rows = parsedData.slice(1).filter((row) => { return row.join().trim().length > 0 });
    const sortedRows = rows.sort((a, b) => { return parseInt(a[0], 10) - parseInt(b[0], 10) });
    let output = "";

    sortedRows.forEach((row) => {
      output = output + row[1] + "\t" + row[2] + "\n";
    });

    console.log(output);
  });
};

const writeEntry = (words) => {
  let date;
  const processedWords = [];

  words.some((word, i) => {
    let finished = false;

    switch (word) {
      case 'at': {
        const dateWords = words.slice(i+1, i.length);
        date = chrono.parseDate(dateWords.join(' '));
        finished = true;
        break;
      }

      default: {
        processedWords.push(word);
      }
    }

    return finished;
  });

  date = date || new Date();

  const formattedDate = date.toLocaleDateString('en', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const data = {
    fields: ['UTS', 'Pretty Date', 'Description'],
    data: [
      date.getTime(),
      formattedDate,
      processedWords.join(' '),
    ]
  };

  fs.stat(filename, function (err, stat) {
    if (err || stat.size === 0) {
      const csvEntry = csv.unparse(data);
      fs.writeFile(filename, csvEntry, _ack);
    } else {
      const csvEntry = csv.unparse(data, { header: false });
      fs.appendFile(filename, '\r\n' + csvEntry, _ack);
    }
  });
};

const clearLog = () => {
  fs.unlink(filename, function() {
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
    readLog({ pretty: true });
    break;
  case 'csv':
    readLog({ pretty: false });
    break;
  case 'clear':
    clearLog();
    break;
  case 'where':
    console.log(filename);
    break;
  case 'edit':
    require('child_process').spawn(process.env.EDITOR || 'vim', [filename], {
      detached: true,
      stdio: 'inherit',
    });
    break;
  default:
    writeEntry(command);
    break;
}
