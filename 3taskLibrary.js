const tls = require('tls');
// Use cheerio library to parse HTML
const cheerio = require('cheerio');


// Define the target host and path of the changed page
const host = 'librarius.md';
const path = '/ro/catalog/tops/page/2';
// The page has a secured connection which why we use a TLC protocol
const port = 443;

// Create HTTP-formatted request
const request = `GET ${path} HTTP/1.1\r\nHost: ${host}\r\nConnection: close\r\n\r\n`;

// Set TLS options to disable hostname checking
const tlsOptions = {
    // Connect to cdn.librarius.md but use librarius.md in the request header
    // This way we are accessing the content source optimized for distribution.
    host: 'cdn.librarius.md',
    port: port,
    // Disable verification of certificate for 100% successful scraping
    rejectUnauthorized: false,
    // Disable host name verification of unchecking server's identity matching the expected hostname
    checkServerIdentity: () => null,
};

// Create a socket connection with predefined options allowing data to be sent over te network without a problem
const client = tls.connect(tlsOptions, () => {
    // Send HTTPS request over TLS socket
    client.write(request);
});

// Empty string to accumulate data received from server
let responseData = '';
// Handle the data returned by the server
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
        let price = parseFloat(noPrice.replace(/\D/g, ''));
        price = isNaN(price) ? 'N/A' : price;

        let product = {
            name: productName,
            price: parseFloat(price)
        };
        bookList.push(product);
    });

    // Log the products array to check if data was extracted
    // console.log("Extracted Products:\n", bookList);

    // Conversion MDL to EUR
    const EUR_TO_MDL = 19.34;
    const MDL_TO_EUR = 1 / EUR_TO_MDL;

    // Using map to convert prices from MDL to EUR
    let convertedBooks = bookList.map(product => {
        let convertedPrice = (product.price * MDL_TO_EUR).toFixed(2);
        return {
            name: product.name,
            price: parseFloat(convertedPrice)
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

    console.log('Converted books:', convertedBooks);
    // console.log('Filtered books:', filteredBooks);
    // console.log('Total price:', totalPrice);
    // console.log('Final data:', finalData);

    // JSON serialization
    function JSONserialization(data) {
        const booksJSON = data.map(book => {
            return `{"name": "${book.name}", "price": ${book.price}}`;
        }).join(', ');

        const jsonString = ` FilteredBooks: [${booksJSON}]`;
        return jsonString;
    }

    // XML serialization
    function XMLserialization(data) {
        const booksXML = data.map(book => {
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

    const xmlData = XMLserialization(filteredBooks);
    const jsonData = JSONserialization(filteredBooks);

    // console.log('Serialized XML:\n', xmlData);
    // console.log('Serialized JSON:\n', jsonData);

    function customSerialize(data) {
        if (!Array.isArray(data)) {
            data = [data];
        }

        return data.map(item => {
            let result = '';
            Object.keys(item).forEach(key => {
                let value = item[key];
                if (typeof value === 'string') {
                    result += `string(${key}):string(${value}); `;
                } else if (typeof value === 'number') {
                    result += `string(${key}):number(${value}); `;
                } else if (typeof value === 'boolean') {
                    result += `string(${key}):boolean(${value}); `;
                } else if (Array.isArray(value)) {
                    result += `string(${key}):<ul>`;
                    value.forEach(val => {
                        if (typeof val === 'number') {
                            result += `number(${val}); `;
                        } else if (typeof val === 'number') {
                            result += `boolean(${val}); `;
                        } else if (typeof val === 'string') {
                            result += `string(${val}); `;
                        }
                    });
                    result = result.trim() + `</ul>; `;
                } else if (typeof value === 'object' && value !== null) {
                    result += `string(${key}):<dl>`;
                    Object.keys(value).forEach(subKey => {
                        let subValue = value[subKey];
                        result += `string(${subKey}):${typeof subValue}(${subValue}); `;
                    });
                    result = result.trim() + `</dl>; `;
                }
            });
            return result.trim();
        }).join('|||');
    }

    // Example
    const complexData = {
        "name": "12 Wordsworth Classics",
        "number" : 24,
        "details": {
            "currency": "USD",
            "availability": false
        },
        "price": [6.46, 7.56],
    };

    // Example
    const complexData1 = [
        { name: 'Arta razboiului', price: 8.84 },
        { name: 'Minunea', price: 9.31 },
        { name: 'Unfu K Yourself.Elibereaza-ti Mintea si traieste-ti Viata', price: 9.82 }
    ];

    console.log(customSerialize(complexData));
    // console.log(customSerialize(complexData1));
    let serializedData = customSerialize(convertedBooks);
    console.log("The serialized data: \n", serializedData);

    function customDeserialize(serializedData) {
        function parseNestedStructure(dataString) {
            let nestedObject = {};
            let stack = [];
            let currentKey = null;

            const openTagRegex = /^string\(([^)]+)\):<dl>/;
            const closeTagRegex = /^<\/dl>/;
            const keyValueRegex = /^string\(([^)]+)\):(\w+)\(([^)]+)\);/;
            const semicolonRegex = /^;/;
            const openArrayTagRegex = /^string\(([^)]+)\):<ul>/;
            const closeArrayTagRegex = /^<\/ul>/;
            const arrayValueRegex = /^(string|number|boolean)\(([^)]+)\);/;

            while (dataString.length > 0) {
                currentKey = null;

                if (openTagRegex.test(dataString)) {
                    let openMatch = dataString.match(openTagRegex);
                    // Extract the key word
                    currentKey = openMatch[1];

                    // Pushes the key and the nestedObject into the stack
                    stack.push({ key: currentKey, object: nestedObject });
                    // Crate a new one to store the pair of key values
                    nestedObject = {};

                    // Removes the matched parted and continue parsing the remain ones
                    dataString = dataString.slice(openMatch[0].length).trim();
                } else if (closeTagRegex.test(dataString)) {
                    if (stack.length === 0) {
                        // In case it saw </dl> without seeing <dl>
                        throw new Error("Mismatched closing tag '</dl>' detected.");
                    }

                    // Remove the most recent entry object from the stack and assigned to last { key: "details", object: parentObject }
                    let last = stack.pop();
                    // Extract the object property
                    let parentObject = last.object;
                    // Insert the nestedObject in the parent object parentObject["details"] = nestedObject;
                    parentObject[last.key] = nestedObject;

                    // Sets nestedObject back to the parentObject, so the objects would continue ba added there not inside
                    nestedObject = parentObject;
                    dataString = dataString.slice(dataString.match(closeTagRegex)[0].length).trim();

                    if (semicolonRegex.test(dataString)) {
                        dataString = dataString.slice(dataString.match(semicolonRegex)[0].length).trim();
                    }
                } else if (openArrayTagRegex.test(dataString)) {
                    let openArrayMatch = dataString.match(openArrayTagRegex);
                    // Extract the key word
                    currentKey = openArrayMatch[1];

                    let array = [];
                    dataString = dataString.slice(openArrayMatch[0].length).trim();

                    while (!closeArrayTagRegex.test(dataString)) {
                        let arrayValueMatch = dataString.match(arrayValueRegex);
                        let valueType = arrayValueMatch[1];
                        let value = arrayValueMatch[2];

                        if (valueType === 'string') {
                            array.push(value);
                        } else if (valueType === 'number') {
                            array.push(parseFloat(value));
                        } else if (valueType === 'boolean') {
                            array.push(value === "true");
                        }

                        dataString = dataString.slice(arrayValueMatch[0].length).trim();
                    }

                    dataString = dataString.slice(dataString.match(closeArrayTagRegex)[0].length).trim();
                    // Assigns the array to nestedObject under the price key nestedObject["price"] = array so the nestedObject now contains it
                    nestedObject[currentKey] = array;

                    if (semicolonRegex.test(dataString)) {
                        dataString = dataString.slice(dataString.match(semicolonRegex)[0].length).trim();
                    }
                } else if (keyValueRegex.test(dataString)) {
                    // Find matches with the object and take it
                    let keyValueMatch = dataString.match(keyValueRegex);
                    let key = keyValueMatch[1];
                    let type = keyValueMatch[2];
                    let value = keyValueMatch[3];

                    if (type === 'string') {
                        // Initialize the object with key value pair
                        nestedObject[key] = value;
                    } else if (type === 'number') {
                        nestedObject[key] = parseFloat(value);
                    } else if (type === 'boolean') {
                        // Convert the string representation of the boolean ("true" or "false") into an actual JavaScript boolean (true or false)
                        nestedObject[key] = value === 'true';
                    }

                    dataString = dataString.slice(keyValueMatch[0].length).trim();
                } else {
                    break;
                }
            }

            if (stack.length !== 0) {
                throw new Error("Missing closing tag '</dl>' detected.");
            }

            return nestedObject;
        }

        // Separates serialized objects via  ||| creating an array of objects, where which is proceeded through parseNestedStructure
        return serializedData.split('|||').map(data => parseNestedStructure(data.trim()));
    }

    console.log(customDeserialize(customSerialize(complexData)));
    // console.log(customDeserialize(customSerialize(complexData1)));
    let deserializedData = customDeserialize(serializedData);
    console.log("The deserialized data is", deserializedData);

});

// Handle errors during the TLS connection
client.on('error', (error) => {
    console.error('There was a connection error: ', error);
});

