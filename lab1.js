const url = 'https://carturesti.md/carte/the-cruel-prince-32197?p=13';

fetch(url).then(response => {
    if (response.ok) {
        return response.text();
    } else {
        throw new Error('Network response was not ok: ' + response.status);
    }
}).then(htmlContent => {
    const parser = new DOMParser();
    const document = parser.parseFromString(htmlContent, 'text/html');

    const bookName = document.querySelectorAll('.md-title');
    const bookPrice = document.querySelectorAll('.suma');
    const mainBookAuthor = document.querySelector('.autorProdus');

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

    let extractedData = {
        products: products,
        description: mainBookAuthor ? mainBookAuthor.textContent.trim() : 'No general description available'
    };

    console.log('Extracted data: ', extractedData);

}).catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
});