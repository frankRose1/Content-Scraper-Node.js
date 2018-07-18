const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const rp = require('request-promise');
const json2csv = require('json2csv');

// 1) Program your scraper to check for a folder called ‘data’. If the folder doesn’t exist, 
    //the scraper should create one. If the folder does exist, the scraper should do nothing.
// fs.mkdir('data',  (err) => {
//     if (err) {
//         if (err.code === 'EEXIST') {
//             console.log('Data directory already exists.');
//             return;
//         } else {
//             console.error(err.message);
//         }
//     } else {
//         console.log('Data Directory Created.');
//     }
// });

fs.readdir(__dirname, (err, files) => {
    if (err) {
        console.error(err.message);
    } else {
        if (files.includes('data')) {
            console.log('Data directory already exists.');
        } else {
            fs.mkdir('data', (err) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log('Data directory created.');
                }
            });
        }
    }
});


//rp accepts an options object as input and returns a promise
    const options = {
        url: 'http://shirts4mike.com/shirts.php',
        transform: body => cheerio.load(body)
    }

    rp(options)
        .then($ => {
                //scrape info for 8 t-shirts
                process.stdout.write('logging data');
                console.log($);
        })
        .catch(err => console.error(err.message));

//Scraping and Saving Data:
    // The scraper should get the price, title, url and image url from the product page and save this information into a CSV file.
    // The information should be stored in an CSV file that is named for the date it was created, e.g. 2016-11-21.csv.
    // Assume that the the column headers in the CSV need to be in a certain order to be correctly entered into a database. They should be in this order: Title, Price, ImageURL, URL, and Time
    // The CSV file should be saved inside the ‘data’ folder.

//If your program is run twice, it should overwrite the data in the CSV file with the updated information.

//If http://shirts4mike.com is down, an error message describing the issue should appear in the console.
    // The error should be human-friendly, such as “There’s been a 404 error. Cannot connect to http://shirts4mike.com.”
    // To test and make sure the error message displays as expected, you can disable the wifi on your computer or device.