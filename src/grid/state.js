var GridState = (function () {
  function isFirstPage() {
    return this.page() === 1;
  }

  function isLastPage() {
    return this.page() === this.lastPage();
  }

  function isCurrentPage(page) {
    return this() === Number(page);
  }

  function isValidPage(page) {
    page = Number(page);

    return !!(page && page >= 1 && page <= this.lastPage());
  }


  return Object.extend({
    throttleTimeout: 100,

    initialize: function (defaults) {
      this._setUp();
      if (defaults) {
        this.useValues(defaults);
      }
    },

    _setUp: function () {
      this.definePageObservables();

      this.searchQuery = ko.observable();
      this.sortedBy    = ko.observableArray([]);
      this.filters     = ko.observable({});
      this._isLocked   = ko.observable(false);
    },

    useValues: function (values) {
      forEach(values, function (value, field) {
        this[field](value);
      }, this);
    },

    definePageObservables: function () {
      this.page         = ko.observable();
      this.lastPage     = ko.observable();
      this.page.isFirst = ko.computed(isFirstPage, this);
      this.page.isLast  = ko.computed(isLastPage, this);
      this.perPage      = ko.observable();
      this.page.isCurrent = isCurrentPage;
      this.page.inRange = isValidPage.bind(this);
    },

    extract: function () {
      if (this._extractor) {
        return this._extractor;
      }
      var data = tkt.mixinPublic({ _: ko.observable() }, this);
      var state = ko.computed({
        read: function() {
          return ko.toJS(data);
        },
        deferEvaluation: true
      });
      state.throttleEvaluation = this.throttleTimeout;
      state.assemble = function () {
        data._.notifySubscribers();
        return this();
      };

      return this._extractor = state;
    },

    onChange: function (callback, context) {
      this.extract().subscribe(callback, context);
    }
  });
})();
