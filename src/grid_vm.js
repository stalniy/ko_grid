var GridViewModel = Object.extend({
  defaults: {
    perPage: 25
  },

  initialize: function (grid, options) {
    var stateValues = this.defaults;
    options = options || {};
    if (options.defaults) {
      stateValues = options.defaults;
      delete options.defaults;
    }
    this.state = new (options.state || GridViewModel.State)(stateValues);
    this._setUp(options);
    this._connectTo(grid);
    this.reload();
  },

  _setUp: function (options) {
    this.columns = [];
    this.rows    = ko.observableArray();
    this.options = ko.utils.extend({ row: Object }, options);
    this._dispatcher = new ko.subscribable();

    this.hasRows = ko.observable(false);
    this.pages   = ko.computed(function() { return ko.utils.range(1, this()) }, this.state.lastPage);
    this.hasToPaginate = ko.computed(function() { return this() > 1 }, this.state.lastPage);
    this._setUpUpdates();
  },

  _setUpUpdates: function () {
    this.rows.subscribe(function (rows) { this(rows.length !== 0) }, this.hasRows);
    this.state.searchQuery.subscribe(this.showFirstPage, this);
    this.state.perPage.subscribe(this.showFirstPage, this);
  },

  _connectTo: function (grid) {
    var vm = this;
    vm.on("state:change", function (newState) {
      if (!vm.isLocked()) {
        vm.lock();
        newState.withMeta = vm.columns.length === 0;
        grid.apply(newState).done(function (data) {
          grid.fill(vm, data);
          vm._dispatcher.notifySubscribers({ viewModel: vm }, 'loaded');
        }).always(vm.unlock.bind(vm));
      }
    });
    return vm;
  },

  reload: function () {
    this.showFirstPage();
    this.state.extract().assemble();
    return this;
  },

  items: function (newRows) {
    this.rows.valueWillMutate();
    this._syncItems(newRows);
    this.rows.valueHasMutated();
  },

  push: function (items) {
    this.rows.push.apply(this.rows, this._rowsFor(items));
  },

  fields: function (columns) {
    this.columns = columns;
  },

  column: function (name) {
    if (!this.columns) {
      return null;
    }
    return arrayFind(this.columns, function (column) {
      return column.name === name;
    });
  },

  _syncItems: function (newRows) {
    var i = -1, count = newRows.length, rows = this.rows();
    while (++i < count) {
      if (rows[i] && rows[i].update) {
        rows[i].update(newRows[i]);
      } else {
        rows[i] = this._rowFor(newRows[i]);
      }
    }
    if (rows.length - count > 0) {
      rows.length = count;
    }
    return rows;
  },

  _rowsFor: function (items) {
    return ko.utils.arrayMap(items, this._rowFor.bind(this));
  },

  _rowFor: function (item) {
    return new this.options.row(item);
  },

  search: function (query) {
    this.state.searchQuery(query);
    this.showFirstPage();
  },

  orderBy: function () {
    var columns = Array.prototype.slice.call(arguments), sortedBy = this.state.sortedBy;
    if (!isEqualArrays(sortedBy(), columns)) {
      sortedBy(columns);
    }
  },

  filterFor: function (path) {
    var filters = this.state.filters();
    if (path) {
      return setByPath(filters, path + '._');
    } else {
      return filters;
    }
  },

  shiftPage: function (value) {
    this.setPage(this.state.page() + Number(value));
  },

  setPage: function (value) {
    var newPage = Number(value);
    if (this.state.page.inRange(newPage)) {
      this.state.page(newPage);
    }
  },

  showFirstPage: function () {
    this.state.page(1);
  },

  showLastPage: function () {
    this.state.page(this.state.lastPage());
  },

  lastPage: function (last) {
    this.state.lastPage(last);
  },

  isLocked: function () {
    return this.state._isLocked();
  },

  lock: function () {
    this.state._isLocked(true);
  },

  unlock: function () {
    this.state._isLocked(false);
  },

  on: function (event, callback, context) {
    var data = findResponderFor.call(this, event);
    if (data) {
      data.responder[data.method](callback, context);
    } else {
      this._dispatcher.subscribe(callback, context, event);
    }
    return this;
  }
});

GridViewModel.State = Object.extend({
  initialize: function (defaults) {
    this.setUp();
    if (defaults) {
      this.useValues(defaults);
    }
  },

  setUp: function () {
    this.definePageObservables();

    this.searchQuery = ko.observable();
    this.sortedBy    = ko.observableArray();
    this.filters     = ko.observable({});
  },

  useValues: function (values) {
    forEach(values, function (value, field) {
      this[field](value);
    }, this);
  },

  definePageObservables: function () {
    this.page         = ko.observable(1);
    this.lastPage     = ko.observable(1);
    this.page.isFirst = ko.computed(function() { return this.page() === 1 }, this);
    this.page.isLast  = ko.computed(function() { return this.page() === this.lastPage() }, this);
    this.perPage      = ko.observable();
    this._isLocked    = ko.observable(false);
    this.page.isCurrent = function(page) { return this() === Number(page) };
    this.page.inRange = function(page) { return Number(page) >= 1 && Number(page) <= this.lastPage() }.bind(this);
  },

  extract: function () {
    if (this._extractor) {
      return this._extractor;
    }
    var data = mixinPublic({ _: ko.observable(0) }, this), counter = 0;
    this._extractor = ko.computed({
      read: function(){ return ko.toJS(data) },
      throttleEvaluation: 1
    });
    var counter = 0;
    this._extractor.assemble = function () { data._(++counter); return this(); };
    return this._extractor;
  },

  onChange: function (callback, context) {
    this.extract().subscribe(callback, context);
  }
});