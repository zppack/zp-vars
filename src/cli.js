#!/usr/bin/env node

import program from 'commander';
import path from 'path';
import chalk from 'chalk';
import log from '@zppack/log';
import middleware from '.';
import pkg from '../package.json';

program.version(pkg.version, '-v, --version');

program
  .arguments('[tplPath]', 'Path to process customize vars')
  .action((tplPath) => {
    log.d('Command zp-vars: template path = ', chalk.underline(tplPath));
    start(tplPath);
  });

program.parse(process.argv);

function start(tplPath) {
  const date = new Date();
  const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}`;

  if (!tplPath) {
    tplPath = path.resolve('.');
  } else {
    tplPath = path.resolve(__dirname, tplPath);
  }

  log.i('Command zp-vars: process start, template path = ', chalk.underline(tplPath));

  middleware({ tplPath, configDir: '.zp', options: { date: dateStr } }, async () => {
    log.i('Command zp-vars: process next called.');
  }).then(() => {
    log.i('Command zp-vars: process completed.');
  });
}
