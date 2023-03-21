import * as fs from 'node:fs';
import * as path from 'path';
import {fileURLToPath} from 'url';

const resolve = (...p) => path.resolve(path.dirname(fileURLToPath(import.meta.url)), ...p);

const root = resolve('./presentations'), DIST_HTML = 'index.html';
const identity = x => x;

fs.cpSync(resolve('node_modules/reveal.js/dist'), 'assets/js/reveal.js/dist', {recursive : true});
fs.cpSync(resolve('node_modules/reveal.js/plugin'), 'assets/js/reveal.js/plugin', {recursive : true});

const run = (...paths) => {
    paths = (paths = paths[0] ? paths : fs.readdirSync(root)).map(ppt => {
        // try to use index.html
        const dir = resolve(root, ppt);
        if (!fs.statSync(dir).isDirectory()) return;
        const htmlPath = resolve(dir, 'layout.html');
        fs.writeFileSync(
            resolve(dir, DIST_HTML),
            `<!doctype html>
<link rel="alternate icon" class="js-site-favicon" type="image/png" href="https://github.githubassets.com/favicons/favicon.png">
<link rel="icon" class="js-site-favicon" type="image/svg+xml" href="https://github.githubassets.com/favicons/favicon.svg">
<link rel="stylesheet" href="../../assets/js/reveal.js/dist/reveal.css">
<link rel="stylesheet" href="../../assets/css/highlight.css">
<link rel="stylesheet" href="../../mixin.css">

${((fs.existsSync(htmlPath) && fs.readFileSync(htmlPath, 'utf8')) || `<body></body>`).replace('</body>', `
  <div class="reveal">
    <div class="slides">
      ${fs.readdirSync(dir).map(f => /\.md$/.test(f) && fs.readFileSync(resolve(dir, f), 'utf8')).filter(identity).map(md => `
      <section data-markdown>
        <textarea data-template>
${md}
        </textarea>
      </section>\n`).join('')}
    </div>
  </div>
  </body>
`)}

<script src="../../assets/js/reveal.js/dist/reveal.js"></script>
<script src="../../assets/js/reveal.js/plugin/markdown/markdown.js"></script>
<script src="../../assets/js/reveal.js/plugin/highlight/highlight.js"></script>
<script>
    var theme = document.body.getAttribute('data-theme');
    if (theme) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '../../assets/js/reveal.js/dist/theme/' + theme + '.css';
        link.onload = init;
        document.head.appendChild(link);
    } else {
        init();
    }

    function init() {
        var opts = options || {};
        opts.plugins = [RevealMarkdown, RevealHighlight];
        Reveal.initialize(opts);
    }
</script>`,
            'utf8'
        );

        return ppt;
    }).filter(identity);

    console.log(`Build ${paths} Done.`)
};

run();
process.argv[2] === '--watch' && fs.watch(
    root,
    {recursive : true},
    (eventType, fileName) => {
        !fileName.includes(DIST_HTML)
        && /\.(md|html)$/.test(fileName)
        && fs.existsSync(resolve(root, fileName))
        && run(path.dirname(fileName));
    }
);
