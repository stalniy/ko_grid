module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    bower: {
      install: {
        options: {
          install: true,
          layout: 'byType',
          copy: false
        }
      }
    },

    jasmine: {
      options: {
        specs: 'spec/models/*.js',
        helpers: 'spec/spec_helper.js',
        vendor: [
          'bower_components/jquery/jquery.js',
          'bower_components/knockout.js/knockout.js',
          'bower_components/tkt/build/tkt.min.js',
        ]
      },

      source: {
        src: [ 'src/utils.js', 'src/grid/state.js', 'src/grid/adapter/*.js' ]
      },

      assembled: {
        src: 'build/<%= pkg.name %>-<%= pkg.version %>.min.js'
      }
    },

    concat: {
      options: {
        separator: ';'
      },

      source: {
        src:  [  'src/utils.js', 'src/grid/state.js', 'src/grid/adapter/*.js'  ],
        dest: 'build/<%= pkg.name %>-raw.js'
      }
    },

    build: {
      all: {
        src: 'build/<%= pkg.name %>-raw.js',
        dest: 'build/<%= pkg.name %>-<%= pkg.version %>.js',
        options: {
          banner:
            "/*! The knockout Grid v<%= pkg.version %> | http://github/stalniy/ko_grid\n" +
            "(c) 20013 Sergiy Stotskiy <sergiy.stotskiy@freaksidea.com> \n" +
            "MIT license */\n"
        }
      }
    },

    uglify: {
      options: {
        compress: true,
        preserveComments: 'some',
        report: 'min'
      },
      build: {
        files: {
          'build/<%= pkg.name %>-<%= pkg.version %>.min.js': [ 'build/<%= pkg.name %>-<%= pkg.version %>.js' ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.loadTasks("build/tasks");

  grunt.registerTask('default', ['bower', 'jasmine:source', 'concat', 'build', 'uglify', 'jasmine:assembled']);
  grunt.registerTask('test', ['bower', 'jasmine:source']);
};
