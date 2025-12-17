
const fs = require('fs');
const { exec } = require('child_process');

const items = [
    { name: 'Americano', keyword: 'coffee' },
    { name: 'Brownie', keyword: 'brownie' },
    { name: 'Brown Sugar Boba', keyword: 'boba' },
    { name: 'Cappuccino', keyword: 'cappuccino' },
    { name: 'Caramel Macchiato', keyword: 'macchiato' },
    { name: 'Classic Milk Tea', keyword: 'milktea' },
    { name: 'Coffee Milk Tea', keyword: 'coffee' },
    { name: 'Cookie', keyword: 'cookie' },
    { name: 'Creamy Shashvat', keyword: 'milkshake' },
    { name: 'Eggnog Shake', keyword: 'milkshake' },
    { name: 'Egg Puff', keyword: 'waffle' },
    { name: 'Espresso', keyword: 'espresso' },
    { name: 'Honey Green Tea', keyword: 'greentea' },
    { name: 'Hot Cocoa', keyword: 'cocoa' },
    { name: 'Lychee Fruit Tea', keyword: 'lychee' },
    { name: 'Lychee Smoothie', keyword: 'lychee' },
    { name: 'Mango Fruit Tea', keyword: 'mango' },
    { name: 'Mango Smoothie', keyword: 'mango' },
    { name: 'Matcha Latte', keyword: 'matcha' },
    { name: 'Mocha', keyword: 'mocha' },
    { name: 'Peppermint Mocha', keyword: 'mocha' },
    { name: 'Peppermint Shake', keyword: 'milkshake' },
    { name: 'Popcorn Chicken', keyword: 'friedchicken' },
    { name: 'Pumpkin Tea', keyword: 'tea' },
    { name: 'Strawberry Fruit Tea', keyword: 'strawberry' },
    { name: 'Strawberry Smoothie', keyword: 'strawberry' },
    { name: 'Taiyaki', keyword: 'waffle' },
    { name: 'Wintermelon Milk Tea', keyword: 'milktea' }
];

const downloadImage = (item) => {
    const filename = item.name.toLowerCase().replace(/ /g, '_') + '.jpg';
    const url = `https://loremflickr.com/600/600/${item.keyword}`;
    const command = `curl -L -o "public/assets/items/${filename}" "${url}"`;

    console.log(`Downloading ${item.name}...`);
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error downloading ${item.name}: ${error.message}`);
            return;
        }
    });
};

// Rate limit handling - don't spam requests all at once
let index = 0;
const interval = setInterval(() => {
    if (index >= items.length) {
        clearInterval(interval);
        return;
    }
    downloadImage(items[index]);
    index++;
}, 1000);
