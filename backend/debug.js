const path = require('path');
console.log('__dirname:', __dirname);
console.log('static path:', path.join(__dirname, '../frontend'));
const fs = require('fs');
console.log('Exists:', fs.existsSync(path.join(__dirname, '../frontend')));
