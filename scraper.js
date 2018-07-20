//modules
const fs = require('fs');
const cheerio = require('cheerio');
const rp = require('request-promise');
const Json2csvParser = require('json2csv').Parser;
//global declcarations
const url = 'http://shirts4mike.com/shirts.php';
const date = new Date();
const month = date.getMonth() + 1;
const fileCreationDate = `${date.getFullYear()}-${month < 10 ? `0${month}` : month}-${date.getDate()}`;

//scraper checks for a "data" folder and creates it if it doesnt exist
fs.mkdir('data', (err) => {
    if (err) {
        if (err.code === 'EEXIST') {
            console.log('Looks like the data directory was already created, great!');
        } else {
            errorLogger(err);
        }
    } else {
        console.log('Data directory has been created!');
    }
});


// Start on this page, then get the hrefs to the individual products
async function scrapeEntryPoint(){
    console.log('Let the scraping begin!🎉');
    try {
        const response = await rp(url);
        const $ = cheerio.load(response);
        const hrefs = [];
        //get the enpoints for the products on the page
        $('ul.products li a').each( (i, link) => {
            hrefs.push(link.attribs.href);
        });
        scrapeProductInfo(hrefs);
    } catch(err) {
        errorLogger(err);
    }
}

//Get data on the individual products
async function scrapeProductInfo(endpoints){
    const allProductData = [];
    const productUrlArr = [];
    const promiseArr = [];
    //store a promise from each endpoint in the promiseArr
    endpoints.forEach(endpoint => {
        const productUrl = `http://shirts4mike.com/${endpoint}`;
        const promise = rp(productUrl);
        promiseArr.push(promise);
        productUrlArr.push(productUrl);
    });
    //scrape each endpoint
    try{
        const response = await Promise.all(promiseArr);
        process.stdout.write('Lodaing product data');
        response.forEach( (res, i) => {
            process.stdout.write('.');
            const itemData = {time: date.toLocaleTimeString('en-US')};
            const $ = cheerio.load(res);
            itemData.title = $('div.shirt-details h1').text().substr(4);
            itemData.price = $('h1 span.price').text();
            itemData.imgUrl = `http://shirts4mike.com/${$('div.shirt-picture span img').attr('src')}`;
            itemData.url = productUrlArr[i];
            allProductData.push(itemData);
        });
        console.log('✅');
        createCSV(allProductData);
    } catch(err) {
        errorLogger(err);
    }
}

//Use the data from scrapeProductInfo function to populate the csv
function createCSV(data){
    const fields = [
        {
            label: 'Title',
            value: 'title'
        },
        {
            label: 'Price',
            value: 'price'
        },
        {
            label: 'ImageUrl',
            value: 'imgUrl'
        },
        {
            label: 'URL',
            value: 'url'
        }, {
            label: 'Time',
            value: 'time'
        }];
    const json2csvParser = new Json2csvParser({ fields });
    const csv = json2csvParser.parse(data);

    saveFile(csv);
}


//If a .csv already exists then it should be removed and replaced with new data
function saveFile(file){
    fs.readdir('data', (err, files) =>{
        if (err) {
            errorLogger(err);
        }

        files.forEach(f => {
            if (f.includes('.csv')) {
                fs.unlink(`data/${f}`, (err) => {
                    if (err) {
                        errorLogger(err);
                    }
                    console.log(`Overwriting previous data in "data/${f}"...`);
                });
            }
        }) //end loop

        fs.writeFile(`data/${fileCreationDate}.csv`, file, (err) => {
            if (err) {
                errorLogger(err);
            }
            console.log('New product data has been saved to the "data" folder! 👍');
        });
    });
}

//When an error occurs, get information about the error and notifty the user in the console
function errorLogger(err){
    const timeStamp = new Date();
    let errorMessage;
    let fileData;

    if (err.statusCode === 404) {
        errorMessage = `🚫  There’s been a ${err.statusCode} error. Cannot connect to http://shirts4mike.com.`;
        console.error(errorMessage);
    } else {
        errorMessage = err;
        console.error('❌  Oops! There\'s been an error.');
    };

    fileData = `[${timeStamp}] ${errorMessage} \r\n`;
    fs.appendFile('data/scraper-error.log', fileData, (err) =>{
        if (err) {console.error(err.message)};
        console.log('Error was logged to "data/scraper-error.log".');
    });
}

setTimeout( () => {
    scrapeEntryPoint();  //start scraping!!
}, 1000);
