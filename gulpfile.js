/* tslint:disable:no-console */

const del = require('del');
const log = require('fancy-log');
const gulp = require('gulp');
const gulpTslint = require('gulp-tslint');
const gulpTs = require('gulp-typescript');
const gulpRunSequence = require('run-sequence');
const tslint = require('tslint');

const prettierPlugin = require('gulp-prettier-plugin');

function pipeErrHandler(err) {
  log(err);
  process.exit(1);
}

const PRETTIER_SRC = ['src/**/*.*', 'typings/**/*.*', 'test/**/*.*'];
const PRETTIER_IGNORE = [
  '!**/package.json',
  '!**/dist/**/*.*',
  '!**/node_modules/**/*.*',
  '!**/*.yaml',
  '!**/*.yml',
  '!**/*.sh',
  '!**/*.html',
  '!**/*.lock',
  '!**/*.ejs',
  '!**/*.*-',
  '!**/*.sql',
  '!**/*.txt',
];

const PRETTIER_CONFIG = {
  trailingComma: "all",
	useTabs: false,
	singleQuote: true,
	quoteProps: "consistent",
	tabWidth: 2,
	semi: true,
	printWidth: 200
};

// copy assets files from src to dist
gulp.task('copy-assets', () => {
  return gulp
    .src([
      // 'package.json',
      // 'package-lock.json',
      // 'yarn.lock',
      'src/**/*',
      '!src/**/*.ts',
      '!**/node_modules/**/*',
    ])
    .pipe(gulp.dest('dist/src/'))
});

gulp.task('clean-build', () => {
  return new Promise(resolve => {
    const result = del.sync(['dist/**/*', 'dist/**/.*']);
    resolve(result);
  });
});

// build process

gulp.task('prettier-noFix', () => {
  return gulp
    .src([...PRETTIER_SRC, ...PRETTIER_IGNORE])
    .pipe(prettierPlugin(PRETTIER_CONFIG, { filter: true, validate: true }))
    .on('error', pipeErrHandler);
});

gulp.task('tslint-noFix', () => {
  const lintProgram = tslint.Linter.createProgram('./tsconfig.json');
  /**
   * this pipe is exit code ready
   */
  return gulp
    .src(['src/**/*.ts', 'tests/**/*.ts', ...PRETTIER_IGNORE])
    .pipe(
      gulpTslint({
        program: lintProgram,
      }),
    )
    .pipe(gulpTslint.report());
});

gulp.task('compile-code', () => {
  const appCodeTsProject = gulpTs.createProject('tsconfig.json');
  return appCodeTsProject
    .src()
    .pipe(appCodeTsProject())
    .on('error', pipeErrHandler)
    .pipe(gulp.dest(appCodeTsProject.options.outDir));
});

gulp.task('lint-noFix', gulp.series(
  ['prettier-noFix', 'tslint-noFix'],
  done => done(),
));

gulp.task('build', gulp.series(
  'clean-build',
  ['prettier-noFix', 'tslint-noFix'],
  'compile-code',
  'copy-assets',
  done => done(),
));
