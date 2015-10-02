var async = require("async");
var buildify = require('buildify');
var exec = require('child_process').exec;

var releaseDir = "./release/";

var srcDir = "./src/";
var RTreeModule = srcDir + "RTree";


var addGoogleAnalytics = function(content) {
  var nb = buildify();
  var ga = nb
    .load('./build/parts/googleAnalytics.frag')
    .content;
  return content.replace('</head>', ga + "</head>");
};

module.exports = function (grunt) {

  require("load-grunt-tasks")(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    jshint: {
      source: [
        srcDir,
        "demo"
      ]
    },
    clean: {
      release: [
        releaseDir
      ]
    },
    requirejs: {

      rtree2d: {
        options: {
          baseUrl: ".",
          mainConfigFile: "src/RTree" + ".js",
          name: "bower_components/almond/almond.js",
          include: "src/RTree",
          out: releaseDir + "js/RTree2d.js",
          optimize: "uglify2",
          options: {
            mangle: true
          },
          wrap: {
            start: "(function(root) {",
            end: "root.RTree2d = require('src/RTree');}(this));"
          }
        }
      }
    },

    compress: {
      main: {
        options: {
          archive: function () {
            return "release/rtree2d.zip"
          }
        },
        files: [
          {cwd: "release/js", src: ["**"], dest: "js", filter: 'isFile', expand: true},
          {cwd: "release/jsdoc", src: ["**"], dest: "jsdoc", filter: 'isFile', expand: true}
        ]
      }
    }
  });


  grunt.registerTask("amdify", function () {

    buildify()
      .load("release/js/RTree2d.js")
      .perform(function (contents) {

        contents =
          "(function(){var scope = this;" +
          contents +
          "define([],function(){ return scope.RTree2d; });}).call({});";

        return contents;

      })
      .save("release/js/RTree2d-amd.js");


  });

  grunt.registerTask("commonjsify", function () {

    buildify()
      .load("release/js/RTree2d.js")
      .perform(function (contents) {

        contents =
          "(function(){var scope = this;" +
          contents +
          "exports.RTree2d=scope.RTree2d;}).call({});";

        return contents;

      })
      .save("release/js/RTree2d-common.js");

  });

  grunt.registerTask('jsdoc', function() {

    var done = this.async();
    exec('"./node_modules/.bin/jsdoc" ./src/ ./README.md -d ./release/jsdoc -t "./build/jsdoctemplate"', function(err, stdout, sterr) {

      if (err || sterr) {
        console.error('jsdoc failed.', err, sterr);
        done();
      }


      var b = buildify();
      b
        .load('./release/jsdoc/index.html')
        .perform(addGoogleAnalytics)
        .save('./release/jsdoc/index.html');

      done();

    });

  });


  grunt.registerTask("release", ["jshint", "requirejs", "amdify", "commonjsify", "jsdoc","compress"]);

};
