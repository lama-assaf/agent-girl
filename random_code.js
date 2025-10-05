// Random JavaScript Code Generator
const fs = require('fs');
const path = require('path');

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function processData(items) {
    return items.map(item => item * 2).filter(num => num > 10);
}

const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
const randomColor = colors[generateRandomNumber(0, colors.length - 1)];

console.log(`Selected color: ${randomColor}`);

const numbers = [3, 7, 12, 5, 9, 15];
const processed = processData(numbers);
console.log('Processed numbers:', processed);
