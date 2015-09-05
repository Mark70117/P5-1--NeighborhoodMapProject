module.exports = function (grunt, config) {
  grunt.config.merge ({
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: config.srcDir,
            src: '*.html',
            dest: config.dstDir,
            flatten: false,
            filter: 'isFile'
          }
        ]
      }
    }
  });
};
