'use strict';
const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const { DateTime } = require("luxon");

const covidResultEvent = new EventEmitter();

function theHumanDelay(t1 = 77, t2 = 47) {
    return Math.round(Math.random()*t1) + t2;
}

class CovidResults {
    constructor(args = null) {
        this.browser = {};
        this.page = {};
    }

    async checkResults(patients) {
        this.browser = await puppeteer.launch({
            // headless: false
        });
        this.page = await this.browser.newPage();
        const page = this.page;
        for(const patient of patients) {
            await page.waitForTimeout(theHumanDelay());
            let results = { result: false };
            try {
                switch(patient.facility) {
                    case "NYGH":
                        results = await this.nygh(patient);
                        break;
                    case "OHIP":
                        results = await this.ohip(patient);
                        break;
                    default:
                        throw 'error: no function matching ' + patient.facility;
                }
            } catch(err) {
                covidResultEvent.emit('error', patient, err);
                continue;
            }
    
            if(results.result) {
                covidResultEvent.emit('results', patient, results.data);
            } else {
                covidResultEvent.emit('noResults', patient, results.data);
            }

        }
        this.browser.close();
    }
    
    // check North York General Hospital website
    async nygh(patient) {
        const page = this.page;
        await page.goto('https://connect.nygh.on.ca/covid/SitePages/covid.aspx');
        await page.waitForSelector('#fname', {
            visible: true,
        });
        await page.waitForTimeout(theHumanDelay());
        await page.type('input#fname', patient.fname);
        await page.type('input#lname', patient.lname);
        await page.type('input#pcode', patient.pcode.substring(0,3));
        await page.type('input#pcode1', patient.pcode.substring(3,6));
        await page.type('input#mrn', patient.mrn);
        await page.click('input#button');

        await page.waitForSelector('#info > table', {
            visible: true,
        });

        const tableData = await page.evaluate(() => {
            const tdArray = Array.from(document.querySelectorAll('#info > table tr td'));
            return tdArray.map(td => td.innerText);
        });


        if(tableData[6] == 'In Progress') {
            return {
                result: false,
                data: null,
            };
            
        } else {
            const tableHTML = await page.evaluate(() => document.querySelector('#info').innerHTML);
            return {
                result: true,
                data: tableHTML,
            };
        }
    }

    // check Ontario Ministry Of Health website
    async ohip(patient) {
        const page = this.page;
        await page.goto('https://covid19results.ehealthontario.ca:4443/agree');

        await page.waitForSelector('label[for="id-type-ohc"]');
        await page.click('label[for="id-type-ohc"]');

        await page.waitForTimeout(theHumanDelay());
        await page.waitForSelector('#btn_step2_ohc_known');
        await page.click('#btn_step2_ohc_known');

        await page.waitForSelector('label[for="acceptedTerm1"]')
        await page.click('label[for="acceptedTerm1"]');
        
        
        await page.waitForSelector('button#button_submit:not([disabled])');
        await page.waitForTimeout(theHumanDelay());
        await page.click('button#button_submit');
    
        await page.waitForSelector('input#hcn');
        await page.waitForTimeout(theHumanDelay());
        await page.focus('input#hcn');
        await page.type('input#hcn', patient.hcn,  {delay: theHumanDelay()});
        await page.waitForTimeout(theHumanDelay());
        await page.type('input#vCode', patient.vc,  {delay: theHumanDelay()});
        
        await page.waitForTimeout(theHumanDelay());
        await page.focus('input#scn');
        await page.type('input#scn', patient.scn,  {delay: theHumanDelay()});


        await page.waitForTimeout(theHumanDelay());
        await page.focus('input#fname');
        await page.type('input#fname', patient.fname,  {delay: theHumanDelay()});
        await page.keyboard.press("Tab");
        await page.waitForTimeout(theHumanDelay());
        await page.type('input#lname', patient.lname,  {delay: theHumanDelay()});
    


        let dt = DateTime.fromISO(patient.dob);
        await page.waitForTimeout(theHumanDelay());
        await page.focus('input#dob-igc-yyyy');
        await page.type('input#dob-igc-yyyy', dt.toFormat('y'), {delay: theHumanDelay()});
        await page.keyboard.press("Tab");
        await page.waitForTimeout(theHumanDelay());
        await page.type('input#dob-igc-mm', dt.toFormat('LL'),  {delay: theHumanDelay()});
        await page.keyboard.press("Tab");
        await page.waitForTimeout(theHumanDelay());
        await page.type('input#dob-igc-dd', dt.toFormat('dd'),  {delay: theHumanDelay()});

 
        await page.waitForTimeout(theHumanDelay());
        switch(patient.sex) {
            case "M":
                await page.hover('label[for="gender-male"]');
                await page.click('label[for="gender-male"]');
                break;
            case "F":
                await page.hover('label[for="gender-female"]');
                await page.click('label[for="gender-female"]');
                break;
            case "O":
                await page.hover('label[for="gender-other"]');
                await page.click('label[for="gender-other"]');
                break;
        }
    
        await page.waitForTimeout(theHumanDelay());
        await page.type('input#pCode', `${patient.pcode.substring(0,3)} ${patient.pcode.substring(3,6)}`,  {delay: theHumanDelay()});

        await page.waitForTimeout(theHumanDelay(750,250));
        await page.waitForSelector('button#button_verify:not([disabled])');
        await page.click('button#button_verify');
    
        await page.waitForNavigation();
    
        let y = 0;
        login: while(y < 9000) {
            if(await page.$('section.result-section')) {
                let x = 0;
                results: while(x < 12000) {
                    if(await page.$('#result_no_results_text')) {
                        return {
                            result: false,
                            data: null,
                        };
                    } else if (
                        await page.$('#result_negative_title_card') || 
                        await page.$('#result_positive_detected_title_card') || 
                        await page.$('#result_withdrawn_title_card') || 
                        await page.$('#result_unavailable_title_card') ||
                        await page.$('#result_result_unavailable_title_invalid')
                    ) {
                        await page.waitForSelector('section.result-section ~ div:nth-of-type(2)');
                        let resultsHTML = await page.$eval('section.result-section ~ div:nth-of-type(2)', (element) => {
                            return element.innerHTML;
                        });
                        return {
                            result: true,
                            data: resultsHTML,
                        };
            
                    }
                    await page.waitForTimeout(50);
                    x++;
                }
                break login;
            } else if(await page.$('#error_msg_div')) {
                let loginError = await page.$eval('#error_msg_div', (element) => {
                    return element.innerText;
                });
                throw `login error: ${loginError}`;
            }
            await page.waitForTimeout(50);
            y++;
        }
    
        throw 'something went wrong wait for results vs no results sections';
    }

}

module.exports = { CovidResults, covidResultEvent };