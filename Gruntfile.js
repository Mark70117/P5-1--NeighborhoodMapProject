module.exports = function (grunt) {
  var config = grunt.file.readYAML('Gruntconfig.yml');

  require('load-grunt-tasks')(grunt);

  require('./grunt_tasks/copy.js')(grunt, config);

  grunt.registerTask('default', [
    'copy',  
  ]);
};
