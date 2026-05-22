
const fs = require('fs');
const path = require('path');
function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.jsx') || p.endsWith('.js')) {
            let content = fs.readFileSync(p, 'utf8');
            if (content.includes('\'http://localhost:3005')) {
                content = content.replace(/'http:\/\/localhost:3005(.*?)'/g, '\http://\:3005\\');
                fs.writeFileSync(p, content);
                console.log('Fixed:', p);
            }
        }
    });
}
walk('src');

