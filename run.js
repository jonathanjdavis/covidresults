'use strict';
const fs = require('fs');
const nodemailer = require('nodemailer');
const { DateTime } = require("luxon");
const { CovidResults, covidResultEvent } = require('./CovidResults');
const config = require('./config');
const transporter = nodemailer.createTransport(config.mail);

const commandLineArguments = process.argv.slice(2);


let patients = parsePatientFiles();

run();

async function run() {
    let covidResults = new CovidResults();

    let patients = parsePatientFiles();
    patients = filterExistingResults(patients);
    
    try {
        await covidResults.checkResults(patients);
    } catch(err) {
        fs.appendFile(config.dirlogs + config.logError, `${DateTime.local().toString()} ${err}\n`, 'utf8', (fsErr) => {
            if (fsErr) throw fsErr;
        });
    }
}

// Email
covidResultEvent.on('results', (patient, results) => {
    let message = {
        from: config.fromEmail,
        to: patient.email,
        subject: 'COVID Test Results',
        html: `<html><head><title>results</title></head><body>${results}\n<body>\n</html>`,
    };
    transporter.sendMail(message);
});

// Write to File
covidResultEvent.on('results', (patient, results) => {
    let data = `<html><head><title>results</title></head><body>${results}\n<body>\n</html>`;
    fs.writeFileSync(`${config.dirResults}${patient.filename}-${DateTime.local().toISODate()}.${config.formatResults}`, data);
});

covidResultEvent.on('noResults', (patient, results = null) => {
    //console.log('no results where found :(');
    let dt = DateTime.local();
    if(patient.noresults.includes(parseInt(dt.toFormat('H')))) {
        let asOf = dt.toLocaleString(DateTime.DATETIME_MED);
        let htmlBody = '<html><body><h2>No Results</h2><p>Checked: <b>' + asOf + '</b></body></html>';
        let message = {
            from: config.fromEmail,
            to: patient.email,
            subject: 'No Results as of ' + asOf,
            html: htmlBody,
        };
        transporter.sendMail(message);
    }

});

function parsePatientFiles() {
    let patients = [];
    const files = fs.readdirSync(config.dirPatients).filter(filename => filename.endsWith('.json') && !filename.startsWith('_') && !filename.startsWith('.'));
    for(const file of files) {
        let patientJSON = JSON.parse(fs.readFileSync(config.dirPatients + file, 'utf8'));
        patientJSON.filename = file.slice(0, -5);
        patients.push(patientJSON);
    }
    return patients;
}

function filterExistingResults(patients) {
    const resultFiles = fs.readdirSync(config.dirResults).filter(filename => !filename.startsWith('_') && !filename.startsWith('.'));
    return patients.filter(patient => {
        return !resultFiles.filter(resultFile => {
            return resultFile.startsWith(patient.filename);
        }).length;
    });
}