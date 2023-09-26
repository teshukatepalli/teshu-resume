(function ($) {    
    var key = 'AIzaSyCURGXRZBgz2s3W-6so4IgOMN0rgHAxSiE';
    var backup_key='AIzaSyBRHZgV4m-UEkeTI-wQ6atm98mbRORRoC8';
    
    var cx = '014265508736140407423:xprb1h8n3x0'; //ssi cse id
    var client_id = 'ald';
   
    var errors = 0;
   
    var btn, inp, inp2, frm, results=-1, num=10, ajaxBusy=0;    
    var body = $('body');
    
    var w = $(window);
    var search = $('#custom-search');
    var header = $('#header');
    var moveW = 961;  
    
    var isTouch = (('ontouchstart' in window) || (window.DocumentTouch && document instanceof DocumentTouch));
    
    function closeResults(){
        inp.val('').blur();
        results.box.empty();
        results.removeClass('active');
        body.removeClass('mmg-search-active');
        $('html').css({height:'', overflow:''});  
    }
    
    function doSearch(params){
       
        if(ajaxBusy) return false;
        
        if (typeof params === 'undefined')
            params = {isBlog: 0, start: 0};
            
        if (typeof params.isBlog === 'undefined')
            params.isBlog = 0;
        if (typeof params.start === 'undefined')
            params.start = 0; 
            
        var data = {q: inp.val().trim(), 'key': key, 'cx': cx}
        data.q = data.q.replace(/\</g,"").replace(/\>/g,"").replace(/\(/g,"").replace(/\)/g,"");

        if (params.start>0)
            data.start = params.start;
        
        /*
        var blogonly = $('#mmg-gcse-blogonly');
        
        if (blogonly.length) {
            params.isBlog = blogonly.is(':checked') ? 1 : 0;
        } else {
            params.isBlog = body.hasClass('hs-blog-id-1343387723') ? 1 : 0;
        }

        if (params.isBlog) {
            data.siteSearch = 'http://www.suttle-straus.com/blog';
        } else {
            //use it to exclude some area from search
            //data.siteSearch = 'www.aldevron.com/some-url/';
            //data.siteSearchFilter = 'e';
        }  
        */
            
        ajaxBusy = 1;    
            
        if (results === -1) {
            results = $('<div id="mmg-gcse"></div>');
            results.tools = $('<div class="mmg-gcse-outer"></div>').appendTo(results).wrap('<div id="mmg-gcse-tools"></div>');
            results.box = $('<div class="mmg-gcse-outer"></div>').appendTo(results).wrap('<div id="mmg-gcse-box"></div>');
            
            /*
            var search2 = $('<div id="custom-search-2"></div>').appendTo(results.tools);
            
            inp2 = $('<input type="text" id="customsearch-q2" placeholder="Search text..." value="">').appendTo(search2).keypress(function(e){
                if (e.keyCode == 13 && inp2.val().trim()) {
                    e.preventDefault(); inp.val(inp2.val());            
                    doSearch();
                }
            });            
            var btn2 = $('<span class="icon-search"></span>').appendTo(search2).click(function(e){
                if (inp2.val().trim()) {
                    e.preventDefault(); inp.val(inp2.val()); 
                    doSearch();
                }
            });
            */
            
            var close = $('<span class="close-btn">&times</span>').click(function(e){
                closeResults();
            }).appendTo(results.tools);
            
            $( document ).on('keydown', function ( e ) {
                if ( e.keyCode == 27 ) closeResults(); //ESC button
            });
            
            results.box.append('<h2 class="search-title">Search for: '+data.q+'</h2>');
            var loading = $('<p>Searching...</p>').appendTo(results.box); 
            
            results.appendTo($('body'));
        }
        
        if (!results.hasClass('active')) {
            $('html').css({height:'100%', overflow:'hidden'});
            body.addClass('mmg-search-active');
            results.css({height: (w.height()-header.height())});
            inp.blur(); /*inp2.val(data.q);*/                            
            results.addClass('active');            
        }
            
        var url = 'https://www.googleapis.com/customsearch/v1';
            
        //ajaxBusy=0; return false;   
        results.box.fadeTo('fast', 0.5);
        results.box.parent().animate({scrollTop: 0});
            
        $.getJSON(url, data).done(function(json) {
            //console.log( json.items );
            
            var total = json.searchInformation.totalResults;
            
            results.box.empty();    
            results.box.append('<h2 class="search-title">'+(params.isBlog? 'Blog ':'')+'Search for: '+data.q+'</h2>');
        
            //var htmlOnly = '<p class="mmg-gcse-blogonly-text"><label><input type="checkbox" name="mmg-gcse-blogonly" id="mmg-gcse-blogonly" value="1" '+(params.isBlog? 'checked':'')+'>Search Blog Only</label></p>';
            //results.box.append(htmlOnly);
                
            setTimeout(function(){
                $('#mmg-gcse-blogonly').change(function(){ doSearch(); }); 
            }, 0);
            
            if(total>0) {
                var t = total + (total==1 ? ' item' : ' items') + ' found';
                
                if (total>10)
                    t = 'Results '+json.queries.request[0].startIndex+'-'+Math.min(json.queries.request[0].startIndex+9, total)+' out of ' + t;
                
                results.box.append('<p class="search-info">'+t+'</p>');
            
                for (var i = 0; i < json.items.length; i++) {                    
                    var item = $('<a class="item" href="'+json.items[i].link+'"><span class="title">'+json.items[i].title+'</span>'+json.items[i].htmlSnippet+'</a>').appendTo(results.box);
                    var temp = item.find('b');
                    if (temp.length && $(temp[0]).text().trim() == '...')
                            temp.remove();
                }            
            } else {
                results.box.append('<p class="search-info">Your search did not match any documents.</p>');                
            }
            
            if (total>10) {
                var pages = $('<div class="pagination"></div>').appendTo(results.box);                
                var prev = $('<span class="prev">< Prev</span>').appendTo(pages);
                
                if (typeof json.queries.previousPage === 'undefined') {
                    prev.addClass('disabled');
                } else {
                    prev.click(function(e){
                        e.preventDefault();
                        doSearch({start: json.queries.previousPage[0].startIndex});                        
                    });
                }
                
                var start = 0;
                var end = Math.ceil(total/10);
                
                if (total>70) {
                    var current = Math.floor(json.queries.request[0].startIndex/10);
                    start = Math.max(current-3,0);
                    end = start+7;
                }
                
                for (var p = start; p < end; p++) {                    
                    var page = $('<span class="page">'+(p+1)+'</span>').appendTo(pages).click(function(e){
                        e.preventDefault();
                        var num = parseInt($(this).text());
                        doSearch({start: (num-1)*10+1});
                    });
                    
                    if (json.queries.request[0].startIndex === p*10+1)
                        page.addClass('active');
                }    
                
                var next = $('<span class="next">Next ></span>').appendTo(pages);
                
                if (typeof json.queries.nextPage === 'undefined') {
                    next.addClass('disabled');
                } else {
                    next.click(function(e){
                        e.preventDefault();
                        doSearch({start: json.queries.nextPage[0].startIndex});                        
                    });
                }
            }           
                       
            ajaxBusy = 0; results.box.fadeTo('fast', 1);
            
        }).fail(function( jqxhr, textStatus, error ) {            
            
            if (jqxhr.responseText.indexOf('error') != -1) {
                errors++;
                
                if (errors < 2) {
                    var json = $.parseJSON(jqxhr.responseText); 
                    
                    $.ajax({ url: 'http://app.murvine.com/mmg-gcse-notifier/', data: {cid: client_id, msg: json.error.code + ' ' +  json.error.message} });
                    
                    key = backup_key; ajaxBusy = 0; doSearch(params); 
                    
                    return;
                } else {
                    $.ajax({ url: 'http://app.murvine.com/mmg-gcse-notifier/', data: {cid: client_id, msg: 'Backup API Key Limit Exceeded'} });    
                }
                
            }
            
            loading.remove();
            $("<p>An error has occurred, please try again later.</p>").appendTo(results.box);                
            
            ajaxBusy = 0; results.box.fadeTo('fast', 1);
        });  
    }
    
    $(document).ready(function(){
	
	});  
    
    w.on('load resize', function(){        
        if (w.width()<moveW) {
            if (!search.hasClass('moved')) {
                $('#logo').after(search);
                search.addClass('moved');                
            }           
        } else {
            if (search.hasClass('moved')) {
                $('#header-info').prepend(search);
                search.removeClass('moved');                
            }                        
        }        
    });
    
    w.on('load resize', function(){        
        if (results !==-1 && results.length) {
            results.css({height: (w.height()-header.height())});        
        }
    });

	w.load(function(){
        
        if (search.length) {                
            
            search.css('display','');
            
            btn = search.find('span');               
            inp = search.find('input');
            frm = search.find('form');
            
            btn.click(function(e){
                e.preventDefault();
                
                if (search.hasClass('active')) {
                    if (inp.val().trim()) {
                        doSearch();
                    } else {
                        inp.hide('fast', function(){
                            search.removeClass('active');
                        });    
                    }                        
                } else {
                    search.addClass('active');    
                    inp.show('fast').focus();
                }
            });
            
            inp.blur(function(){
                if (!inp.val().trim())
                    inp.hide('fast', function(){ search.removeClass('active'); });                    
            });
            
            frm.submit(function(e){
                doSearch(); return false;
            });
        }        
	});
})(jQuery);