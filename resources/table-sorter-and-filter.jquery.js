/*
 * 
 * TableSorter 2.0 - Client-side table sorting with ease!
 * Version 2.0.3
 * @requires jQuery v1.2.3
 * 
 * Copyright (c) 2007 Christian Bach
 * Examples and docs at: http://tablesorter.com
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 * 
 */
/**
 *
 * @description Create a sortable table with multi-column sorting capabilitys
 * 
 * @example $('table').tablesorter();
 * @desc Create a simple tablesorter interface.
 *
 * @example $('table').tablesorter({ sortList:[[0,0],[1,0]] });
 * @desc Create a tablesorter interface and sort on the first and secound column in ascending order.
 * 
 * @example $('table').tablesorter({ headers: { 0: { sorter: false}, 1: {sorter: false} } });
 * @desc Create a tablesorter interface and disableing the first and secound column headers.
 * 
 * @example $('table').tablesorter({ 0: {sorter:"integer"}, 1: {sorter:"currency"} });
 * @desc Create a tablesorter interface and set a column parser for the first and secound column.
 * 
 * 
 * @param Object settings An object literal containing key/value pairs to provide optional settings.
 * 
 * @option String cssHeader (optional)      A string of the class name to be appended to sortable tr elements in the thead of the table. 
 *                        Default value: "header"
 * 
 * @option String cssAsc (optional)       A string of the class name to be appended to sortable tr elements in the thead on a ascending sort. 
 *                        Default value: "headerSortUp"
 * 
 * @option String cssDesc (optional)      A string of the class name to be appended to sortable tr elements in the thead on a descending sort. 
 *                        Default value: "headerSortDown"
 * 
 * @option String sortInitialOrder (optional)   A string of the inital sorting order can be asc or desc. 
 *                        Default value: "asc"
 * 
 * @option String sortMultisortKey (optional)   A string of the multi-column sort key. 
 *                        Default value: "shiftKey"
 * 
 * @option String textExtraction (optional)   A string of the text-extraction method to use. 
 *                        For complex html structures inside td cell set this option to "complex", 
 *                        on large tables the complex option can be slow. 
 *                        Default value: "simple"
 * 
 * @option Object headers (optional)      An array containing the forces sorting rules. 
 *                        This option let's you specify a default sorting rule. 
 *                        Default value: null
 * 
 * @option Array sortList (optional)      An array containing the forces sorting rules. 
 *                        This option let's you specify a default sorting rule. 
 *                        Default value: null
 * 
 * @option Array sortForce (optional)       An array containing forced sorting rules. 
 *                        This option let's you specify a default sorting rule, which is prepended to user-selected rules.
 *                        Default value: null
 *  
  * @option Array sortAppend (optional)       An array containing forced sorting rules. 
 *                        This option let's you specify a default sorting rule, which is appended to user-selected rules.
 *                        Default value: null
 * 
 * @option Boolean widthFixed (optional)    Boolean flag indicating if tablesorter should apply fixed widths to the table columns.
 *                        This is usefull when using the pager companion plugin.
 *                        This options requires the dimension jquery plugin.
 *                        Default value: false
 *
 * @option Boolean cancelSelection (optional)   Boolean flag indicating if tablesorter should cancel selection of the table headers text.
 *                        Default value: true
 *
 * @option Boolean debug (optional)       Boolean flag indicating if tablesorter should display debuging information usefull for development.
 *
 * @type jQuery
 *
 * @name tablesorter
 * 
 * @cat Plugins/Tablesorter
 * 
 * @author Christian Bach/christian.bach@polyester.se
 */

(function($) {
  $.extend({
    tablesorter: new function() {
      
      var parsers = [], widgets = [];
      
      this.defaults = {
        cssHeader: "header",
        cssAsc: "headerSortUp",
        cssDesc: "headerSortDown",
        sortInitialOrder: "asc",
        sortMultiSortKey: "shiftKey",
        sortForce: null,
        sortAppend: null,
        textExtraction: "simple",
        parsers: {}, 
        widgets: [],    
        widgetZebra: {css: ["even","odd"]},
        headers: {},
        widthFixed: false,
        cancelSelection: true,
        sortList: [],
        headerList: [],
        dateFormat: "us",
        decimal: '.',
        debug: false,
        customMap: []
      };
      
      /* debuging utils */
      function benchmark(s,d) {
        log(s + ": " + (new Date().getTime() - d.getTime()) + "ms");
      }
      
      this.benchmark = benchmark;
      
      function log(s) {
        if (console !== undefined && console.debug !== undefined) {
          console.log(s);
        } else {
          alert(s);
        }
      }
      function findInMap(map, index, reverse) {
        var output = [];
        for(var i = 0; i < map.length; ++i) {
          if(map[i][reverse ? 1 : 0] == index) {
            var tmp =map[i][reverse ? 0 : 1];
            if ($.isArray(tmp) ) {
              for (kk=0; kk< tmp.length;++kk) {
                output.push(tmp[kk]);
              }
            } else {
              output.push(tmp);
            }

            break;
          }
        }
        if (! output) {
          output = index;
        }
        return output;
      }
      /* Detect the colspan */
      function detectColspan(table) {
        var ncolsdata = table.children[1].children[0].children.length;
        var iscolumndone = [];
        for (var k = 0; k < ncolsdata; k++) iscolumndone[k] = 0;
        
        var nrows = table.children[0].children.length;
        var map = [];
        var cosa;
        
        var jcolheadindex=0;
        for (i=0; i<nrows;i++) {
          var tr = table.children[0].children[i];
          var ncolshead = tr.children.length;
          jcoldata = 0;
          for (j=0;j<ncolshead;j++) {
            jcoldata = iscolumndone.indexOf(0,jcoldata);
            var colspan = parseInt(tr.children[j].getAttribute("colspan"));
            if (! colspan) { colspan = 1;}
            if (colspan == 1) {
              map.push([jcolheadindex,jcoldata]);
              iscolumndone[jcoldata]=1;
            } else {
              var tmp = [];
              for (k=0;k<colspan;k++) {
                tmp.push(jcoldata+k);
              }
              map.push([jcolheadindex,tmp]);
            }
            jcoldata=jcoldata + colspan;
            jcolheadindex=jcolheadindex+1;
          }
        }
        return map;
      }
      
      /* End of fix colspan issue */

      /* parsers utils */
      function buildParserCache(table,$headers) {
        
        if(table.config.debug) { var parsersDebug = ""; }
        
        var rows = table.tBodies[0].rows;
        
        if(table.tBodies[0].rows[0]) {

          var list = [], cells = rows[0].cells, l = cells.length;
          
          for (var i=0;i < l; i++) {
            var p = false;
            
            if($.metadata && ($($headers[i]).metadata() && $($headers[i]).metadata().sorter)  ) {
            
              p = getParserById($($headers[i]).metadata().sorter);  
            
            } else if((table.config.headers[i] && table.config.headers[i].sorter)) {
  
              p = getParserById(table.config.headers[i].sorter);
            }
            if(!p) {
              p = detectParserForColumn(table,cells[i]);
            }
  
            if(table.config.debug) { parsersDebug += "column:" + i + " parser:" +p.id + "\n"; }
  
            list.push(p);
          }
        }
        
        if(table.config.debug) { log(parsersDebug); }

        return list;
      };
      
      function detectParserForColumn(table,node) {
        var l = parsers.length;
        for(var i=1; i < l; i++) {
          if(parsers[i].is($.trim(getElementText(table.config,node)),table,node)) {
            return parsers[i];
          }
        }
        // 0 is always the generic parser (text)
        return parsers[0];
      }
      
      function getParserById(name) {
        var l = parsers.length;
        for(var i=0; i < l; i++) {
          if(parsers[i].id.toLowerCase() == name.toLowerCase()) { 
            return parsers[i];
          }
        }
        return false;
      }
      
      /* utils */
      function buildCache(table) {
        
        if(table.config.debug) { var cacheTime = new Date(); }
        
        
        var totalRows = (table.tBodies[0] && table.tBodies[0].rows.length) || 0,
          totalCells = (table.tBodies[0].rows[0] && table.tBodies[0].rows[0].cells.length) || 0,
          parsers = table.config.parsers, 
          cache = {row: [], normalized: []};
        
          for (var i=0;i < totalRows; ++i) {
          
            /** Add the table data to main data array */
            var c = table.tBodies[0].rows[i], cols = [];
          
            cache.row.push($(c));
            
            for(var j=0; j < totalCells; ++j) {
              cols.push(parsers[j].format(getElementText(table.config,c.cells[j]),table,c.cells[j])); 
            }
                        
            cols.push(i); // add position for rowCache
            cache.normalized.push(cols);
            cols = null;
          };
        
        if(table.config.debug) { benchmark("Built cache for " + totalRows + " rows", cacheTime); }
        
        return cache;
      };
      
      function getElementText(config,node) {
        
        if(!node) return "";
                
        var t = "";
        
        if(config.textExtraction == "simple") {
          if(node.childNodes[0] && node.childNodes[0].hasChildNodes()) {
            t = node.childNodes[0].innerHTML;
          } else {
            t = node.innerHTML;
          }
        } else {
          if(typeof(config.textExtraction) == "function") {
            t = config.textExtraction(node);
          } else { 
            t = $(node).text();
          } 
        }
        return t;
      }
      
      function appendToTable(table,cache) {
        
        if(table.config.debug) {var appendTime = new Date()}
        
        var c = cache, 
          r = c.row, 
          n= c.normalized, 
          totalRows = n.length, 
          tableBody = $(table.tBodies[0]),
          rows = [];
        
        if (totalRows > 0) {
          var checkCell = (n[0].length-1);
          
          for (var i=0;i < totalRows; i++) {
            rows.push(r[n[i][checkCell]]);  
            if(!table.config.appender) {
            
              var o = r[n[i][checkCell]];
              var l = o.length;
              for(var j=0; j < l; j++) {
              
                tableBody[0].appendChild(o[j]);
            
              }
            
              //tableBody.append(r[n[i][checkCell]]);
            }
          }
        } 
        
        if(table.config.appender) {
        
          table.config.appender(table,rows);  
        }
        
        rows = null;
        
        if(table.config.debug) { benchmark("Rebuilt table", appendTime); }
                
        //apply table widgets
        applyWidget(table);
        
        // trigger sortend
        setTimeout(function() {
          $(table).trigger("sortEnd");  
        },0);
        
      };
      
      function buildHeaders(table) {
        
        if(table.config.debug) { var time = new Date(); }
        
        var meta = ($.metadata) ? true : false, tableHeadersRows = [];
      
        for(var i = 0; i < table.tHead.rows.length; i++) { tableHeadersRows[i]=0; };
        
        $tableHeaders = $("thead th",table);
    
        $tableHeaders.each(function(index) {
              
          this.count = 0;
          this.column = index;
          this.order = formatSortingOrder(table.config.sortInitialOrder);
          
          if(checkHeaderMetadata(this) || checkHeaderOptions(table,index)) this.sortDisabled = true;
          
          if(!this.sortDisabled) {
            $(this).addClass(table.config.cssHeader);
          }
          
          // add cell to headerList
          table.config.headerList[index]= this;
        });
        
        if(table.config.debug) { benchmark("Built headers", time); log($tableHeaders); }
        
        return $tableHeaders;
        
      };
            
        function checkCellColSpan(table, rows, row) {
                var arr = [], r = table.tHead.rows, c = r[row].cells;
        
        for(var i=0; i < c.length; i++) {
          var cell = c[i];
          
          if ( cell.colSpan > 1) { 
            arr = arr.concat(checkCellColSpan(table, headerArr,row++));
          } else  {
            if(table.tHead.length == 1 || (cell.rowSpan > 1 || !r[row+1])) {
              arr.push(cell);
            }
            //headerArr[row] = (i+row);
          }
        }
        return arr;
      };
      
      function checkHeaderMetadata(cell) {
        if(($.metadata) && ($(cell).metadata().sorter === false)) { return true; };
        return false;
      }
      
      function checkHeaderOptions(table,i) {  
        if((table.config.headers[i]) && (table.config.headers[i].sorter === false)) { return true; };
        return false;
      }
      
      function applyWidget(table) {
        var c = table.config.widgets;
        var l = c.length;
        for(var i=0; i < l; i++) {
          
          getWidgetById(c[i]).format(table);
        }
        
      }
      
      function getWidgetById(name) {
        var l = widgets.length;
        for(var i=0; i < l; i++) {
          if(widgets[i].id.toLowerCase() == name.toLowerCase() ) {
            return widgets[i]; 
          }
        }
      };
      
      function formatSortingOrder(v) {
        
        if(typeof(v) != "Number") {
          i = (v.toLowerCase() == "desc") ? 1 : 0;
        } else {
          i = (v == (0 || 1)) ? v : 0;
        }
        return i;
      }
      
      function isValueInArray(v, a) {
        var l = a.length;
        for(var i=0; i < l; i++) {
          if(a[i][0] == v) {
            return true;  
          }
        }
        return false;
      }
        
      function setHeadersCss(table,$headers, list, css) {
        // remove all header information
        $headers.removeClass(css[0]).removeClass(css[1]);
        
        var h = [];
        $headers.each(function(offset) {
            if(!this.sortDisabled) {
              h[this.column] = $(this);         
            }
        });
        
        var l = list.length; 
        for(var i=0; i < l; i++) {
          var header = list[i];
          var headerIndex = findInMap(table.config.customMap,header[0],true);
          for (var j=0;j< headerIndex.length;j++) {
            h[headerIndex[j]].addClass(css[header[1]]);
          }
        }
      }
      
      function fixColumnWidth(table,$headers) {
        var c = table.config;
        if(c.widthFixed) {
          var colgroup = $('<colgroup>');
          $("tr:first td",table.tBodies[0]).each(function() {
            colgroup.append($('<col>').css('width',$(this).width()));
          });
          $(table).prepend(colgroup);
        };
      }
      
      function updateHeaderSortCount(table,sortList) {
        var c = table.config, l = sortList.length;
        for(var i=0; i < l; i++) {
          var s = sortList[i], o = c.headerList[s[0]];
          o.count = s[1];
          o.count++;
        }
      }
      
      /* sorting methods */
      function multisort(table,sortList,cache) {
        
        if(table.config.debug) { var sortTime = new Date(); }
        
        var dynamicExp = "var sortWrapper = function(a,b) {", l = sortList.length;
          
        for(var i=0; i < l; i++) {
          
          var c = sortList[i][0];
          var order = sortList[i][1];
          var s = (getCachedSortType(table.config.parsers,c) == "text") ? ((order == 0) ? "sortText" : "sortTextDesc") : ((order == 0) ? "sortNumeric" : "sortNumericDesc");
          
          var e = "e" + i;
          
          dynamicExp += "var " + e + " = " + s + "(a[" + c + "],b[" + c + "]); ";
          dynamicExp += "if(" + e + ") { return " + e + "; } ";
          dynamicExp += "else { ";
        }
        
        // if value is the same keep orignal order  
        var orgOrderCol = cache.normalized[0].length - 1;
        dynamicExp += "return a[" + orgOrderCol + "]-b[" + orgOrderCol + "];";
            
        for(var i=0; i < l; i++) {
          dynamicExp += "}; ";
        }
        
        dynamicExp += "return 0; "; 
        dynamicExp += "}; ";  
        
        eval(dynamicExp);
        
        cache.normalized.sort(sortWrapper);
        
        if(table.config.debug) { benchmark("Sorted " + sortList.toString(), sortTime); }
        
        return cache;
      };
      
      function sortText(a,b) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0));
      };
      
      function sortTextDesc(a,b) {
        return ((b < a) ? -1 : ((b > a) ? 1 : 0));
      };  
      
      function sortNumeric(a,b) {
        return a-b;
      };
      
      function sortNumericDesc(a,b) {
        return b-a;
      };
      
      function getCachedSortType(parsers,i) {
        return parsers[i].type;
      };
      
      /* public methods */
      this.construct = function(settings) {

        return this.each(function() {
          
          if(!this.tHead || !this.tBodies) return;
          
          var $this, $document,$headers, cache, config, shiftDown = 0, sortOrder;
          
          this.config = {};
          
          config = $.extend(this.config, $.tablesorter.defaults, settings);
          
          // store common expression for speed          
          $this = $(this);
          
          // build headers
          $headers = buildHeaders(this);
          
          
          this.config.customMap = detectColspan(this);
          
          // try to auto detect column type, and store in tables config
          this.config.parsers = buildParserCache(this,$headers);
          
          
          // build the cache for the tbody cells
          cache = buildCache(this);
          
          // store a copy of the original cache of all rows
          this.config.cache = cache;
          
          // get the css class names, could be done else where.
          var sortCSS = [config.cssDesc,config.cssAsc];
          
          // fixate columns if the users supplies the fixedWidth option
          fixColumnWidth(this);
          
          // apply event handling to headers
          // this is to big, perhaps break it out?
          $headers.click(function(e) {
            
            $this.trigger("sortStart");
            
            var totalRows = ($this[0].tBodies[0] && $this[0].tBodies[0].rows.length) || 0;
            if(!this.sortDisabled && totalRows > 0) {
              
              
              // store exp, for speed
              var $cell = $(this);
  
              // get current column index
              var i = this.column;
              
              // get current column sort order
              this.order = this.count++ % 2;
              
              // user only wants to sort on one column
              if(!e[config.sortMultiSortKey]) {
                
                // flush the sort list
                config.sortList = [];
                
                if(config.sortForce != null) {
                  var a = config.sortForce; 
                  for(var j=0; j < a.length; j++) {
                    if(a[j][0] != i) {
                      config.sortList.push(a[j]);
                    }
                  }
                }
                var ia = findInMap(config.customMap, i, false);
                for (var kk = 0; kk< ia.length; ++kk) {
                  config.sortList.push([ia[kk],this.order]);
                }
                
              // multi column sorting
              } else {
                // the user has clicked on an all ready sortet column.
                if(isValueInArray(i,config.sortList)) {  
                  
                  // revers the sorting direction for all tables.
                  for(var j=0; j < config.sortList.length; j++) {
                    var s = config.sortList[j], o = config.headerList[s[0]];
                    if(s[0] == i) {
                      o.count = s[1];
                      o.count++;
                      s[1] = o.count % 2;
                    }
                  } 
                } else {
                  // add column to sort list array

                  var ia = findInMap(config.customMap, i, false);
                  for (var kk = 0; kk< ia.length; ++kk) {
                    config.sortList.push([ia[kk],this.order]);
                  }
                }
              };
              setTimeout(function() {
                //set css for headers
                setHeadersCss($this[0],$headers,config.sortList,sortCSS);
                appendToTable($this[0],multisort($this[0],config.sortList,cache));
              },1);
              // stop normal event by returning false
              return false;
            }
          // cancel selection 
          }).mousedown(function() {
            if(config.cancelSelection) {
              this.onselectstart = function() {return false};
              return false;
            }
          });
          
          // apply easy methods that trigger binded events
          $this.bind("update",function() {
            
            // rebuild parsers.
            this.config.parsers = buildParserCache(this,$headers);
            
            // rebuild the cache map
            cache = buildCache(this);
            
          }).bind("sorton",function(e,list) {
            
            $(this).trigger("sortStart");
            
            config.sortList = list;
            
            // update and store the sortlist
            var sortList = config.sortList;
            
            // update header count index
            updateHeaderSortCount(this,sortList);
            
            //set css for headers
            setHeadersCss(this,$headers,sortList,sortCSS);
            
            
            // sort the table and append it to the dom
            appendToTable(this,multisort(this,sortList,cache));

          }).bind("appendCache",function() {
            
            appendToTable(this,cache);
          
          }).bind("applyWidgetId",function(e,id) {
            
            getWidgetById(id).format(this);
            
          }).bind("applyWidgets",function() {
            // apply widgets
            applyWidget(this);
          });
          
          if($.metadata && ($(this).metadata() && $(this).metadata().sortlist)) {
            config.sortList = $(this).metadata().sortlist;
          }
          // if user has supplied a sort list to constructor.
          if(config.sortList.length > 0) {
            $this.trigger("sorton",[config.sortList]);  
          }
          
          // apply widgets
          applyWidget(this);
        });
      };
      
      this.addParser = function(parser) {
        var l = parsers.length, a = true;
        for(var i=0; i < l; i++) {
          if(parsers[i].id.toLowerCase() == parser.id.toLowerCase()) {
            a = false;
          }
        }
        if(a) { parsers.push(parser); };
      };
      
      this.addWidget = function(widget) {
        widgets.push(widget);
      };
      
      this.formatFloat = function(s) {
        var i = parseFloat(s);
        return (isNaN(i)) ? 0 : i;
      };
      this.formatInt = function(s) {
        var i = parseInt(s);
        return (isNaN(i)) ? 0 : i;
      };
      
      this.isDigit = function(s,config) {
        var DECIMAL = '\\' + config.decimal;
        var exp = '/(^[+]?0(' + DECIMAL +'0+)?$)|(^([-+]?[1-9][0-9]*)$)|(^([-+]?((0?|[1-9][0-9]*)' + DECIMAL +'(0*[1-9][0-9]*)))$)|(^[-+]?[1-9]+[0-9]*' + DECIMAL +'0+$)/';
        return RegExp(exp).test($.trim(s));
      };
      
      this.clearTableBody = function(table) {
        if($.browser.msie) {
          function empty() {
            while ( this.firstChild ) this.removeChild( this.firstChild );
          }
          empty.apply(table.tBodies[0]);
        } else {
          table.tBodies[0].innerHTML = "";
        }
      };
    }
  });
  
  // extend plugin scope
  $.fn.extend({
        tablesorter: $.tablesorter.construct
  });
  
  var ts = $.tablesorter;
  
  // add default parsers
  ts.addParser({
    id: "text",
    is: function(s) {
      return true;
    },
    format: function(s) {
      return $.trim(s.toLowerCase());
    },
    type: "text"
  });
  
  ts.addParser({
    id: "digit",
    is: function(s,table) {
      var c = table.config;
      return $.tablesorter.isDigit(s,c);
    },
    format: function(s) {
      return $.tablesorter.formatFloat(s);
    },
    type: "numeric"
  });
  
  ts.addParser({
    id: "currency",
    is: function(s) {
      return /^[£$€?.]/.test(s);
    },
    format: function(s) {
      return $.tablesorter.formatFloat(s.replace(new RegExp(/[^0-9.]/g),""));
    },
    type: "numeric"
  });
  
  ts.addParser({
    id: "ipAddress",
    is: function(s) {
      return /^\d{2,3}[\.]\d{2,3}[\.]\d{2,3}[\.]\d{2,3}$/.test(s);
    },
    format: function(s) {
      var a = s.split("."), r = "", l = a.length;
      for(var i = 0; i < l; i++) {
        var item = a[i];
          if(item.length == 2) {
          r += "0" + item;
          } else {
          r += item;
          }
      }
      return $.tablesorter.formatFloat(r);
    },
    type: "numeric"
  });
  
  ts.addParser({
    id: "url",
    is: function(s) {
      return /^(https?|ftp|file):\/\/$/.test(s);
    },
    format: function(s) {
      return jQuery.trim(s.replace(new RegExp(/(https?|ftp|file):\/\//),''));
    },
    type: "text"
  });
  
  ts.addParser({
    id: "isoDate",
    is: function(s) {
      return /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(s);
    },
    format: function(s) {
      return $.tablesorter.formatFloat((s != "") ? new Date(s.replace(new RegExp(/-/g),"/")).getTime() : "0");
    },
    type: "numeric"
  });
    
  ts.addParser({
    id: "percent",
    is: function(s) { 
      return /\%$/.test($.trim(s));
    },
    format: function(s) {
      return $.tablesorter.formatFloat(s.replace(new RegExp(/%/g),""));
    },
    type: "numeric"
  });

  ts.addParser({
    id: "usLongDate",
    is: function(s) {
      return s.match(new RegExp(/^[A-Za-z]{3,10}\.? [0-9]{1,2}, ([0-9]{4}|'?[0-9]{2}) (([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9]\s(AM|PM)))$/));
    },
    format: function(s) {
      return $.tablesorter.formatFloat(new Date(s).getTime());
    },
    type: "numeric"
  });

  ts.addParser({
    id: "shortDate",
    is: function(s) {
      return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(s);
    },
    format: function(s,table) {
      var c = table.config;
      s = s.replace(/\-/g,"/");
      if(c.dateFormat == "us") {
        // reformat the string in ISO format
        s = s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, "$3/$1/$2");
      } else if(c.dateFormat == "uk") {
        //reformat the string in ISO format
        s = s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, "$3/$2/$1");
      } else if(c.dateFormat == "dd/mm/yy" || c.dateFormat == "dd-mm-yy") {
        s = s.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/, "$1/$2/$3"); 
      }
      return $.tablesorter.formatFloat(new Date(s).getTime());
    },
    type: "numeric"
  });

  ts.addParser({
      id: "time",
      is: function(s) {
          return /^(([0-2]?[0-9]:[0-5][0-9])|([0-1]?[0-9]:[0-5][0-9]\s(am|pm)))$/.test(s);
      },
      format: function(s) {
          return $.tablesorter.formatFloat(new Date("2000/01/01 " + s).getTime());
      },
    type: "numeric"
  });
  
  
  ts.addParser({
      id: "metadata",
      is: function(s) {
          return false;
      },
      format: function(s,table,cell) {
      var c = table.config, p = (!c.parserMetadataName) ? 'sortValue' : c.parserMetadataName;
          return $(cell).metadata()[p];
      },
    type: "numeric"
  });
  
  // add default widgets
  ts.addWidget({
    id: "zebra",
    format: function(table) {
      if(table.config.debug) { var time = new Date(); }
      $("tr:visible",table.tBodies[0])
          .filter(':even')
          .removeClass(table.config.widgetZebra.css[1]).addClass(table.config.widgetZebra.css[0])
          .end().filter(':odd')
          .removeClass(table.config.widgetZebra.css[0]).addClass(table.config.widgetZebra.css[1]);
      if(table.config.debug) { $.tablesorter.benchmark("Applied Zebra widget", time); }
    }
  }); 
})(jQuery);



/*
 * Copyright (c) 2008 Justin Britten justinbritten at gmail.com
 *
 * Some code was borrowed from:
 * 1. Greg Weber's uiTableFilter project (http://gregweber.info/projects/uitablefilter)
 * 2. Denny Ferrassoli & Charles Christolini's TypeWatch project (www.dennydotnet.com)
 *
 * Contributions have been made by:
 * René Leonhardt (github.com/rleonhardt)
 * Thomas Kappler (github.com/thomas11)
 *
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */


(function($) {
  $.extend({
    tablesorterFilter: new function() {

      // Default filterFunction implementation (element text, search words, case-sensitive flag)
      function has_words(str, words, caseSensitive) {
        var text = caseSensitive ? str : str.toLowerCase();

        for (var i=0; i < words.length; i++) {
          if (words[i].charAt(0) == '-') {
            if (text.indexOf(words[i].substr(1)) != -1) return false; // Negated word must not be in text
          } else if (text.indexOf(words[i]) == -1) return false; // Normal word must be in text
        }

        return true;
      }


      function doFilter(table) {
        if(table.config.debug) { var cacheTime = new Date(); }

        // Build multiple filters from input boxes
        // TODO: enable incremental filtering by caching result and applying only single filter action
        var filters = [];

      	// Implement dynamic selection of a filter column
      	// by setting filter.filterColumns based on the user's
      	// query. That means we have to restore the base configuration
      	// of filterColumns after processing the query.
	      var defaultFilterColumns = [];

        for(var i=0; i < table.config.filter.length; i++) {
          var filter = table.config.filter[i];
          var container = $(filter.filterContainer);

	        // Record the base setting of filtered columns to
	        // be able to restore it later, see above.
          defaultFilterColumns[i] = filter.filterColumns;

          // Trim and unify whitespace before splitting
          var phrase = jQuery.trim(container.val()).replace(/\s+/g, ' ');
          if(phrase.length != 0) {

            // Check for a 'col:' prefix.
            var field_prefix = /^([a-zA-Z]+):(.+)/;
            var match = field_prefix.exec(phrase);
            if (match !== null) {
              // The user wants to filter based on a
              // certain column. Find the index of that column and
              // set filterColumns accordingly.
              var field = match[1];
              phrase = match[2];
              for (var k=0; k < filter.columns.length; k++) {
                if (filter.columns[k].indexOf(field) === 0) {
                  filter.filterColumns = [k];
                  break;
                }
              }
	          }

            var caseSensitive = filter.filterCaseSensitive;
            filters.push({
              caseSensitive: caseSensitive,
              words: caseSensitive ? phrase.split(" ") : phrase.toLowerCase().split(" "),
              findStr: filter.filterColumns ? "td:eq(" + filter.filterColumns.join("),td:eq(") + ")" : "",
              filterFunction: filter.filterFunction
            });
          }

	        // Restore the base setting of filtered columns
          filter.filterColumns = defaultFilterColumns[i];
        }
        var filterCount = filters.length;

        // Filter cleared?
        if(filterCount == 0) {
          var search_text = function() {
            var elem = jQuery(this);
            resultRows[resultRows.length] = elem;
          }
        } else {
          var search_text = function() {
            var elem = jQuery(this);
            for(var i=0; i < filterCount; i++) {
              if(! filters[i].filterFunction(
		     (filters[i].findStr ? elem.find(filters[i].findStr) : elem).text(),
		     filters[i].words,
		     filters[i].caseSensitive) ) {
                return true; // Skip elem and continue to next element
              }
            }
            resultRows[resultRows.length] = elem;
          }
        }

        // Walk through all of the table's rows and search.
        // Rows which match the string will be pushed into the resultRows array.
        var allRows = table.config.cache.row;
        var resultRows = [];

        var allRowsCount = allRows.length;
        for (var i=0; i < allRowsCount; i++) {
          allRows[i].each ( search_text );
        }

        // Clear the table
        $.tablesorter.clearTableBody(table);

        // Push all rows which matched the search string onto the table for display.
        var resultRowsCount = resultRows.length;
        for (var i=0; i < resultRowsCount; i++) {
          $(table.tBodies[0]).append(resultRows[i]);
        }

        // Update the table by executing some of tablesorter's triggers
        // This will apply any widgets or pagination, if used.
        $(table).trigger("update");
        if (resultRows.length) {
          $(table).trigger("appendCache");
          // Apply current sorting after restoring rows
          $(table).trigger("sorton", [table.config.sortList]);
        }

        if(table.config.debug) { $.tablesorter.benchmark("Apply filter:", cacheTime); }

        // Inform subscribers that filtering finished
        $(table).trigger("filterEnd");

        return table;
      };

      function clearFilter(table) {
        if(table.config.debug) { var cacheTime = new Date(); }

        // Reset all filter values
        for(var i=0; i < table.config.filter.length; i++)
          $(table.config.filter[i].filterContainer).val('').get(0).lastValue = '';

        var allRows = table.config.cache.row;

        $.tablesorter.clearTableBody(table);

        for (var i=0; i < allRows.length; i++) {
          $(table.tBodies[0]).append(allRows[i]);
        }

        $(table).trigger("update");
        $(table).trigger("appendCache");
        // Apply current sorting after restoring all rows
        $(table).trigger("sorton", [table.config.sortList]);

        if(table.config.debug) { $.tablesorter.benchmark("Clear filter:", cacheTime); }

        $(table).trigger("filterCleared");

        return table;
      };

      this.defaults = {
        filterContainer: '#filter-box',
        filterClearContainer: '#filter-clear-button',
        filterColumns: null,
        filterCaseSensitive: false,
        filterWaitTime: 500,
        filterFunction: has_words,
	      columns: []
      };


      this.construct = function() {
        var settings = arguments; // Allow multiple config objects in constructor call

        return this.each(function() {
          this.config.filter = new Array(settings.length);
          var config = this.config;
          config.filter = new Array(settings.length);

          for (var i = 0; i < settings.length; i++)
            config.filter[i] = $.extend(this.config.filter[i], $.tablesorterFilter.defaults, settings[i]);

          var table = this;

          // Create a timer which gets reset upon every keyup event.
          //
          // Perform filter only when the timer's wait is reached (user finished typing or paused long enough to elapse the timer).
          //
          // Do not perform the filter is the query has not changed.
          //
          // Immediately perform the filter if the ENTER key is pressed.

          function checkInputBox(inputBox, override) {
            var value = inputBox.value;

            if ((value != inputBox.lastValue) || (override)) {
              inputBox.lastValue = value;
              doFilter( table );
            }
          };

          var timer = new Array(settings.length);

          for (var i = 0; i < settings.length; i++) {
            var container = $(config.filter[i].filterContainer);
            // TODO: throw error for non-existing filter container?
            if(container.length)
              container[0].filterIndex = i;
            container.keyup(function(e, phrase) {
              var index = this.filterIndex;
              if(undefined !== phrase)
                $(this).val(phrase);
              var inputBox = this;

              // Was ENTER pushed?
              if (inputBox.keyCode == 13 || undefined !== phrase) {
                var timerWait = 1;
                var overrideBool = true;
              } else {
                var timerWait = config.filter[index].filterWaitTime || 500;
                var overrideBool = false;
              }

              var timerCallback = function() {
                checkInputBox(inputBox, overrideBool);
              }

              // Reset the timer
              clearTimeout(timer[index]);
              timer[index] = setTimeout(timerCallback, timerWait);

              return false;
            });

            // Avoid binding click event to whole document if no clearContainer has been defined
            if(config.filter[i].filterClearContainer) {
              var container = $(config.filter[i].filterClearContainer);
              if(container.length) {
                container[0].filterIndex = i;
                container.click(function() {
                  var index = this.filterIndex;
                  var container = $(config.filter[index].filterContainer);
                  container.val("");
                  // Support entering the same filter text after clearing
                  container[0].lastValue = "";
                  // TODO: Clear single filter only
                  doFilter(table);
                  if(container[0].type != 'hidden')
                    container.focus();
                });
              }
            }
          }

          $(table).bind("doFilter",function() {
            doFilter(table);
          });
          $(table).bind("clearFilter",function() {
            clearFilter(table);
          });
        });
      };

    }
  });

  // extend plugin scope
  $.fn.extend({
    tablesorterFilter: $.tablesorterFilter.construct
  });

})(jQuery);



/*
   Based on the jQuery plugin found at http://www.kunalbabre.com/projects/TableCSVExport.php
   Re-worked by ZachWick for LectureTools Inc. Sept. 2011
   Copyright (c) 2011 LectureTools Inc.

   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
jQuery.fn.TableCSVExport = function(options) {
    var options = jQuery.extend({
        separator: ',',
        header: [],
        columns: [],
        extraHeader: "",
  extraData: [],
  insertBefore: "",
        delivery: 'popup' /* popup, value, download */
    },
    options);

    var csvData = [];
    var headerArr = [];
    var el = this;
    var basic = options.columns.length == 0 ? true : false;
    var columnNumbers = [];
    var columnCounter = 0;
    var insertBeforeNum = null;
    //header
    var numCols = options.header.length; 
    var tmpRow = []; // construct header avalible array
   
    if (numCols > 0) {
       if (basic) {
          for (var i = 0; i < numCols; i++) {
        if (options.header[i] == options.insertBefore) {
      tmpRow[tmpRow.length] = options.extraHeader;
      insertBeforeNum = i;
        }
             tmpRow[tmpRow.length] = formatData(options.header[i]);
          }
       } else if (!basic) {
          for (var o = 0; o < numCols; o++) {
             for (var i = 0; i < options.columns.length; i++) {
                if (options.columns[i] == options.header[o]) {
                   if (options.columns[i] == options.insertBefore) {
          tmpRow[tmpRow.length] = options.extraHeader;
                      insertBeforeNum = o;
       }
                   tmpRow[tmpRow.length] = formatData(options.header[o]);
       columnNumbers[columnCounter] = o;
       columnCounter++;
                }
             }
          }       
       }
    } else {
       jQuery(el).filter(':visible').find('th').each(function() {
          if (jQuery(this).css('display') != 'none') tmpRow[tmpRow.length] = formatData(jQuery(this).html());
       });
    }

    row2CSV(tmpRow);

    // actual data
    if (basic) {
       var trCounter = 0;
       jQuery(el).find('tr').each(function() {
           var tmpRow = [];
     var extraDataCounter = 0;
           jQuery(this).filter(':visible').find('td').each(function() {
              if (extraDataCounter == insertBeforeNum) {
      tmpRow[tmpRow.length] = jQuery.trim(options.extraData[trCounter-1]);
        }
              if (jQuery(this).css('display') != 'none') {
      if (jQuery(this).html() == "") {
          tmpRow[tmpRow.length] = formatData("0");
      } else if (jQuery(this).html() == " ") {
          tmpRow[tmpRow.length] = formatData("0");
                  } else {
                     tmpRow[tmpRow.length] = jQuery.trim(formatData(jQuery(this).html()));
      }
              }
              extraDataCounter++;
           });
           row2CSV(tmpRow);
           trCounter++;
       });
    } else {
       var trCounter = 0;
       jQuery(el).find('tr').each(function() {
          var tmpRow = [];
          var columnCounter = 0;
    var extraDataCounter = 0;
          jQuery(this).filter(':visible').find('td').each(function() {
       if ((columnCounter in columnNumbers) && (extraDataCounter == insertBeforeNum)) {
    tmpRow[tmpRow.length] = jQuery.trim(options.extraData[trCounter - 1]); 
       }
             if ((jQuery(this).css('display') != 'none') && (columnCounter in columnNumbers)) {
                tmpRow[tmpRow.length] = jQuery.trim(formatData(jQuery(this).html()));
             }
             columnCounter++;
       extraDataCounter++;
          });
          row2CSV(tmpRow);
           trCounter++;
       });
    }
    if ((options.delivery == 'popup')||(options.delivery == 'download')) {
        var mydata = csvData.join('\n');
        return popup(mydata);
    } else {
        var mydata = csvData.join('\n');
        return mydata;
    }

    function row2CSV(tmpRow) {
        var tmp = tmpRow.join('') // to remove any blank rows
        // alert(tmp);
        if (tmpRow.length > 0 && tmp != '') {
            var mystr = tmpRow.join(options.separator);
            csvData[csvData.length] = jQuery.trim(mystr);
        }
    }
    function formatData(input) {
        // replace " with “
        var regexp = new RegExp(/["]/g);
        var output = input.replace(regexp, "“");
        //HTML
        var regexp = new RegExp(/\<[^\<]+\>/g);
        var output = output.replace(regexp, "");
        if (output == "") return '';
        return '' + output + '';
    }
    function popup(data) {
  if (options.delivery == 'download') {
           window.location='data:text/csv;charset=utf8,' + encodeURIComponent(data);
           return true;
  } else {
           var generator = window.open('', 'csv', 'height=400,width=600');
           generator.document.write('<html><head><title>CSV</title>');
           generator.document.write('</head><body >');
           generator.document.write('<textArea cols=70 rows=15 wrap="off" >');
           generator.document.write(data);
           generator.document.write('</textArea>');
           generator.document.write('</body></html>');
           generator.document.close();
           return true;
  }
    }
};