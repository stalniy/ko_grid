tkGrid.LocalAdapter = (function () {
  var LocalAdapter = tkGrid.BaseAdapter.extend({

    initialize: function (rows) {
      this._searchableFields = [];
      this._columnFilters = {};

      if (rows) {
        this.load(rows);
      }
    },

    apply: function (state) {
      var items = this.rowsForState(state);
      return ImmidiateDeferred({
        columns  : state.withMeta ? this.columns() : null,
        lastPage : Math.ceil(items.length / state.perPage),
        items    : this.paginate(items, state.page, state.perPage)
      });
    },

    rows: function () {
      this._rows = this._rows || [];
      return this._rows;
    },

    searchableFields: function (fields) {
      if (arguments.length === 1) {
        this._searchableFields = fields;
        return this;
      }
      return this._searchableFields;
    },

    searchableFieldsOf: function (item) {
      return this.searchableFields().length === 0 ? this._getFieldsOf(item, 'string') : this.searchableFields();
    },

    load: function (rows) {
      this._rows = this.columns().length > 0 ? this._prepareRows(rows) : rows;
      return this;
    },

    rowsForState: function (state) {
      var items = this.rows().slice(0);

      forEach(this.handles, function (method, stateField) {
        items = this[method](items, state[stateField]);
      }, this);

      return items;
    },

    sort: function (items, columns) {
      if (!columns || columns.length === 0) {
        return items;
      }

      items.sort(function compare(row1, row2, index) {
        index = index || 0;
        var
          column = columns[index].split("-"),
          order  = column[1] == "desc" ? -1 : 1,
          v1     = row1[column[0]],
          v2     = row2[column[0]];

        if (typeof v1 === 'string') {
          v1 = v1.toLowerCase();
          v2 = v2.toLowerCase();
        }

        if (v1 !== v2) {
          return v1 > v2 ? order : -order;
        }
        return columns[index + 1] ? compare(row1, row2, index + 1) : 0;
      });

      return items;
    },

    filter: function (items, filters) {
      if (!filters || tkt.isObjectEmpty(filters)) {
        return items;
      }

      return arrayFilter(items, function (item) {
        var result = false;
        forEach(filters, function (filter, column) {
          result = tkt.isValueBlank(filter);
          if (result) {
            return false;
          }
          result = column in item && isSuitableValue.call(this, item, filter, column);
          if (!result) {
            return false;
          }
        }, this);
        return result;
      }, this);
    },

    search: function (items, string) {
      if (!string || !string.trim()) {
        return items;
      }

      var self = this;
      string = string.trim().toLowerCase();

      return arrayFilter(items, function (item) {
        var result = false;
        forEach(self.searchableFieldsOf(item), function (field) {
          if (item[field].toString().toLowerCase().indexOf(string) !== -1) {
            result = true;
            return false;
          }
        });
        return result;
      });
    },

    paginate: function (items, currentPage, perPage) {
      var start = (currentPage - 1) * perPage;
      return items.slice(start, start + perPage);
    },

    _getFieldsOf: function (item, fieldType) {
      var fields = [];
      forEach(item, function (value, field) {
        if (typeof value === fieldType) {
          fields.push(field);
        }
      });
      return fields;
    }
  });

  function isSuitableValue(row, filter, field) {
    var result = false,
        value  = row[field],
        cast   = this._getColumnType(field, value) || returnSelf;

    if (Array.isArray(filter)) {
      var i = filter.length;
      while (i-- && cast(filter[i]) !== value);
      result = i !== -1;
    } else if (typeof cast(filter) === 'number' && !isNaN(cast(filter))) {
      result = Math.abs(filter - value) <= 1e-3
    } else if (filter !== null && typeof filter === 'object') {
      result = applyFileterOn.call(this, field, value, filter, cast);
    } else {
      result = value === cast(filter);
    }
    return result;
  }

  function applyFilterOn(field, value, filter, cast) {
    if (!(field in this._columnFilters)) {
      var i = -1, count = _filters.length;

      while (++i < count && !_filters[i].when(filter));
      this._columnFilters[field] = i < count ? i : null;
    }

    var filterIndex = this._columnFilters[field];

    return filterIndex !== null && _filters[filterIndex].apply(filter, value, cast);
  }

  var _filters = [];
  LocalAdapter.registerFilter = function (defs) {
    if (typeof defs.when !== 'function' || typeof defs.apply !== 'function') {
      throw 'Both "apply" and "when" methods should be defined for filter';
    }
    _filters.push(defs);
    return this;
  };

  LocalAdapter.registerFilter({
    when: function (filter) {
      return 'to' in filter || 'from' in filter;
    },

    apply: function (filter, value, cast) {
      var result = true;
      if ('from' in filter && filter.from !== "") {
        result = value >= cast(filter.from);
      }
      if ('to' in filter && filter.to !== "") {
        result = result && value <= cast(filter.to);
      }
      return result;
    }
  });

  return LocalAdapter;
})();
