ko.extenders.changeable = function (target) {
  var isChanged = false, oldValue = null;
  target.subscribe(function(){
    if (!isChanged){
      isChanged = true;
      oldValue  = this.target();
    }
  }, null, 'beforeChange');
  target.commit = function(){
    if (isChanged) {
      oldValue = null;
      isChanged = false;
    }
  };
  target.revert = function(){
    if (isChanged) {
      this(oldValue);
      oldValue = null;
      isChanged = false;
    }
  };
  target.isChanged = function(){ return isChanged };
  target.was       = function(){ return oldValue  };
  return target;
};