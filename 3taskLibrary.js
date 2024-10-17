// Create secure connection using TLS protocol
const tls = require('tls');
// Use cheerio library to parse HTML
const cheerio = require('cheerio');

// Define the target host and path of the changed page
const host = 'librarius.md';
const path = '/ro/catalog/tops';
const port = 443;

// Create HTTP-formatted request
const request = `GET ${path} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`;

// Set TLS options to disable hostname checking
const tlsOptions = {
    // Connect to cdn.librarius.md but use librarius.md in the request header
    host: 'cdn.librarius.md',
    port: port,
    // Disable verification of certificate for successful scraping
    rejectUnauthorized: false,
    // Disable host name verification
    checkServerIdentity: () => null,
};

// Create a socket connection with predefined options
const client = tls.connect(tlsOptions, () => {
    // Send HTTPS request over TLS socket
    client.write(request);
});

// Handle the data returned by the server
let responseData = '';
client.on('data', (data) => {
    responseData += data.toString();
});

// Trigger the event when the server finished sending data and closed the connection
client.on('end', () => {
    // Split HTTP response into body and headers, [1] - body
    const body = responseData.split('\r\n\r\n')[1];

    // Cheerio to parse HTML content
    const $ = cheerio.load(body);

    // Verify selectors
    const bookName = $('.card-title');
    const bookPrice = $('.card-price');

    console.log(`Found ${bookName.length} titles and ${bookPrice.length} prices`);

    let bookList = [];
    bookName.each((index, element) => {
        let productName = $(element).text().trim();
        let noPrice = bookPrice[index] ? $(bookPrice[index]).text().trim() : 'N/A';

        // Validation to ensure the price is numeric
        let price = parseInt(noPrice.replace(/\D/g, ''), 10);
        price = isNaN(price) ? 'N/A' : price;

        let product = {
            name: productName,
            price: price
        };
        bookList.push(product);
    });

    // Log the products array to check if data was extracted
    console.log("Extracted Products:\n", bookList);

    // Conversion MDL to EUR
    const EUR_TO_MDL = 19.34;
    const MDL_TO_EUR = 1 / EUR_TO_MDL;

    // Using map to convert prices from MDL to EUR
    let convertedBooks = bookList.map(product => {
        let convertedPrice = (product.price * MDL_TO_EUR).toFixed(2);
        return {
            name: product.name,
            price: convertedPrice
        };
    });

    // Filter books based on a price range in EUR
    const minRange = 5;
    const maxRange = 10;

    let filteredBooks = convertedBooks.filter(product => {
        return product.price >= minRange && product.price <= maxRange;
    });

    // Reduce to calculate the total price of filtered books
    let totalPrice = filteredBooks.reduce((sum, product) => {
        return sum + parseFloat(product.price);
    }, 0);

    let finalData = {
        filteredBooks: filteredBooks,
        sum: totalPrice,
        timestamp: new Date().toISOString()
    };

    // console.log('Extracted books:', books);
    // console.log('Converted books:', convertedBooks);
    // console.log('Filtered books:', filteredBooks);
    // console.log('Total price:', totalPrice);
    console.log('Final data:', finalData);

    // JSON serialization
    function JSONserialization(data) {
        const booksJSON = data.filteredBooks.map(book => {
            return `{"name": "${book.name}", "price": ${book.price}}`;
        }).join(', ');

        const jsonString = `{ "filteredBooks": [${booksJSON}], }`;

        return jsonString;
    }

    // XML serialization
    function XMLserialization(data) {
        const booksXML = data.filteredBooks.map(book => {
            return `<book>
                        <name>${book.name}</name>
                        <price>${book.price}</price>
                    </book>`;
        }).join('');
        const xmlString = `<data> 
                                      <filteredBooks>${booksXML}</filteredBooks> 
                                  </data>`;

        return xmlString;
    }

    const xmlData = XMLserialization(finalData);
    const jsonData = JSONserialization(finalData);

    console.log('Serialized XML:\n', xmlData);
    console.log('Serialized JSON:\n', jsonData);
});

// Handle errors during the TLS connection
client.on('error', (error) => {
    console.error('There was a connection error: ', error);
});

