Object.extend = classExtend;

if(!Array.isArray) {
  Array.isArray = function (object) {
    return Object.prototype.toString.call(object) === "[object Array]";
  };
}

if (!String.prototype.trim) {
  var leading = /^\s+/, trailing = /\s+$/;
  String.prototype.trim = function () {
    return this.replace(leading, '').replace(trailing, '');
  };
}

function classExtend(defs) {
  var constructor = defs.initialize || function(){}, parent = this.prototype;
  if (defs.initialize) {
    delete defs.initialize;
  }
  constructor.prototype = mixin(Object.create(parent), defs);
  constructor.extend  = classExtend;
  constructor.include = classInclude;
  constructor.prototype._parent = function () {
    var args = Array.prototype.slice.call(arguments, 1);
    parent[arguments[0]].apply(this, args);
  };
  if (defs.include) {
    constructor.include.apply(constructor, defs.include);
    delete defs.include;
  }
  return constructor;
}

function classInclude() {
  var proto = this.prototype;
  for (var i = 0, c = arguments.length; i < c; i++) {
    mixinIfUndefined(proto, arguments[i]);
  }
  return this;
}

function mixin(it, from, filter) {
  for (var prop in from) {
    if (from.hasOwnProperty(prop)) {
      if (!filter || filter(from[prop], prop)) {
        it[prop] = from[prop];
      }
    }
  }
  return it;
}

function mixinIfUndefined(it, from) {
  return mixin(it, from, function (value, prop) {
    return !(prop in it);
  });
}

function mixinPublic(it, from) {
  return mixin(it, from, function (value, prop) {
    return prop.charAt(0) !== '_';
  });
}

function forEach(object, callback, context) {
  if ('length' in object) {
    for (var i = 0, c = object.length; i < c; i++) {
      if (callback.call(context, object[i], i) === false) {
        break;
      }
    }
  } else {
    for (var i in object) {
      if (object.hasOwnProperty(i) && callback.call(context, object[i], i) === false) {
        break;
      }
    }
  }
  return object;
}

function arrayFilter(array, filter, context) {
  var results = [];
  for (var i = 0, c = array.length; i < c; i++) {
    if (filter.call(context, array[i], i)) {
      results.push(array[i]);
    }
  }
  return results;
}

function arrayFind(array, filter, context) {
  var results = [];
  for (var i = 0, c = array.length; i < c; i++) {
    if (filter.call(context, array[i], i)) {
      return array[i];
    }
  }
  return null;
}

function findResponderFor(path) {
  path = path.split(':');
  var method = 'on' + capitalize(path.pop()), count = path.length, i = 0, responder;
  do {
    responder = this[path[i++]];
  } while (i < count && responder);
  return responder && responder[method] ? { responder: responder, method: method } : null;
}

function capitalize(str) {
  return String(str).toUpperCase().substr(0, 1) + str.toLowerCase().substr(1);
}

function isEqualArrays(array1, array2) {
  if (array1 === array2) {
    return true;
  }

  if (array1.length !== array2.length) {
    return false;
  }

  for (var i = 0, c = array1.length; i < c; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

function isObjectEmpty(object) {
  for (var prop in object) {
    if (object.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
}

function setByPath(root, path, value) {
  var segments = path.split('.'),
      cursor = root,
      segment;

  for (var i = 0, c = segments.length - 1; i < c; ++i) {
    segment = segments[i];
    cursor = cursor[segment] = cursor[segment] || {};
  }

  return cursor;
};

function returnSelf(value) { return value }

function isValueBlank(value) {
  return typeof value === 'undefined'                 ||
    typeof value === 'string' && value.trim() === ""  ||
    typeof value === 'object' && isObjectEmpty(value) ||
    Array.isArray(value) && (value.length === 0 || typeof value[0] === 'undefined');
}