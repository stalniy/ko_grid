(function (jasmine) {
  jasmine.Matchers.prototype.toBeObservable = function () {
    var actual = this.actual;

    this.actual = "object";
    return ko.isObservable(actual);
  };

  jasmine.Matchers.prototype.toBeInstanceOf = function (object) {
    return this.actual instanceof object;
  };

  var sharedExamples = {};
  window.sharedExamplesFor = function (name, executor) {
    sharedExamples[name] = executor;
  };

  window.itBehavesLike = function (sharedExampleName) {
    jasmine.getEnv().describe("behaves like " + sharedExampleName, sharedExamples[sharedExampleName]);
  };
})(jasmine);
