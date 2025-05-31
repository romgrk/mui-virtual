import fs from 'fs'
import child_process from 'child_process'

let files =
  child_process.execSync('fd -e js -u . dist').toString()
    .trim().split('\n').map(l=>'./'+l)

let nextId = 1;

files.forEach(file => {
  let code = fs.readFileSync(file).toString();
  code = code.replace(/function( )?\(/g, () => 'function anonymous_' + (nextId++) + '(');
  fs.writeFileSync(file, code)
})
