const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const rp = require('request-promise');
const Json2csvParser = require('json2csv').Parser;

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

// 1) Program your scraper to check for a folder called ‘data’. If the folder doesn’t exist, 
    //the scraper should create one. If the folder does exist, the scraper should do nothing.
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

// http://shirts4mike.com/shirts.php is the only entry point we can use, must navigate to individual item pages by getting the href
    const productEndpoints = []; //holds the hrefs for individual items
    const options = {
        url: 'http://shirts4mike.com/shirts.php',
        transform: body => cheerio.load(body)
    }

    rp(options)
        .then($ => {
            //get the enpoints for the products on the page
            $('ul.products li a').each( (i, link) => {
                productEndpoints.push(link.attribs.href);
            });
            getProductInfo(productEndpoints);
        })
        .catch(err => console.error(err.message));

function getProductInfo(endpoints){
    const productData = []; //will hold data about the items scraped
    let i = 0;
    function next(){
        if (i < endpoints.length) {
            const productOptions = {
                url: `http://shirts4mike.com/${endpoints[i]}`,
                transform: body => cheerio.load(body)
            };
    
            const itemData = { 
                "title": '',
                "price": '',
                "imgUrl": '',
                "url": productOptions.url
            };
    
            rp(productOptions)
                .then($ => {
                    //this will be an individual product page
                    //assign values to itemData 
                        //==> then spread that data in to productData
                    itemData.title = $('div.shirt-details h1').text().substr(4);
                    itemData.price = $('h1 span.price').text();
                    itemData.imgUrl = `http://shirts4mike.com/${$('div.shirt-picture span img').attr('src')}`;
                    //put individual items in to parent object
                    productData.push(itemData);
                    i++;
                    return next();
                })
                .catch(err => console.error(err.message));
        } else {
            console.log(productData);
            storeData(productData);
        }
    } //end next func
    return next(); //so that "else" will be called
}

//Scraping and Saving Data:
    // The scraper should get the price, title, url and image url from the product page and save this information into a CSV file.
    // The information should be stored in an CSV file that is named for the date it was created, e.g. 2016-11-21.csv.
    // Assume that the the column headers in the CSV need to be in a certain order to be correctly entered into a database. They should be in this order: Title, Price, ImageURL, URL, and Time
    // The CSV file should be saved inside the ‘data’ folder.
//save the data from the productData to a csv file
function storeData(data){
    const fields = ['title', 'price', 'imgUrl', 'url'];
    const json2csvParser = new Json2csvParser({ fields });

    try {
        const csv = json2csvParser.parse(data);
        console.log(csv);
    } catch (err) {
        console.error(err.message);
    }
}

//If your program is run twice, it should overwrite the data in the CSV file with the updated information.

//If http://shirts4mike.com is down, an error message describing the issue should appear in the console.
    // The error should be human-friendly, such as “There’s been a 404 error. Cannot connect to http://shirts4mike.com.”
    // To test and make sure the error message displays as expected, you can disable the wifi on your computer or device.