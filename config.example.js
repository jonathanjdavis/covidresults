const config = {};

config.dirBase = __dirname;
config.dirPatients = `${config.dirBase}/patients/`;
config.dirResults = `${config.dirBase}/results/`;
config.dirlogs = `${config.dirBase}/logs/`;
config.logError = `errors.txt`;
config.logApp = `app.txt`;
config.formatResults = `html`;

config.fromEmail = '';
// see https://nodemailer.com/smtp/
// config.mail = {
//     host: '',
//     port: 587,
//     secure: false,
//     auth: {
//         user: '',
//         pass: ''
//     }
// };
config.mail = {
    host: 'localhost',
    port: 25,
    tls: {
      rejectUnauthorized: false
    },
};

module.exports = config;