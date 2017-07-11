#!/usr/bin/env node
console.log('Running post install.js');
try {
    const root = __dirname.substr(0, __dirname.indexOf('node_modules/'));
    if (root === undefined || root.length === 0) { return; }
    const packageJSON = require(`${root}package.json`);
    const path = require('path');
    if (packageJSON.dependencies['react-native']) {
        const fs = require('fs');
        const index = path.join(__dirname, '..','lib', 'index.js');
        const RNIndex = path.join(__dirname, 'index.rn.js');
        const indexContent = fs.readFileSync(RNIndex, { encoding: 'utf8' })
        if (indexContent) {
            fs.unlinkSync(index);
            fs.writeFileSync(index, indexContent, 'utf8')
        } else {
            console.error('could not find index.rn.js');
        }
    }
}
catch (e) {
    console.error('Error running postinstall script', e);
}
