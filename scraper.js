/**
 *  Content Scraper
 *    Command line app that scrapes data from an e-commerce website
 *    npm install to download dependencies
 *    npm start to start the app
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const rp = require('request-promise');
const Json2csvParser = require('json2csv').Parser;
const entryPoint = 'http://shirts4mike.com/shirts.php';
const baseDir = path.join(__dirname, '/.data/');
const date = new Date();
const month = date.getMonth() + 1;
const fileTitle = `${date.getFullYear()}-${month < 10 ? `0${month}` : month}-${date.getDate()}`;

//create the data directory to store the scraped data and error logs
function createDataDir(){
    fs.mkdir('.data', (err) => {
        if (!err) {
            console.log('\x1b[36m%s\x1b[0m', '.data directory has been created, great!');
            scrapeEntryPoint();
        } else {
            if (err.code == 'EEXIST') {
                console.log('\x1b[36m%s\x1b[0m', 'Looks like the .data directory already exists.');
                scrapeEntryPoint();
            } else {
                errorLogger('Error creating the data directory', err);
            }
        }
    });
}

function scrapeEntryPoint(){
    console.log('\x1b[33m%s\x1b[0m', 'Let the scraping begin!🎉');
    
    const options = {
        uri: entryPoint,
        transform: (body) => cheerio.load(body)
    };

    rp(options)
        .then( $ => {
            const hrefsContainer = [];
            const productLinks = $('ul.products li a');
            productLinks.each( (i, link) => {
                hrefsContainer.push(link.attribs.href);
            });
            scrapeIndividualItems(hrefsContainer);
        })
        .catch(err => {
            errorLogger(`Error scraping data at ${entryPoint}. ${err.message}`);
        });
}

async function scrapeIndividualItems(productEndPoints){
    const productData = []; //store data about all products scraped here
    const promiseContainer = []; //store the promises to be resolved in one batch

    productEndPoints.forEach(endPoint => {
        const productOptions = {
            uri : `http://shirts4mike.com/${endPoint}`,
            transform: (body) => cheerio.load(body)
        };
        //store the promise
        const promise = rp(productOptions);
        promiseContainer.push(promise);
    });

    try {
        const productsResponse = await Promise.all(promiseContainer);
        process.stdout.write('Loading product data');
        productsResponse.forEach( ($, i) => {
            process.stdout.write(".");
            const productInfo = {};
            productInfo.title = $('.shirt-details h1').text().substring(4);
            productInfo.price = $('.shirt-details .price').text();
            productInfo.url = `http://shirts4mike.com/${productEndPoints[i]}`;
            productInfo.imgUrl = `http://shirts4mike.com/${$('.shirt-picture span img').attr('src')}`;
            productInfo.time = date.toLocaleTimeString('en-US');
            productData.push(productInfo);
        });
    } catch (e) {
        errorLogger("Error converting Json data to csv");
    }
    
    console.log('✅');
    convertToCsv(productData);  
}

//convert the json to csv
function convertToCsv(data){
    try {
        const fields = [
            { label: 'Title', value: 'title' },
            { label: 'Price', value: 'price' },
            { label: 'ImageUrl', value: 'imgUrl' },
            { label: 'URL', value: 'url' }, 
            { label: 'Time', value: 'time' }
        ];
        const json2csv = new Json2csvParser({fields});
        const csv = json2csv.parse(data);
        createNewCsvFile(csv);
    } catch (e) {
        errorLogger('Error converting JSON data to csv.');
    }
}

function createNewCsvFile(fileData){
    //create a new file, if it already exists, update it
    fs.open(`${baseDir}${fileTitle}.csv`, 'wx', (err, fileDescriptor) => {
        if (!err && fileDescriptor) {
            //now write the file with the data from "file"
            fs.writeFile(fileDescriptor, fileData, err => {
                if (!err) {
                    //close the file
                    fs.close(fileDescriptor, err => {
                        if (!err) {
                            console.log('\x1b[32m%s\x1b[0m', "Successfully created new csv file!");
                        } else {
                            cerrorLogger("Error closing new csv file", err.code);
                        }
                    });
                } else {
                    errorLogger("Error writing to file", err.code);
                }
            });
        } else {
            if (err.code == 'EEXIST') {
                //when data is scraped multiple times a day, update the file
                updateExistingCsv(fileData);
            } else {
                errorLogger('Error saving new csv file from: '+fileTitle);
            }
        }
    });
}

function updateExistingCsv(fileData){
    //open existing file for updating, "r+" will error if the file doesnt exist
    fs.open(`${baseDir}${fileTitle}.csv`, "r+", (err, fileDescriptor) => {
        if (!err && fileDescriptor) {

            fs.truncate(fileDescriptor, err => {
                if (!err) {

                    fs.writeFile(fileDescriptor, fileData, err => {
                        if (!err) {

                            fs.close(fileDescriptor, err => {
                                if (!err) {
                                    console.log('\x1b[32m%s\x1b[0m', 'Successfully updated existing csv file!');
                                } else {
                                    errorLogger('Error updating existing csv file.', err.code);
                                }
                            });

                        } else {
                            errorLogger("Error writing to existing csv file.", err.code);
                        }
                    });

                } else {
                    errorLogger("Error Truncating existing file", err.code);
                }
            });

        } else {
            errorLogger("Error opening existing csv file", err.code);
        }
    });
}

function errorLogger(errorMsg){
    //append data to an error log, creating it if it doesnt exist yet
    const fileData = `${errorMsg} \n`;
    fs.appendFile(`${baseDir}errors.log`, fileData, 'utf-8', err => {
        if (!err) {
            console.log('\x1b[31m%s\x1b[0m', 'An error was logged to ".data/errors.log".');
        } else {
            console.error('Error logging to ".data/errors.log".');
        }
    });
}

//start the app
createDataDir();