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

    let products = [];

    bookName.forEach((name, index) => {
        let product = {
            name: name.textContent.trim(),
            price: bookPrice[index] ? bookPrice[index].textContent.trim() : 'N/A'
        };
        products.push(product);
    });

    console.log('Extracted data: ', products);

}).catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
});
