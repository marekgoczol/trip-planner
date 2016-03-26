var browserify = require('browserify');
var html = require('html-browserify');
var fs = require('fs');

module.exports = function(g) {
    g.initConfig({
        pkg: g.file.readJSON('package.json'),

        jshint: {
            app: {
                options: { jshintrc: true },
                src: [
                    'Gruntfile.js',
                    'index.js',
                    '*/*.js'
                ]
            }
        },

        connect: {
            serve: {
                options: {
                    port: 8000,
                    hostname: 'localhost'
                }
            }
        },

        watch: {
            rebuild: {
                tasks: ['build'],
                options: { livereload: true },
                files: [
                    'index.html',
                    '*/*.html',
                    'index.js',
                    '*/*.js'
                ]
            }
        },

    });

    g.loadNpmTasks('grunt-contrib-jshint');
    g.loadNpmTasks('grunt-contrib-connect');
    g.loadNpmTasks('grunt-contrib-watch');
    g.loadNpmTasks('grunt-newer');

    g.registerTask('build', [
        'newer:jshint:app',
        'browserify'
    ]);

    g.registerTask('browserify', function() {
        var b = browserify();
        var done = this.async();

        b.add('index.js');
        b.transform(html);
        b.bundle(function(err, buf) {
            if (err) { throw err; }
            fs.writeFileSync('app.js', buf);
            done();
        });
    });

    g.registerTask('default', [
        'build',
        'connect:serve',
        'watch:rebuild'
    ]);
};
