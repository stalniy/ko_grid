describe("Grid state", function () {
  var state;

  beforeEach(function () {
    state = new tkGrid.State();
    state.throttleTimeout = 10;
  })

  describe("public properties", function () {
    it ("has observable search query", function () {
      expect(state.searchQuery).toBeObservable();
    })

    it ("has observable sortedBy field", function () {
      expect(state.sortedBy).toBeObservable();
    })

    it ("has observable filters", function () {
      expect(state.filters).toBeObservable();
    })

    it ("has observable page number", function () {
      expect(state.page).toBeObservable();
    })

    it ("has observable lastPage number", function () {
      expect(state.lastPage).toBeObservable();
    })

    it ("has observable perPage number", function () {
      expect(state.perPage).toBeObservable();
    })
  })

  describe("when initializes", function () {
    beforeEach(function () {
      spyOn(tkGrid.State.prototype, 'useValues');
    })

    it ("sets sortedBy into empty array", function () {
      expect(state.sortedBy()).toEqual([]);
    })

    it ("accepts default values as first optional parameter", function () {
      var anotherState = new tkGrid.State({
        page: 10,
        lastPage: 12
      });
      expect(anotherState.useValues).toHaveBeenCalled();
    })
  })

  describe("when specified default values", function () {
    var defaultValues;

    beforeEach(function () {
      defaultValues = {
        page: 2,
        lastPage: 12,
        sortedBy: [ 'name-desc', 'age' ],
        filters:  {
          createdAt: +new Date
        }
      };
      state.useValues(defaultValues);
    })

    it ("updates page", function () {
      expect(state.page()).toEqual(defaultValues.page);
    })

    it ("updates lastPage", function () {
      expect(state.lastPage()).toEqual(defaultValues.lastPage);
    })

    it ("updates sortedBy", function () {
      expect(state.sortedBy()).toEqual(defaultValues.sortedBy);
    })

    it ("updates filters", function () {
      expect(state.filters()).toEqual(defaultValues.filters);
    })
  })

  describe("when is extracted", function () {

    it ("doesn't contain private properties", function () {
      state._privateProperty = ko.observable("private");

      var value = state.extract().assemble();
      expect(value._privateProperty).not.toBeDefined();
    })

    it ("contains public properties", function () {
      state.publicProperty = ko.observable("public");
      var value = state.extract().assemble();
      expect(value.publicProperty).toEqual("public");
    })

    it ("assembles with throttling", function () {
      var computed = state.extract();
      var updatesCount = 0;

      runs(function () {
        computed.subscribe(function () { updatesCount++ });
        computed.assemble();
      });

      waitsFor(function () {
        return updatesCount;
      }, "State was not assembled", 2 * state.throttleTimeout);

      runs(function () {
        expect(updatesCount).toEqual(1);
      })
    })
  })

  describe("deferred assembling", function () {
    var computed, isUpdated, shouldCheckState;

    beforeEach(function () {
      computed = state.extract();
      isUpdated = false;
      shouldCheckState = false;
    })

    it ("doesn't happen if 'assemble' method is not called", function () {
      runs(function () {
        computed.subscribe(function () { shouldCheckState = isUpdated = true; });
        state.page(2).lastPage(10);
        setTimeout(function () { shouldCheckState = true }, state.throttleTimeout + 10);
      });

      waitsFor(function () {
        return shouldCheckState;
      }, "shouldCheckState was not updated", 2 * state.throttleTimeout);

      runs(function () {
        expect(isUpdated).toBe(false);
      })
    })

    it ("happens only after 'assemble' method is called", function () {
      runs(function () {
        computed.subscribe(function () { shouldCheckState = isUpdated = true; });
        state.page(2).lastPage(10);
        computed.assemble();
      });

      waitsFor(function () {
        return shouldCheckState;
      }, "shouldCheckState was not updated", 2 * state.throttleTimeout);

      runs(function () {
        expect(isUpdated).toBe(true);
      })
    })
  })

  describe("page observable", function () {
    beforeEach(function () {
      state.page(2).lastPage(4);
    })

    it ("checks if the page is first", function () {
      state.page(1);
      expect(state.page.isFirst()).toBe(true);
    })

    it ("checks if the page is last", function () {
      state.page(4);
      expect(state.page.isLast()).toBe(true);
    })

    it ("checks if specified page is current", function () {
      expect(state.page.isCurrent(2)).toBe(true);
    })

    describe("inRange method", function () {
      it ("returns true if page is between current and last pages", function () {
        expect(state.page.inRange(3)).toBe(true);
      })

      it ("returns true if page equals current page", function () {
        expect(state.page.inRange(state.page())).toBe(true);
      })

      it ("return true if page equals last page", function () {
        expect(state.page.inRange(state.lastPage())).toBe(true)
      })

      it ("returns false if page is not a number", function () {
        expect(state.page.inRange("test me")).toBe(false);
      })
    })
  })

})
