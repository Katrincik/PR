// Use library to automate the process of scraping
const { chromium } = require('playwright');

async function scrapeBooks() {
    // Launch browser instance in the background without UI
    const browser = await chromium.launch({ headless: true });
    // Create new browser page for scraping content
    const page = await browser.newPage();

    // Http request, and fully load all content
    await page.goto('https://carturesti.md/autor/osamu_dazai', { waitUntil: 'networkidle' });

    await page.waitForSelector('.md-title');

    // Allows to run js in the context of webpage similar as using Developer Tool console
    const books = await page.evaluate(() => {
        const bookName = document.querySelectorAll('.md-title');
        const bookPrice = document.querySelectorAll('.suma');

        const bookList = [];
        bookName.forEach((element, index) => {
            let productName = element.textContent.trim();
            let noPrice = bookPrice[index] ? bookPrice[index].textContent.trim() : 'N/A';

            // Validation to ensure the price is numeric
            let price = parseFloat(noPrice.replace(',', '.'));
            price = isNaN(price) ? 'N/A' : price;

            bookList.push({
                name: productName,
                price: price
            });
        });
        return bookList;
    });

    // Conversion MDL to EUR
    const EUR_TO_MDL = 19.34;
    const MDL_TO_EUR = 1 / EUR_TO_MDL;

    // Using map to convert prices from MDL to EUR
    let convertedBooks = books.map(product => {
        let convertedPrice = (product.price !== 'N/A') ? (product.price * MDL_TO_EUR).toFixed(2) : 'N/A';
        return {
            name: product.name,
            price: convertedPrice
        };
    });

    // Filter books based on a price range in EUR
    const minRange = 5;
    const maxRange = 10;

    let filteredBooks = convertedBooks.filter(product => {
        return product.price !== 'N/A' && product.price >= minRange && product.price <= maxRange;
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

    console.log('Extracted books:', books);
    // console.log('Converted books:', convertedBooks);
    // console.log('Filtered books:', filteredBooks);
    // console.log('Total price:', totalPrice);
    console.log('Final data:', finalData);

    await browser.close();
}

scrapeBooks().catch(console.error);