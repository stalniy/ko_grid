describe("Grid", function () {
  var grid;

  describe("by default", function () {
    beforeEach(function () {
      grid = new tkGrid(DataAdapter());
    })

    it ("uses Object as rowType", function () {
      expect(grid.options.rowType).toBe(Object);
    })

    it ("uses tkGrid.State class", function () {
      expect(grid.state).toBeInstanceOf(tkGrid.State);
    })

    it ("defines 'hasRows' as boolean observable", function () {
      expect(grid.hasRows).toBeObservable();
    })

    it ("defines 'rows' as observable array", function () {
      expect(grid.rows).toBeObservable();
    })

    it ("defines 'columns' as observable array", function () {
      expect(grid.columns).toBeObservable();
    })

    it ("defines 'hasToPaginate' observable", function () {
      expect(grid.hasToPaginate).toBeObservable();
    })
  })

  describe("when it's initialized with defaults", function () {
    var defaultValues, mergedDefaults;

    beforeEach(function () {
      tkGrid.prototype.options.defaults.sortedBy = [ 'createdAt-desc' ];
      defaultValues = {
        page: 2,
        sortedBy: [ 'name-desc' ]
      };
      mergedDefaults = tkt.deepExtend({}, tkGrid.prototype.options.defaults, defaultValues);
      grid = new tkGrid(DataAdapter(), {
        defaults: defaultValues,
        state: jasmine.createSpy("custom State").andReturn(new tkGrid.State)
      });
    })

    afterEach(function () {
      delete tkGrid.prototype.options.defaults.sortedBy;
    })

    it ("merges defaults", function () {
      expect(grid.options.defaults).toEqual(mergedDefaults);
    })

    it ("passes merged defaults into state intializer", function () {
      expect(grid.options.state).toHaveBeenCalledWith(mergedDefaults);
    })

    it ("overrides class specific default values with instance specific", function () {
      expect(grid.options.defaults.sortedBy).toEqual(defaultValues.sortedBy);
    })
  })

  describe("when it's initialized with custom state", function () {
    var CustomState;

    beforeEach(function () {
      CustomState = tkGrid.State.extend({ });
      grid = new tkGrid(DataAdapter(), { state : CustomState });
    })

    it ("creates state as an instance of specified 'state' option class", function () {
      expect(grid.state).toBeInstanceOf(CustomState);
    })
  })

  describe("when triggers custom event", function () {
    var eventHandler, params;

    beforeEach(function () {
      params = { custom: true };
      eventHandler = jasmine.createSpy("custom event handler");
    })

    it ("can pass custom params", function () {
      grid.on("custom:event", eventHandler).trigger("custom:event", params);
      expect(eventHandler).toHaveBeenCalledWith(params);
    })

    it ("calls handler with specified context", function () {
      grid.on("custom:event", function () { eventHandler(this) }, params);
      grid.trigger("custom:event");
      expect(eventHandler).toHaveBeenCalledWith(params);
    })
  })

  describe("page updates", function () {
    beforeEach(function () {
      grid = new tkGrid(DataAdapter());
      grid.state.page(1).lastPage(5);
    })

    it ("sets state's page into specified page", function () {
      grid.setPage(2);
      expect(grid.state.page()).toEqual(2);
    })

    it ("doesn't set page if page isn't in valid range", function () {
      grid.setPage(10);
      expect(grid.state.page()).toEqual(1);
    })

    it ("calls state's 'inRange' method to check if page is in valid range", function () {
      spyOn(grid.state.page, 'inRange').andCallThrough();
      grid.setPage(10);
      expect(grid.state.page.inRange).toHaveBeenCalledWith(10);
    })

    it ("uses 'setPage' when shifts page on specific value", function () {
      spyOn(grid, 'setPage');
      grid.shiftPage(2);
      expect(grid.setPage).toHaveBeenCalledWith(grid.state.page() + 2);
    })

    it ("can shift page on positive number", function () {
      var pageBefore = grid.state.page();
      grid.shiftPage(2);
      expect(grid.state.page()).toEqual(pageBefore + 2);
    })

    it ("can shift page on negative number", function () {
      grid.state.page(4);
      grid.shiftPage(-2);
      expect(grid.state.page()).toEqual(2);
    })
  })

  describe("behavior", function () {
    beforeEach(function () {
      grid = new tkGrid(DataAdapter());
    })

    it ("sets state's page into '1' when 'showFirstPage' is called", function () {
      spyOn(grid.state, 'page').andCallThrough();
      grid.showFirstPage();
      expect(grid.state.page).toHaveBeenCalledWith(1);
    })

    it ("sets state's page into lastPage value when 'showLastPage' is called'", function () {
      grid.state.lastPage(10);
      spyOn(grid.state, 'page').andCallThrough();
      grid.showLastPage();
      expect(grid.state.page).toHaveBeenCalledWith(grid.state.lastPage());
    })

    it ("sets state's _isLocked into true when 'lock' is called", function () {
      spyOn(grid.state, '_isLocked').andCallThrough();
      grid.lock();
      expect(grid.state._isLocked).toHaveBeenCalledWith(true);
    })

    it ("sets state's _isLocked into false when 'unlock' is called", function () {
      spyOn(grid.state, '_isLocked').andCallThrough();
      grid.unlock();
      expect(grid.state._isLocked).toHaveBeenCalledWith(false);
    })

    it ("sets state's searchQuery into empty string when 'resetSearchQuery' is called", function () {
      spyOn(grid.state, 'searchQuery').andCallThrough();
      grid.resetSearchQuery();
      expect(grid.state.searchQuery).toHaveBeenCalledWith('');
    })

    it ("can check if searchQuery is empty", function () {
      grid.resetSearchQuery();
      expect(grid.isEmptySearchQuery()).toBe(true);
    })

    it ("sets state's searchQuery into specified value when 'search' method is called", function () {
      grid.search("it");
      expect(grid.state.searchQuery()).toEqual("it");
    })
  })

  function DataAdapter() {
    var deferred = Deferred();
    var promise  = deferred.promise();

    return {
      execDeferred    : deferred,
      process         : jasmine.createSpy("adapter process method").andReturn(promise),
      abortProcessing : jasmine.createSpy("adapter abortProcessing method")
    }
  }
})