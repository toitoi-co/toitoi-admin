var gulp = require("gulp");
var chalk = require("chalk");
var psTree = require("ps-tree");

var livereload = require("gulp-livereload");
var rename = require("gulp-rename");
var namedLog = require("gulp-named-log");
var nodemon = require("gulp-nodemon");
var webpackStream = require("webpack-stream");
var webpack = require("webpack");

/* The following resolves JacksonGariety/gulp-nodemon#33 */
process.once("SIGINT", function() {
	process.exit(0);
});

/* The following resolves remy/nodemon#34 */
function cleanupChildren(cb) {
	psTree(process.pid, function(err, children) {
		children.filter(function(child) {
			return (child.PPID === process.pid.toString() && child.COMMAND === "node");
		}).forEach(function(child) {
			killChildren(children, child.PID);
		});

		cb();
	});
}

function killChildren(children, pid) {
	children.forEach(function(child) {
		if (child.PPID === pid) {
			killChildren(children, child.PID);
		}
	});

	console.error("Killing child Node.js process:", pid);
	process.kill(parseInt(pid));
}

process.once("uncaughtException", function(err) {
	console.log(err.stack || err);

	cleanupChildren(function() {
		process.exit(1);
	});
})

function patchLivereloadLogger(livereload, logger) {
	var _oldChanged = livereload.changed.bind(livereload);
	livereload.changed = function(filePath) {
		logger.log(chalk.magenta(filePath) + " reloaded.");
		_oldChanged.apply(null, arguments);
	}
}

var livereloadLogger = namedLog("livereload", {
	basePath: __dirname
});

patchLivereloadLogger(livereload, livereloadLogger);

function webpackTask(options) {
	return function(){
		return gulp.src("./development/index.js")
			//.pipe(plumber())
			.pipe(webpackStream({
				watch: options.watch,
				module: {
					preLoaders: [{
						test: /\.tag$/,
						loader: "riotjs-loader",
						exclude: /node_modules/,
						query: {
							type: "babel",
							template: "jade",
							parserOptions: {
								presets: ["es2015-riot"]
							}
						}
					}],
					loaders: [{
						test: /\.js/,
						loader: "babel-loader",
						query: {
							presets: ["es2015"]
						}
					}, {
						test: /\.json$/,
						loader: "json-loader"
					}]
				},
				plugins: [ new webpack.ProvidePlugin({riot: "riot"}) ],
				resolve: {
					extensions: [
						"",
						".tag",
						".web.js", ".js",
						".web.json", ".json"
					]
				},
				debug: true
			}))
			.pipe(rename("bundle.js"))
			.pipe(namedLog("webpack").stream())
			.pipe(livereload())
			.pipe(gulp.dest("./development/"));
	}
}

gulp.task('webpack-watch', ["livereload"], webpackTask({watch: true}));
gulp.task('webpack', webpackTask({watch: false}));

gulp.task("livereload", function() {
	livereload.listen({
		quiet: true
	});
});

gulp.task("nodemon", function() {
	var proc = nodemon({
		script: "app.js",
		execMap: {
			"js": "babel-node"
		},
		env: {
			"BABEL_ENV": "app"
		},
		ignore: [
			"gulpfile.js",
			"development",
			"node_modules"
		]
	}).on("restart", function() {
		livereload.changed("*");
	});
});

gulp.task("watch", ["webpack-watch", "nodemon"])
gulp.task("build", ["webpack"]);
gulp.task('default', ["watch"]);
