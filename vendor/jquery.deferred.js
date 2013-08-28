;(function () {
var toString = Function.prototype.call.bind( Object.prototype.toString ),
  indexOf = Function.prototype.call.bind( Array.prototype.indexOf ),
  r_cleanType = /^\[object |\]$/g,
  typeCache = {};

var utils = {
  each: function( object, func ) {
    func = Function.prototype.call.bind( func );
    var length = object.length,
      key;
    if ( length === undefined || utils.type( object ) === "function" ) {
      for( key in object ) {
        func( object[ key ], key, object[ key ] );
      }
    } else {
      for ( key = 0; key < length; key++ ) {
        func( object[ key ], key, object[ key ] );
      }
    }
  },
  extend: function( target, src ) {
    if ( src ) {
      for( var key in src ) {
        target[ key ] = src[ key ];
      }
    }
    return target;
  },
  inArray: function( array, elem ) {
    return array ? indexOf( array, elem ) : -1;
  },
  noop: function() {},
  type: function( obj ) {
    var type = ( obj == null ? String : toString )( obj );
    return typeCache[ type ] || ( typeCache[ type ] = type.replace( r_cleanType, "" ).toLowerCase() );
  }
};

var core_slice =  Array.prototype.slice,
  core_rnotwhite = /\S+/g;

var Deferred = function( func ) {
  var tuples = [
      // action, add listener, listener list, final state
      [ "resolve", "done", Deferred.Callbacks("once memory"), "resolved" ],
      [ "reject", "fail", Deferred.Callbacks("once memory"), "rejected" ],
      [ "notify", "progress", Deferred.Callbacks("memory") ]
    ],
    state = "pending",
    promise = {
      state: function() {
        return state;
      },
      always: function() {
        deferred.done( arguments ).fail( arguments );
        return this;
      },
      then: function( /* fnDone, fnFail, fnProgress */ ) {
        var fns = arguments;
        return Deferred(function( newDefer ) {
          utils.each( tuples, function( i, tuple ) {
            var action = tuple[ 0 ],
              fn = "function" === utils.type( fns[ i ] ) && fns[ i ];
            // deferred[ done | fail | progress ] for forwarding actions to newDefer
            deferred[ tuple[1] ](function() {
              var returned = fn && fn.apply( this, arguments );
              if ( returned && "function" === utils.type( returned.promise ) ) {
                returned.promise()
                  .done( newDefer.resolve )
                  .fail( newDefer.reject )
                  .progress( newDefer.notify );
              } else {
                newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
              }
            });
          });
          fns = null;
        }).promise();
      },
      // Get a promise for this deferred
      // If obj is provided, the promise aspect is added to the object
      promise: function( obj ) {
        return obj != null ? utils.extend( obj, promise ) : promise;
      }
    },
    deferred = {};

  // Keep pipe for back-compat
  promise.pipe = promise.then;

  // Add list-specific methods
  utils.each( tuples, function( i, tuple ) {
    var list = tuple[ 2 ],
      stateString = tuple[ 3 ];

    // promise[ done | fail | progress ] = list.add
    promise[ tuple[1] ] = list.add;

    // Handle state
    if ( stateString ) {
      list.add(function() {
        // state = [ resolved | rejected ]
        state = stateString;

      // [ reject_list | resolve_list ].disable; progress_list.lock
      }, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
    }

    // deferred[ resolve | reject | notify ]
    deferred[ tuple[0] ] = function() {
      deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
      return this;
    };
    deferred[ tuple[0] + "With" ] = list.fireWith;
  });

  // Make the deferred a promise
  promise.promise( deferred );

  // Call given func if any
  if ( func ) {
    func.call( deferred, deferred );
  }

  // All done!
  return deferred;
};

// Deferred helper
Deferred.when = function( subordinate /* , ..., subordinateN */ ) {
  var i = 0,
    resolveValues = core_slice.call( arguments ),
    length = resolveValues.length,

    // the count of uncompleted subordinates
    remaining = length !== 1 || ( subordinate && "function" === utils.type( subordinate.promise ) ) ? length : 0,

    // the master Deferred. If resolveValues consist of only a single Deferred, just use that.
    deferred = remaining === 1 ? subordinate : Deferred(),

    // Update function for both resolve and progress values
    updateFunc = function( i, contexts, values ) {
      return function( value ) {
        contexts[ i ] = this;
        values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
        if( values === progressValues ) {
          deferred.notifyWith( contexts, values );
        } else if ( !( --remaining ) ) {
          deferred.resolveWith( contexts, values );
        }
      };
    },

    progressValues, progressContexts, resolveContexts;

  // add listeners to Deferred subordinates; treat others as resolved
  if ( length > 1 ) {
    progressValues = new Array( length );
    progressContexts = new Array( length );
    resolveContexts = new Array( length );
    for ( ; i < length; i++ ) {
      if ( resolveValues[ i ] && "function" === utils.type( resolveValues[ i ].promise ) ) {
        resolveValues[ i ].promise()
          .done( updateFunc( i, resolveContexts, resolveValues ) )
          .fail( deferred.reject )
          .progress( updateFunc( i, progressContexts, progressValues ) );
      } else {
        --remaining;
      }
    }
  }

  // if we're not waiting on anything, resolve the master
  if ( !remaining ) {
    deferred.resolveWith( resolveContexts, resolveValues );
  }

  return deferred.promise();
};

// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
  var object = optionsCache[ options ] = {};
  utils.each( options.match( core_rnotwhite ) || [], function( _, flag ) {
    object[ flag ] = true;
  });
  return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *  options: an optional list of space-separated options that will change how
 *      the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *  once:     will ensure the callback list can only be fired once (like a Deferred)
 *
 *  memory:     will keep track of previous values and will call any callback added
 *          after the list has been fired right away with the latest "memorized"
 *          values (like a Deferred)
 *
 *  unique:     will ensure a callback can only be added once (no duplicate in the list)
 *
 *  stopOnFalse:  interrupt callings when a callback returns false
 *
 */
Deferred.Callbacks = function( options ) {

  // Convert options from String-formatted to Object-formatted if needed
  // (we check in cache first)
  options = typeof options === "string" ?
    ( optionsCache[ options ] || createOptions( options ) ) :
    utils.extend( {}, options );

  var // Flag to know if list is currently firing
    firing,
    // Last fire value (for non-forgettable lists)
    memory,
    // Flag to know if list was already fired
    fired,
    // End of the loop when firing
    firingLength,
    // Index of currently firing callback (modified by remove if needed)
    firingIndex,
    // First callback to fire (used internally by add and fireWith)
    firingStart,
    // Actual callback list
    list = [],
    // Stack of fire calls for repeatable lists
    stack = !options.once && [],
    // Fire callbacks
    fire = function( data ) {
      memory = options.memory && data;
      fired = true;
      firingIndex = firingStart || 0;
      firingStart = 0;
      firingLength = list.length;
      firing = true;
      for ( ; list && firingIndex < firingLength; firingIndex++ ) {
        if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
          memory = false; // To prevent further calls using add
          break;
        }
      }
      firing = false;
      if ( list ) {
        if ( stack ) {
          if ( stack.length ) {
            fire( stack.shift() );
          }
        } else if ( memory ) {
          list = [];
        } else {
          self.disable();
        }
      }
    },
    // Actual Callbacks object
    self = {
      // Add a callback or a collection of callbacks to the list
      add: function() {
        if ( list ) {
          // First, we save the current length
          var start = list.length;
          (function add( args ) {
            utils.each( args, function( _, arg ) {
              var type = utils.type( arg );
              if ( type === "function" ) {
                if ( !options.unique || !self.has( arg ) ) {
                  list.push( arg );
                }
              } else if ( arg && arg.length && type !== "string" ) {
                // Inspect recursively
                add( arg );
              }
            });
          })( arguments );
          // Do we need to add the callbacks to the
          // current firing batch?
          if ( firing ) {
            firingLength = list.length;
          // With memory, if we're not firing then
          // we should call right away
          } else if ( memory ) {
            firingStart = start;
            fire( memory );
          }
        }
        return this;
      },
      // Remove a callback from the list
      remove: function() {
        if ( list ) {
          utils.each( arguments, function( _, arg ) {
            var index;
            while( ( index = utils.inArray( list, arg, index ) ) > -1 ) {
              list.splice( index, 1 );
              // Handle firing indexes
              if ( firing ) {
                if ( index <= firingLength ) {
                  firingLength--;
                }
                if ( index <= firingIndex ) {
                  firingIndex--;
                }
              }
            }
          });
        }
        return this;
      },
      // Check if a given callback is in the list.
      // If no argument is given, return whether or not list has callbacks attached.
      has: function( fn ) {
        return fn ? utils.inArray( list, fn ) > -1 : !!( list && list.length );
      },
      // Remove all callbacks from the list
      empty: function() {
        list = [];
        return this;
      },
      // Have the list do nothing anymore
      disable: function() {
        list = stack = memory = undefined;
        return this;
      },
      // Is it disabled?
      disabled: function() {
        return !list;
      },
      // Lock the list in its current state
      lock: function() {
        stack = undefined;
        if ( !memory ) {
          self.disable();
        }
        return this;
      },
      // Is it locked?
      locked: function() {
        return !stack;
      },
      // Call all callbacks with the given context and arguments
      fireWith: function( context, args ) {
        args = args || [];
        args = [ context, args.slice ? args.slice() : args ];
        if ( list && ( !fired || stack ) ) {
          if ( firing ) {
            stack.push( args );
          } else {
            fire( args );
          }
        }
        return this;
      },
      // Call all the callbacks with the given arguments
      fire: function() {
        self.fireWith( this, arguments );
        return this;
      },
      // To know if the callbacks have already been called at least once
      fired: function() {
        return !!fired;
      }
    };

  return self;
};
this.Deferred = Deferred;
}).call(this);