var completeMe = function(options){

  var o = _.extend({

    input           : null
  , source          : null
  , width           : null
  , minChars        : 1
  , maxResults      : null
  , formatList      : null
  , afterSelection  : null
  , onFocus         : null
  , startText       : null
  , noResultsText   : 'No results'
  , timeoutText     : 'Timeout'
  , forceChoice     : true
  , selectFirst     : true

  }, options)

  this.id     = Math.floor(Math.random()*100)
  this.value  = null
  this.text   = null
  this.last   = null //last query sarch

  //init
  var self    = this
    , input   = o.input
    , timeout = null
    , matches = []
    , list    = null

  input.addClass('cm_input')
  input.attr('autocomplete', 'off')
  if(o.startText) input.attr('placeholder', o.startText)
  if(o.width) input.css('width', o.width + 'px')
  input.after('<ul class="cm_ul" id="cm_'+self.id+'"></ul>')
  list = $('#cm_'+self.id)
  if(o.width) list.css('width', (o.width+6) + 'px')
  list.hide()

  //handle focus
  input.focus(function(){
    if(typeof o.onFocus == 'function') o.onFocus.call(this)
    if(input.val().length == 0) return
    if(input.val().length == self.last.length) list.show()
    else if(!(input.val().length < o.minChars)) change()
  })

  //handle key press
  input.keydown(function(e) {

    switch(e.keyCode) {
      case 38: // up
        e.preventDefault()
        move("up")
        break
      case 40: // down
        e.preventDefault()
        move("down")
        break
      case 9: //tab
      case 188: //comma
        break
      case 13: //enter
        select()
        break
      case 8: // delete
        if(input.val().length == 1) list.hide()
        else{
          if(timeout){ clearTimeout(timeout) }
          timeout = setTimeout(function(){ change() }, 400)
        }
        break
      default:
        if(timeout){ clearTimeout(timeout) }
        timeout = setTimeout(function(){ change() }, 400)
    }

  })

  //hide list on outside click
  $(document).on('click', function(event){ 
    if(event.target.className != 'cm_input') list.hide()
  })

  list.on("mouseover", "li", function(){
    var active  = list.find('li.active')
    var index   = active.index()
    active.removeClass('active')
    $(this).addClass('active')
  })

  list.on("click", "li", function(){
    select()
  })

  function select(){

    self.value  = null
    self.text   = null

    var active  = list.find('li.active')
    var index   = active.index()
    var object  = matches[index]

    list.hide()

    if(!object && o.forceChoice) input.val('')
    if(!object) return

    self.value  = object.id
    self.text   = object.short || object.text

    input.val(self.text)
    if(typeof o.afterSelection == 'function') o.afterSelection.call(self, object)
  }

  function setSource(){
    var defered = new jQuery.Deferred()

    if(_.isArray(o.source)) defered.resolve(o.source)
    if(typeof(o.source) == 'function') o.source.call(self, input.val(), defered)
    setTimeout(function(){ defered.reject(o.timeoutText) }, 5000)

    return defered.promise()
  }

  function change(){

    //reset matches
    matches = []
    list.hide()

    if(input.val().length < o.minChars) return

    input.addClass('loading')

    var data  = null
      , query = input.val()

    self.last = query

    $.when( setSource() ).then(
      function(data){

        if(_.isArray(data)){

          //escape specials chars
          query = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
          
          matches = _.compact(_.map(data, function(object){
            reg = new RegExp(query, "gi")
            return reg.test(object.text) ? object : null
          }))

        }

        process()

      },
      function(error){
        process(error)
      }
    )

  }

  function process(timeout){

    list.empty()
    list.show()

    input.removeClass('loading')

    if(!matches.length) list.append('<li>' + (timeout || o.noResultsText) + '</li>')

    var max = o.maxResults || 50
    if(max > matches.length) max = matches.length
    for(var i=0; i<max; i++){
      var object = matches[i]
      var elem = $('<li/>')
      if(typeof o.formatList == 'function') elem = o.formatList.call(null, object, elem)
      else elem.html(object.text)
      list.append(elem)
    }

    if(o.selectFirst) move('down')

  }

  function move(k){
    if(list.find('li.active').length){
      var active  = list.find('li.active')
      var index   = active.index()
      active.removeClass('active')
      if(k == 'up') list.find('li:eq('+(index-1)+')').addClass('active')
      if(k == 'down') list.find('li:eq('+(index+1)+')').addClass('active')
    }else{
      if(k == 'up') list.find('li:last').addClass('active')
      if(k == 'down') list.find('li:first').addClass('active')
    }
  }

}