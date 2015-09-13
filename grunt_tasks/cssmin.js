module.exports = function (grunt, config) {
  grunt.config.merge ({
    cssmin: {
      preinline: {
        files: [{
          expand: true,
          cwd: config.srcDir + 'css', 
          src: ['*.css','!*.min.css'],
          dest: config.srcDir + 'css',
          ext: '.min.css'
        }]
      }
    }
  });
};

