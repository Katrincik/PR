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
    const mainBookAuthor = document.querySelector('.autorProdus'); // Select the general description

    let products = [];

    bookName.forEach((name, index) => {
        let productName = name.textContent.trim();
        let price = bookPrice[index] ? bookPrice[index].textContent.trim() : 'N/A'

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