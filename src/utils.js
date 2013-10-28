var arraySlice = Array.prototype.slice;

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

function returnSelf(value) {
  return value;
}

function returnThis() {
  return this;
}

function ImmidiateDeferred() {
  var args = arguments;

  function done(fn) {
    fn.apply(null, args);
    return this;
  }

  return {
    done   : done,
    always : done,
    then   : done,
    fail   : returnThis
  };
}
