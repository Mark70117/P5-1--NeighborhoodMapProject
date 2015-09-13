module.exports = function (grunt, config) {
  grunt.config.merge ({
    htmlmin: {
      dist: {
        options: {
            removeComments: true, 
            collapseWhitespace: true
          },
        files: {
          'index.html': config.srcDir + 'index.inline.html'
        }
      }
    }
  });
};

