#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';

async function createDirsRec (dirs = []) {
    let cwd = process.cwd();
    for (let dir of dirs) {
        console.log(`creating path ${path.join(cwd, '/', dir)}`);
        await fs.promises.mkdir(path.join(cwd, '/', dir), {recursive: true});
    }
}

async function createFiles (files, replacers = {}) {
    let cwd = process.cwd();
    for (let [filePath, content] of Object.entries(files)) {
        filePath = path.join(cwd, filePath);
        if (/{{(\w+?)}}/.test(content.toString())){
            content = content.toString().replace(/{{(\w+?)}}/g, (full, match) => replacers[match] || '');
        }
        await fs.promises.writeFile(filePath, content);
    }
}

async function create (dirStruct, fileStruct, params) {
    console.log(`Creating application ${params.appName}`);
    await createDirsRec(dirStruct);
    await createFiles(fileStruct, params);
}

async function traverseDir (entry) {
    let dirStruct = new Set();
    let fileStruct = {};
    let orgEntry = path.normalize(entry);

    async function rec (entry, parent = '') {
        let p = path.resolve(parent, entry);
        for (let item of await fs.promises.readdir(p)) {
            let file = path.resolve(p, item);
            let stat = await fs.promises.stat(file);
            if (stat && stat.isDirectory()) {
                dirStruct.add(file.replace(orgEntry, ''));
                await rec(file, p + path.sep);
            } else {
                fileStruct[file.replace(orgEntry, '')] = await fs.promises.readFile(file);
            }
        }
    }

    await rec(entry);
    return {dirStruct, fileStruct};
}

function getUserInput (question) {
    let rl = readline.createInterface({input: process.stdin, output: process.stdout});
    return new Promise(resolve => {
        rl.question(question, answer => {
            resolve(answer);
            rl.close();
        });
    });
}

async function main (node, file, action) {
    let params = {};
    switch (action) {
        case 'init':
            params.appName = await getUserInput('App name: ');
            params.appDescription = await getUserInput('App description (blank): ');
            params.author = await getUserInput('Author (blank): ');
            params.port = await getUserInput('Port (3000): ') || 3000;
            let [,,, ...moduleDir] = import.meta.url.split('/');
            moduleDir.pop();
            moduleDir = moduleDir.join('/');
            let {dirStruct, fileStruct} = await traverseDir(`${moduleDir}/template/basic`);
            create([...dirStruct], fileStruct, params);
            break;
        case 'run':
            import(`file:///${process.cwd()}/index.js`);
            break;
    }
}

main(...process.argv);