# Content With Scraper Node.js
This content scraper makes an http request to the product page of an e-commerce site, gets the endpoints for individual items, and makes additional http requests to get specific data about those items. The data is then converted from Json to a csv format and saved to the ```.data``` directory. Any errors encountered while making requests and/or working with the file system are logged in the ```.data``` directory too. 

## How to use
* Download or clone this repo and run ```npm install``` to get the dependencies
* ```npm start``` to begin the app and you should be good to go!
* A ```.data``` folder will be created for you if it doesnt already exist

## App Features
* When the scraper starts, a data folder is created if it doesnt already exist
* Scraper starts on a single entry point and gets the urls for inidividual products
* Individual requests are made for each product
* Following Product info is scraped:
    * Title
    * Price
    * Url
    * Image Url
    * Time of day the data was scraped
* Json data is converted to csv format and saved with a timestamp title
    * If the file doesn't exist yet, its created
    * If the file already exists, its updated
* Errors are logged to their own file in ```.data/errors.log```

## Built With
* Node.js
* Modules Used:
    * fs
    * path
    * cheerio
    * request-promise
    * json2csv

## Author 
Frank Rosendorf