const { chromium } = require('playwright');

async function scrapeBooks() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('https://carturesti.md/autor/osamu_dazai', { waitUntil: 'networkidle' });

    await page.waitForSelector('.md-title');

    const books = await page.evaluate(() => {
        const bookName = document.querySelectorAll('.md-title');
        const bookPrice = document.querySelectorAll('.suma');

        const bookList = [];
        bookName.forEach((element, index) => {
            bookList.push({
                name: element.textContent.trim(),
                price: bookPrice[index] ? bookPrice[index].textContent.trim() : 'N/A'
            });
        });
        return bookList;
    });

    console.log('Extracted books:', books);

    await browser.close();
}

scrapeBooks().catch(console.error);
