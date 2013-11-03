tkGrid.BaseAdapter = (function () {
  var BaseAdapter = Object.extend({

    handles: {
      sortedBy    : "sort",
      filters     : "filter",
      searchQuery : "search"
    },

    define: function (dsl) {
      dsl(buildColumn.bind(this));
      return this;
    },

    columns: function () {
      if (!this._columns) {
        this._columns = addIndexTo([], 'name');
      }
      return this._columns;
    },

    column: function (name) {
      return this.columns().findByName(name);
    },

    _getColumnType: function (fieldName, value) {
      var column = this.columns().findByName(fieldName);
      if (column) {
        return typeof column.as === 'string' ? BaseGrid.ColumnType[column.as] : column.as;
      } else {
        return BaseGrid.ColumnType[typeof value] || returnSelf;
      }
    },

    abortProcessing: function () {
      this._shouldStopProcessing = true;
      return this;
    }
  });

  BaseAdapter.ColumnType = {
    string: function (value) {
      return value === null ? "" : String(value).trim();
    },

    number: Number,

    'int': function (value) {
      return parseInt(value, 10);
    },

    boolean: function (value) {
      return !!value;
    },

    datetime: function (value) {
      return new Date(value);
    },

    timestamp: function (value) {
      return +new Date(value);
    }
  };

  function buildColumn(name, optionsOrFilter, filter) {
    var columns = this.columns();
    var column  = columns.findByName(name) || {};
    var options = typeof optionsOrFilter === 'function' ? { as: optionsOrFilter } : (optionsOrFilter || {});

    if (!('name' in column)) {
      column.name = name;
      columns.push(column);
    }
    if (filter) {
      column.as = filter;
    }

    return mixin(column, options);
  }

  function addIndexTo(array, prop) {
    var
      index = {},

      removeIndex = function (arrayOrItem) {
        if (!Array.isArray(arrayOrItem)) {
          arrayOrItem = [ arrayOrItem ];
        }
        var i = arrayOrItem.length;
        while (i--) {
          delete index[this[i][prop]];
        }
      };


    array['findBy' + tkt.capitalize(prop)] = function (value) {
      return index[value];
    };

    array.push  = function () {
      var count = this.length;
      Array.prototype.push.apply(this, arguments);
      for (var i = count, c = this.length; i < c; i++) {
        index[this[i][prop]] = this[i];
      }
    };
    array.shift = function (){
      removeIndex.call(this, this[0]);
      return Array.prototype.shift.apply(this, arguments);
    };
    array.pop = function (){
      removeIndex.call(this, this[this.length - 1]);
      return Array.prototype.shift.apply(this, arguments);
    };
    array.splice = function (start, deleteCount){
      removeIndex.call(this, this.slice(start, start + deleteCount));
      return Array.prototype.splice.apply(this, arguments);
    };

    return array;
  }

  return BaseAdapter;
})();
