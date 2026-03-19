const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');
if (!css.includes('overflow-x: hidden;')) {
  css = css.replace('body {', 'body {\n  overflow-x: hidden;\n  overflow-y: scroll;');
  fs.writeFileSync('src/index.css', css);
}

let nav = fs.readFileSync('src/components/BottomNavBar.css', 'utf-8');
if (!nav.includes('box-sizing: border-box;')) {
  nav = nav.replace('.nav-container {', '.nav-container {\n  box-sizing: border-box;');
  fs.writeFileSync('src/components/BottomNavBar.css', nav);
}
