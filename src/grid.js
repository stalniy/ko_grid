var tkGrid = (function () {
  var Grid = Object.extend({
    options: {
      defaults: {
        perPage: 25
      },

      rowType: Object,

      state: GridState
    },

    initialize: function (adapter, options) {
      this.options = tkt.deepExtend({}, this.options, options);

      this.state = new this.options.state(this.options.defaults);
      this._setUp();
      this._connectTo(adapter);
    },

    dispatcher: function () {
      if (!this._dispatcher) {
        this._dispatcher = new ko.subscribable();
      }
      return this._dispatcher;
    },

    _setUp: function () {
      this.columns = ko.observableArray([]);
      this.rows    = ko.observableArray([]);

      this.hasRows = ko.observable(false);
      this.rows.subscribe(function (rows) { this(rows.length !== 0) }, this.hasRows);

      this._definePageObservables();
      this._setUpUpdates();
      this.unlock = this.unlock.bind(this);
      this.load   = this.reload;
    },

    _definePageObservables: function () {
      this.hasToPaginate = ko.computed({
        read: hasToPaginate,
        deferEvaluation: true
      }, this.state);
    },

    _setUpUpdates: function () {
      this.state.searchQuery.subscribe(this.showFirstPage, this);
      this.state.perPage.subscribe(this.showFirstPage, this);
    },

    _connectTo: function (adapter) {
      this._adapter = adapter;
      this.state.extract().subscribe(function (newState) {
        newState.withMeta = this.columns().length === 0;
        this.trigger("state:change", newState);
        this.apply(newState);
      }, this);
      return this;
    },

    _fill: function (data) {
      if (data.columns) {
        this.columns(data.columns);
      }
      this.setRows(data.items);
      this.state.lastPage(data.lastPage);
    },

    fill: function (data) {
      this._fill(data);
      this.trigger("grid:updated", { grid: this });
    },

    pages: function () {
      return ko.utils.range(1, this.state.lastPage());
    },

    apply: function (newState) {
      if (this.isLocked()) {
        this._adapter.abortProcessing();
      }

      this.lock();
      return this._adapter.process(newState)
        .done(this.fill.bind(this))
        .always(this.unlock);
    },

    reload: function () {
      this.showFirstPage();
      this.state.extract().assemble();
      return this;
    },

    setRows: function (newRows) {
      this.rows.valueWillMutate();
      this._syncItems(newRows || []);
      this.rows.valueHasMutated();
    },

    push: function (items) {
      this.rows.push.apply(this.rows, this._rowsFor(items));
    },

    column: function (name) {
      if (this.columns().length === 0) {
        return null;
      }
      return arrayFind(this.columns(), function (column) {
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
      return new this.options.rowType(item);
    },

    search: function (query) {
      this.state.searchQuery(query);
      return this;
    },

    orderBy: function () {
      var columns = arraySlice.call(arguments), sortedBy = this.state.sortedBy;
      if (!isEqualArrays(sortedBy(), columns)) {
        sortedBy(columns);
      }
      return this;
    },

    toggleOrderBy: function (fieldName) {
      var currentOrder = (this.state.sortedBy()[0] || '').split('-');

      if (currentOrder[0] === fieldName) {
        currentOrder[1] = currentOrder[1] === 'desc' ? 'asc' : 'desc';
      } else {
        currentOrder[0] = fieldName;
        currentOrder[1] = 'asc';
      }

      return this.orderBy(currentOrder.join('-'));
    },

    filterFor: function (path) {
      var filters = this.state.filters();
      var loc = tkt.valueLocationIn(root, path);

      return loc.cursor;
    },

    shiftPage: function (value) {
      return this.setPage(this.state.page() + Number(value));
    },

    setPage: function (value) {
      var newPage = Number(value);
      if (this.state.page.inRange(newPage)) {
        this.state.page(newPage);
      }
      return this;
    },

    showFirstPage: function () {
      this.state.page(1);
      return this;
    },

    showLastPage: function () {
      this.state.page(this.state.lastPage());
      return this;
    },

    isLocked: function () {
      return this.state._isLocked();
    },

    lock: function () {
      this.state._isLocked(true);
      return this;
    },

    unlock: function () {
      this.state._isLocked(false);
      return this;
    },

    on: function (event, callback, context) {
      this.dispatcher().subscribe(callback, context, event);
      return this;
    },

    trigger: function (event, params) {
      this.dispatcher().notifySubscribers(params, event);
      return this;
    },

    resetSearchQuery: function () {
      this.state.searchQuery('');
      return this;
    },

    isEmptySearchQuery: function () {
      return !this.state.searchQuery();
    }
  });

  function hasToPaginate() {
    return this.lastPage() > 1;
  }

  Grid.State = GridState;

  return Grid;
})();
