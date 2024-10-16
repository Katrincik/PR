const url = 'https://carturesti.md/carte/the-cruel-prince-32197?p=13';

// Use fetch function for network request
fetch(url).then(response => {
    // If successful HTTP status code (200-299)
    if (response.ok) {
        // Return HTML content as a string
        return response.text();
    } else {
        throw new Error('Network response was not ok: ' + response.status);
    }
}).then(htmlContent => {
    const parser = new DOMParser();
    const document = parser.parseFromString(htmlContent, 'text/html');

    // Select elements with matched CSS selectors
    const bookName = document.querySelectorAll('.md-title');
    const bookPrice = document.querySelectorAll('.suma');
    const mainBookAuthor = document.querySelector('.autorProdus');

    // Array in order to hold info about books
    let products = [];

    bookName.forEach((name, index) => {
        // Trim whitespaces
        let productName = name.textContent.trim();

        // Validate the price
        let noPrice = bookPrice[index] ? bookPrice[index].textContent.trim() : 'N/A';
        let price = parseInt(noPrice.replace(/\D/g, ''), 10);
        price = isNaN(price) ? 'N/A' : price;

        let product = {
            name: productName,
            price: price
        };
        products.push(product);
    });

    // Conversion MDL to EUR
    const EUR_TO_MDL = 19.34;
    const MDL_TO_EUR = 1 / EUR_TO_MDL;

    let convertBooks = products.map(product => {
        let convertedPrice = (product.price * MDL_TO_EUR).toFixed(2);

        return {
            name: product.name,
            price: convertedPrice
        };
    } )

    const minRange = 10;
    const maxRange = 13;

    // Filter products
    let filteredBooks = convertBooks.filter(product => {
        if (product.price >= minRange && product.price <= maxRange) {
            return product.price;
        }
    });

    // Sum up the prices of the products
    let totalPrice = filteredBooks.reduce((sum, product) => {
        return sum + parseFloat(product.price);
    },0);

    let extractedData = {
        description: mainBookAuthor ? mainBookAuthor.textContent.trim() : 'No general description available'
    };

    let finalData = {
        filteredBooks : filteredBooks,
        sum : totalPrice,
        timestamp: new Date().toISOString()
    };

    console.log('Extracted data: ', convertBooks, extractedData, finalData);

}).catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
});