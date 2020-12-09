#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

function printHelp () {
    console.log(`
|    command    |    arguments    |    meaning                |
|---------------|-----------------|---------------------------|    
| -h, help      | none            | this help
| -c, create    | appname         | create a simple server app
| -da, demoapp  | none            | create a demo app with basic presentation of the framework abilities
|---------------|-----------------|---------------------------|
    `);
}

async function createDirsRec (dirs = []) {
    let cwd = process.cwd();
    for (let dir of dirs) {
        console.log(`creating path ${path.join(cwd, '/', dir)}`);
        await fs.promises.mkdir(path.join(cwd, '/', dir), {recursive: true});
    }
}

async function createFiles (files, replacers = {}) {
    let cwd = process.cwd();
    for (let [filePath, {content}] of Object.entries(files)) {
        filePath = path.join(cwd, '/', filePath);
        let str = Buffer.from(content, 'base64').toString();
        str = str.replace(/{{(\w+?)}}/g, (full, match) => replacers[match] || '');
        await fs.promises.writeFile(filePath, str);
    }
}

async function create (params) {
    console.log(`Creating application ${params.appName}`);
    let dirStruct = [
        'client',
        'server/endpoints'
    ];

    let fileStruct = {
        'server/endpoints/IndexEndpoint.js': {
            content: 'CmV4cG9ydCBkZWZhdWx0IGNsYXNzIEluZGV4RW5kcG9pbnQgewogICAgc3RhdGljIFsnR0VUIC8nXSAocmVxLCByZXMpIHsKICAgICAgICByZXMuaHRtbChgCjwhRE9DVFlQRSBodG1sPgo8aHRtbD4KPGhlYWQ+CiAgICA8dGl0bGU+e3thcHBOYW1lfX08L3RpdGxlPiAgICAKPC9oZWFkPgogICAgPGJvZHk+V2VsY29tZSB0byB7e2FwcE5hbWV9fTwvYm9keT4gICAgICAgIAo8L2h0bWw+CiAgICAgICAgYCk7CiAgICB9Cn0KICAgICAgICAgICAg'
        },
        'index.js': {
            content: 'aW1wb3J0IHtBcHAsIFJvdXRlciwgU2VydmVyfSBmcm9tICd3dWR1LXNlcnZlcic7CmltcG9ydCBJbmRleEVuZHBvaW50IGZyb20gIi4vc2VydmVyL2VuZHBvaW50cy9JbmRleEVuZHBvaW50LmpzIjsKCmxldCBhcHAgPSBuZXcgQXBwKCd7e2FwcE5hbWV9fScpOwoKYXBwLnJvdXRlciA9IFJvdXRlci5oYW5kbGVyOwoKUm91dGVyLmFkZEVuZHBvaW50cyhJbmRleEVuZHBvaW50KTsKCmFwcC5ydW5TZXJ2ZXIoewogICAgcHJvdG9jb2w6IFNlcnZlci5IVFRQLAogICAgcG9ydDoge3twb3J0fX0KfSk7'
        },
        'package.json': {
            content: 'ewogICJuYW1lIjogInt7YXBwTmFtZX19IiwKICAidmVyc2lvbiI6ICIxLjAuMCIsCiAgImRlc2NyaXB0aW9uIjogInt7YXBwRGVzY3JpcHRpb259fSIsCiAgIm1haW4iOiAiaW5kZXguanMiLAogICJ0eXBlIjogIm1vZHVsZSIsCiAgInNjcmlwdHMiOiB7CiAgICAic3RhcnQiOiAibm9kZSBpbmRleC5qcyIKICB9LAogICJhdXRob3IiOiAie3thdXRob3J9fSIsCiAgImxpY2Vuc2UiOiAiSVNDIgp9'
        }
    }

    await createDirsRec (dirStruct);
    await createFiles(fileStruct, params);
}

function createDemo () {}

function getUserInput (question) {
    let rl = readline.createInterface({input: process.stdin, output: process.stdout});
    return new Promise((resolve, reject) => {
        rl.question(question, answer => {
            resolve(answer);
            rl.close();
        });
    });
}

async function main (node, file, action) {
    let params;
    switch (action) {
        case 'init':
            let appName = await getUserInput('App name: ');
            let appDescription = await getUserInput('App description (blank): ');
            let author = await getUserInput('Author (blank): ');
            let port = await getUserInput('Port (3000): ') || 3000;
            create({appName, appDescription, author, port});
            break;
        case 'run':
            import(`file:///${process.cwd()}/index.js`);
            break;
        case 'help':
        case '-h':
        default:
            printHelp();
    }
}

main(...process.argv);