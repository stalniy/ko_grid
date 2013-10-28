module.exports = function (grunt) {
  var template = ";(function(factory) {" +
    "if (typeof define === \"function\" && define.amd) {\n" +
    "    // AMD anonymous module\n" +
    "    define([\"knockout\", \"tkt\"], factory);\n" +
    "} else {\n" +
    "   // No module loader (plain <script> tag) - put directly in global namespace\n" +
    "   ko.tkGrid = factory(ko, ko.tkt);\n" +
    "}\n" +
  "})(function(ko, tkt, undefined) { {SOURCE_CODE};\n return tkGrid; });\n";

  grunt.registerMultiTask("build", "Wraps file with factory builder", function () {
    var options = this.options();
    var content = options.banner + template.replace('{SOURCE_CODE}', grunt.file.read(this.data.src)).replace(/;{2,}/g, ';');

    grunt.file.write(this.data.dest, content);
    grunt.file.delete(this.data.src);
    grunt.log.writeln("Created ditributive file: " + this.data.dest);
    grunt.log.writeln("Removed temporary file: " + this.data.src);
  })
};
