import path from 'path';
import fse from 'fs-extra';
import chalk from 'chalk';
import inquirer from 'inquirer';
import Toml from '@ltd/j-toml';
import log from '@zppack/log';
import zpGlob from '@zppack/glob';
import { filterTrim, validateRequired } from './inquirer-util';

const CONFIG_NAME = '.zp-vars.toml';

const getConfig = (configFile) => {
  log.d('Zp-vars: exist `.zp-vars.toml` file.');

  const content = fse.readFileSync(configFile, 'utf8');
  log.d('Zp-vars: content: \n', chalk.gray(content));
  if (!content) {
    return null;
  }

  const config = Toml.parse(content, 1.0, '\n', false);
  log.d('Zp-vars: original config: \n', chalk.gray.bold(JSON.stringify(config)));
  return config;
};

const formatConfig = (config) => {
  config.zpvars = config.zpvars.map((elem) => {
    if (!elem) {
      return null;
    } else if (typeof elem === 'string') {
      return { name: elem, message: `Input ${elem}: ` };
    } else if (typeof elem === 'object') {
      if (!elem.name) {
        return null;
      }
      if (!elem.message) {
        return { ...elem, message: `Input ${elem.name}: ` };
      }
      return { ...elem };
    } else {
      return null;
    }
  }).filter(elem => !!elem);
  log.d('Zp-vars: formatted config: \n', chalk.gray.bold(JSON.stringify(config)));

  return config;
};

const getQuestions = (configVars, options = {}) => {
  const defaultQuestion = {
    type: 'input',
    name: '',
    prefix: '💫',
    message: '',
    default: '',
    filter: filterTrim,
    validate: () => true,
  };

  log.i('Zp-vars: generate `zp-vars` questions');

  return configVars
    .filter((item) => !options[item.name])
    .map((item) => {
      const { name } = item;
      const question = {
        ...defaultQuestion,
        ...item,
        validate: validateRequired(chalk.red(`\`${name}\` is required.`))
      };
      return question;
    });
};

const doReplacement = ({ tplPath, configPath, options }) => {
  log.i('Zp-vars: start to replace template variables...');

  const files = zpGlob.union(['**/*', `!${configPath}/**`, `!${CONFIG_NAME}`, '!.git/**', '!node_modules/**'], { dot: true, cwd: path.resolve(tplPath), nodir: true, realpath: true });
  log.d('Zp-vars: files to do replacement: \n', chalk.gray(files));

  const templateRegEx = /\{\{\s*(.*?)\s*\}\}/g;

  const processedFiles = [];

  files.forEach((file) => {
    const sourceContent = fse.readFileSync(file, 'utf8');
    const targetContent = sourceContent.replace(templateRegEx, (_, varKey) => options[varKey] || '');
    if (targetContent !== sourceContent) {
      processedFiles.push(file);
    }
    fse.writeFileSync(file, targetContent);
  });

  log.d(`Zp-vars: ${processedFiles.length} files were processed: \n`, chalk.gray(processedFiles));
  log.i(`Zp-vars: ${processedFiles.length} files were processed`);
};

/**
 * @param {*} ctx
 *  tplBasePath: "template-project-std"
 *  tplPath: "template-project-std/template-project"
 *  destPath: ".zp-app"
 *  configPath: ".zp"
 *  options: {}
 * @param {*} next
 */
const middleware = async (ctx, next) => {
  log.i('Zp-vars: start `zp-vars` middleware');
  const { tplPath, destPath, configPath, options } = ctx;
  const configFilePath = path.join(tplPath, configPath);
  const configFile = path.join(configFilePath, CONFIG_NAME);

  log.d('Zp-vars: tplPath = ', chalk.underline(tplPath));
  log.d('Zp-vars: destPath = ', chalk.underline(destPath));
  log.d('Zp-vars: configFilePath = ', chalk.underline(configFile));
  log.d('Zp-vars: options : \n', chalk.gray(JSON.stringify(options)));

  if (!fse.existsSync(configFile)) {
    log.w('Zp-vars: connot find config file `.zp-vars.toml`, `zp-vars` middleware ignored.');
    return;
  }

  const originalConfig = getConfig(configFile);

  if (!originalConfig || !originalConfig.zpvars || originalConfig.zpvars.length === 0) {
    log.w('Zp-vars: invalid `.zp-vars.toml` config, `zp-vars` middleware ignored.');
    return;
  }

  const config = formatConfig(originalConfig);
  const configVars = config.zpvars;
  const questions = getQuestions(configVars, options);
  log.d('Zp-vars: questions: \n', chalk.gray(JSON.stringify(questions)));

  const answers = await inquirer.prompt(questions);
  log.d('Zp-vars: answers: \n', chalk.gray(JSON.stringify(answers)));

  ctx.options = { ...options, ...answers };
  log.d('Zp-vars: context options: \n', chalk.gray(JSON.stringify(ctx.options)));

  await next();

  doReplacement(ctx);
  log.i('Zp-vars: `zp-vars` middleware process completed.');
};

export default middleware;
