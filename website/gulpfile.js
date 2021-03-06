"use strict";

var gulp = require('gulp');
var concat = require('gulp-concat');
var ngannotate = require("browserify-ngannotate");
var notify = require('gulp-notify');
var sass = require('gulp-sass');
var connect = require('gulp-connect');
var sourcemaps = require("gulp-sourcemaps");
var watch = require('gulp-watch');
var babelify = require("babelify");
var browserify = require("browserify");
var exorcist = require("exorcist");
var source = require('vinyl-source-stream');
var uglifyify = require("uglifyify");
var watchify = require('watchify');
var assign = require('lodash.assign');
var gutil = require('gulp-util');
var moment = require('moment');

require("gulp-help")(gulp, {
    description: 'Help listing.'
});

var src_paths = {
    styles: "./styles/**/*.scss",
    scripts: "./scripts/**/*.js",
    htmls: "./htmls/**/*.html",
    images: "./images/**/*",
    resources: "./resources/**/*",
    style_entry: "./styles/entry.scss",
    script_entry: "./scripts/entry.js",
    fonts: ["node_modules/bootstrap-sass/assets/fonts/**/*", "./styles/fonts/*"]
}

var dest_paths = {
    style: "./dest/styles/",
    script: "./dest/scripts/",
    htmls: "./dest/",
    images: "./dest/images/",
    resources: "./dest/resources/",
    bundle: "bundle.js",
    bundle_map: "./dest/scripts/bundle.js.map",
    fonts: "./dest/fonts"
}

var task = {
    build_scripts: "scripts",
    build_styles: "styles",
    watch_scripts: "watch-scripts",
    watch_styles: "watch-styles",
    watch_htmls: "watch-htmls",
    htmls: "htmls",
    fonts: "fonts",
    images: "images",
    resources: "resources",
    live_reload: "live-reload",
    build: "build",
    develop: "develop",
    serve: "serve"
}

function init_browserify(){
    var opts = assign( {}, watchify.args, {
        entries: [src_paths.script_entry],
        debug: true
    });

    var br = browserify(opts)
    .transform(babelify, {
        presets: ["es2015"],
    })
    .transform(ngannotate)
    .transform(uglifyify, {global: true});

    return br;
}

function bundle_js(bundler){
    return bundler.bundle()
        .on('error', notify.onError("Error: <%= error.message %>"))
        .pipe(exorcist(dest_paths.bundle_map))
        .pipe(source("bundle.js"))
        .pipe(gulp.dest(dest_paths.script))
        .pipe(notify('Compiled scripts (' + moment().format('MMM Do h:mm:ss A') + ')'))
        .pipe(connect.reload());
}


gulp.task(task.serve, 'A simple web server.', ()=>{
    connect.server({
        root: "./dest/",
        port: 3000,
        livereload: true
    });
});

gulp.task(task.watch_scripts, "build and watch script files", function(){
    var br = init_browserify();
    var w = watchify(br)
    .on('update', function(){
        bundle_js(w);
    })
    .on('log', gutil.log);

    bundle_js(w);
});

gulp.task(task.build_scripts, "build scripts", function(){
    var bundler = init_browserify();
    bundle_js(bundler);
});

gulp.task(task.watch_styles, "build and watch styles", function(){
    gulp.start(task.build_styles);
    return gulp.watch(src_paths.styles, [task.build_styles]);
});

gulp.task(task.build_styles, "build styles and copy fonts", [task.fonts, task.images], function() {
    gulp.src([src_paths.style_entry])
    .pipe(concat('bundle'))
    .pipe(sourcemaps.init())
    .pipe(sass({
        errLogToConsole: true,
        sourcemaps: true,
        outputStyle: 'compressed',
        includePaths: [
            "./node_modules/bootstrap-sass/assets/stylesheets",
            "./node_modules/datatables.net-bs/css"
        ]
    }))
    .pipe(sourcemaps.write("./"))
    .on('error', notify.onError("Error: <%= error.message %>"))
    .pipe(gulp.dest(dest_paths.style))
    .pipe(notify('Compiled sass (' + moment().format('MMM Do h:mm:ss A') + ')'))
    .pipe(connect.reload());
});

gulp.task(task.fonts, "copy fonts to dest dir", function(){
    return gulp.src(src_paths.fonts)
        .pipe(gulp.dest(dest_paths.fonts));
});

gulp.task(task.htmls, "copy htmls to dest dir", function(){
    return gulp.src(src_paths.htmls)
        .pipe(gulp.dest(dest_paths.htmls))
        .pipe(connect.reload());
});

gulp.task(task.resources, "copy resource files to dest dir", function(){
    return gulp.src(src_paths.resources)
        .pipe(gulp.dest(dest_paths.resources));
});

gulp.task(task.images, "copy images to dest dir", function(){
    return gulp.src(src_paths.images)
        .pipe(gulp.dest(dest_paths.images));
});

gulp.task(task.watch_htmls, "watch htmls and copy them to dest dir", function(){
    gulp.start(task.htmls);
    return gulp.watch(src_paths.htmls, [task.htmls]);
});


gulp.task(task.develop, [task.watch_htmls, task.watch_scripts, task.watch_styles, task.resources, task.serve]);
gulp.task(task.build, [task.htmls, task.images, task.resources, task.build_scripts, task.build_styles]);

