# COVID Results

COVID Results is a script to scrape Ontario / Hospital websites and email you when COVID test results are available

## Installation

Use Yarn (or NPM) package manager to install

```bash
yarn install
```


## Usage

```bash
node run.js
```


Ontario Health Example:
{
   "facility": "OHIP",
   "fname": "Jon", // First Name as it appears on your Health card
   "lname": "Smith", // Last Name as it appears on your Health card
   "pcode": "M5M4N4", // Postal Code, No spaces
   "hcn": "1234567890", // Health Card Number, 10 digits
   "vc": "AA", // Version Code (Follows Health Card Number), 2 letters
   "scn": "RR1234567", // Number from rear of Health Card
   "dob": "1901-01-01", // Date of Birth, Year-Month-Day
   "sex": "M", // Sex, M, F, or O (other)
   "noresults" : [9,18], // Hour you wish to receive a 'no results' email, based on 24 hour clock. 
   "email": "jon@example.com" // Address to email results from this patient
}

North York General Example:
{
   "facility": "NYGH",
   "fname": "Jon", // First Name as it appears on the form from North York General
   "lname": "Smith", // Last Name as it appears on the form from North York General
   "pcode": "M5A4B8", // Postal Code, No spaces
   "mrn": "2178831", // Medical Records Number, as it appears on the form from North York General
   "email": "jon@example.com"  // Address to email results from this patient
}

## Authors

Jonathan J Davis 
https://www.jonathanjdavis.com
jonathan@davisinc.ca

## License

[MIT](https://choosealicense.com/licenses/mit/)