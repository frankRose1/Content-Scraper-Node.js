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
const options = {
    url,
    transform: body => cheerio.load(body)
}

//scraper checks for a "data" folder and creates it if it doesnt exist
fs.mkdir('data',  (err) => {
    if (err) {
        if (err.code === 'EEXIST') {
            console.log('Data directory already exists.');
            return;
        } else {
            console.error(err.message);
        }
    } else {
        console.log('Data directory created.');
    }
});

rp(options)
    .then($ => {
        const hrefs = [];
        //get the enpoints for the products on the page
        $('ul.products li a').each( (i, link) => {
            hrefs.push(link.attribs.href);
        });
        getProductInfo(hrefs);
    })
    .catch(errorLogger);

async function getProductInfo(endpoints){

    const allProductData = [];
    const productUrlArr = [];
    const promiseArr = [];
    endpoints.forEach(endpoint => {
        const productUrl = `http://shirts4mike.com/${endpoint}`;
        const promise = rp(productUrl);
        promiseArr.push(promise);
        productUrlArr.push(productUrl);
    });

    try{
        const response = await Promise.all(promiseArr);
        response.forEach( (res, i) => {
            const itemData = {time: fileCreationDate};
            const $ = cheerio.load(res);
            itemData.title = $('div.shirt-details h1').text().substr(4);
            itemData.price = $('h1 span.price').text();
            itemData.imgUrl = `http://shirts4mike.com/${$('div.shirt-picture span img').attr('src')}`;
            itemData.url = productUrlArr[i];
            allProductData.push(itemData);
        });
    } catch(e) {
        console.log(e);
    }
    storeData(allProductData);
}

//If your program is run twice, it should overwrite the data in the CSV file with the updated information.
function storeData(data){
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
    //writeFile will replace the file if it already exists
    fs.writeFile(`data/${fileCreationDate}.csv`, csv, (err) => {
        if (err) {console.error(err.message);}
        console.log('Data has been saved to the "data" folder! 👍');
    });
}

//If http://shirts4mike.com is down, an error message describing the issue should appear in the console.
    // The error should be human-friendly, such as “There’s been a 404 error. Cannot connect to http://shirts4mike.com.”
    // To test and make sure the error message displays as expected, you can disable the wifi on your computer or device.

//When an error occurs, log it to a file named scraper-error.log
function errorLogger(err){
    const timeStamp = new Date();
    const errorMessage = err;
    const fileData = `[${timeStamp}] ${errorMessage} \r\n`;
    console.log(`❌  Oops! There's been an error: ${errorMessage}`);
    fs.appendFile('data/scraper-error.log', fileData, (err) =>{
        if (err) {console.error(err.message)};
        console.log('Error logged to "data/scraper-error.log". ');
    });
}