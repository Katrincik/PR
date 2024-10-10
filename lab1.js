const url = 'https://carturesti.md/carte/the-cruel-prince-32197?p=13';

fetch(url).then(response => {
        // Check OK for status code 200-299
        if (response.ok) {
            return response.text();
        } else {
            throw new Error('Network response was not ok: ' + response.status);
        }
    }).then(htmlContent => {
        console.log('HTML content:', htmlContent);
    }).catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
    });
