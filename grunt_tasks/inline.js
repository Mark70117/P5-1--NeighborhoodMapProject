module.exports = function (grunt, config) {
  grunt.config.merge ({
    inline: {
      dist: {
        src: config.srcDir + 'index.html',
        dest: config.srcDir + 'index.inline.html',
      }
    }
  });
};

