( function(){

    //////////////////////////////////////////////////////////////
    /* CONFIG */ /////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////
  
    var g_Config = { 
        deployPath:          "brand/promo",  // Deploy Path ( DO NOT PUT VANITY URL HERE )
        useV3Tracking:       true, // use v3 tracking
        disableOGCheck:      false, // skip og_tags
        useFBFeedApi:        false, // force the correct content into Facebook via Feed API, instead of using scrape data
        windowOpts:          "width=600,height=400,toolbar=no,status=no,location=no,menubar=no,directories=no,resizable=yes,scrollbars=yes", // opts arg passed to window.open
        targetSelfDelay:     150  // ms delay before a target="_self" ( or "_top" ) to allow tracking, callback to complete.
    }
  
    var g_Services = {
        'facebook_scrape': {
            url: false, // share default url (OG Tags)
            ext: "", // no extra parameters
            cb: false, // no callback
          
            template: "http://www.facebook.com/sharer.php?u=%%URL%%%%EXT%%",
            patterns: ".fb_share, .facebook_share",
            name: "Facebook",
            target: "_blank"
        }, 
        
        'facebook_force': {
            url: false, // share default url (OG Tags)
            img: false, // share default img (OG Tags)
            hdr: false, // share default title/headline (OG Tags)
            msg: false, // share default msg (OG Tags)
            ext: "&redirect_uri=http%3A%2F%2Ffacebook.com%2F&display=popup", // set popup style dialog ( this used to be a default, now it defaults to "page" )
            cb: false, // no callback
          
            template: "https://www.facebook.com/dialog/feed?app_id=%%FBAPP%%&link=%%URL%%&picture=%%IMG%%&name=%%HDR%%&description=%%MSG%%%%EXT%%",
            patterns: ".fb_share, .facebook_share",
            name: "Facebook",
            target: "_blank"
        }, 
          
        'pinterest': {
            msg: false, // use default share message (OG Tags)
            img: false, // best practice is to upload a pic to akamai, and test with private boards.
            url: false, // use default (OG Tags)
            ext: "", // no extras
            cb: false, // no callback
          
            template: "https://pinterest.com/pin/create/button/?url=%%URL%%&media=%%IMG%%&description=%%MSG%%%%EXT%%",
            patterns: '.pin_share, .pinterest_share',
            name: "Pinterest",
            target: "_blank"

        },
          
        'twitter': {
            msg: false, // use default share message (OG Tags)
            url: false, // use default url (OG Tags)
            ext: "", // no extras
            cb: false, // no callback
           
            template: "https://twitter.com/intent/tweet?url=%%URL%%&text=%%MSG%%%%EXT%%",
            patterns: '.twit_share, .twitter_share',
            name: "Twitter",
            target: "_blank"
        },
        
        'generic': {
            url: false, // share default url (OG Tags)
            msg: false, // use default share message (OG Tags)
            hdr: false,
            img: false,
            ext: "", // no extras
            cb: false, // no callback
          
            template: "about:blank",
            patterns: "",
            name: "Generic",
            target: "_blank"
        }
        
    };
  
    //////////////////////////////////////////////////////////////
    /* PRIVATE */ ////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////
  
    var og_msg, og_img, og_url, og_hdr, og_app, page_name;

    var g_Ready = false; // tracks whether we've completed initialization
    
    var esocial_init = function ( Config ) {
         
        // parse configuration if present;
        if ( typeof Config == "object" ) {
            if ( typeof Config.deployPath == "string" ) g_Config.deployPath = Config.deployPath;
            if ( typeof Config.useV3Tracking == "boolean" ) g_Config.useV3Tracking = Config.useV3Tracking;
            if ( typeof Config.disableOGCheck == "boolean" ) g_Config.disableOGCheck = Config.disableOGCheck;
            if ( typeof Config.useFBFeedApi == "boolean" ) g_Config.useFBFeedApi = Config.useFBFeedApi;
            if ( typeof Config.windowOpts == "string" ) g_Config.windowOpts = Config.windowOpts;
            if ( typeof Config.targetSelfDelay == "number" ) g_Config.targetSelfDelay = Config.targetSelfDelay;
        } 
          
        // fallback for failover, hope these get overwritten.
        og_url = window.location.host + window.location.pathname;
        og_hdr = $('head title').text();
        og_msg = og_hdr;
        og_img = window.location.host + window.location.pathname + "public/images/fb.jpg";
        og_app = false;

        if ( g_Config.deployPath == "brand/promo" && g_Config.useV3Tracking ) {
           // try to parse from container
           if ( $('#container[data-deploy-path]').length == 1 ) g_Config.deployPath = $('#container').data('deploy-path').replace(/(^\/|\/$)/g, "");
        }
        
        // page name
        page_name = $('body').attr('id');
        if ( typeof page_name != "string" || page_name == "") page_name = "unknown";
        
        // get values from og tags.
        if ( g_Config.disableOGCheck || $('meta[property="og:url"], meta[property="og:image"], meta[property="og:description"], meta[property="og:title"]').length < 4 ) {

            g_Config.useFBFeedApi = false; // can't disable OG and use feed.

            g_Services.facebook = g_Services.facebook_scrape;
            return; // missing OG tags, leave placeholder
        } 
          
        if ( $('meta[property="og:url"]').length > 0 ) og_url = $('meta[property="og:url"]').attr('content');
        if ( $('meta[property="og:title"]').lenth > 0 ) og_hdr = $('meta[property="og:title"]').attr('content');
        if ( $('meta[property="og:description"]').length > 0 ) og_msg = $('meta[property="og:description"]').attr('content');
        if ( $('meta[property="og:image"]').length > 0 ) og_img = $('meta[property="og:image"]').attr('content');
        if ( $('meta[property="fb:app_id"]').length > 0 ) og_app = $('meta[property="fb:app_id"]').attr('content');
        
        // set up fb type
        if (g_Config.useFBFeedApi && og_app != false ) {
            g_Services.facebook = g_Services.facebook_force;        
        } else {
            g_Config.useFBFeedApi = false;
            g_Services.facebook = g_Services.facebook_scrape;
        }
        
        return;
    };
  
    var esocial_get_config = function () {
        return $.extend( {}, g_Config); // return a copy.  
    }
  
    var esocial_parse_defaults = function( El, Type ) {
        var $el = $(El);
        var def = esocial_get_defaults(Type);
                
        if (typeof def !== "object") def = {}; // sanity check
                
        // no need to worry about creating unused keys.  They just get ignored.
        if ( $el.is('[data-href]') )       { def.url = $el.data('href'); }
        if ( $el.is('[data-url]') )        { def.url = $el.data('url'); }
        if ( $el.is('[data-image]') )      { def.img = $el.data('image'); }
        if ( $el.is('[data-img]') )        { def.img = $el.data('img'); }
        if ( $el.is('[data-header]') )     { def.hdr = $el.data('header'); }
        if ( $el.is('[data-title]') )      { def.hdr = $el.data('title'); }
        if ( $el.is('[data-hdr]') )        { def.hdr = $el.data('hdr'); }
        if ( $el.is('[data-message]') )    { def.msg = $el.data('message'); }
        if ( $el.is('[data-text]') )       { def.msg = $el.data('text'); }
        if ( $el.is('[data-msg]') )        { def.msg = $el.data('msg'); }
        if ( $el.is('[target]') )          { def.target = $el.attr('target'); }
        if ( $el.is('[data-ext]') )        { def.ext = $el.data('ext'); }
        if ( $el.is('[data-callback]') )   { def.cb = function() { eval( $el.data('callback') ); return; } }  // a necessary "eval" for callback parsing.
        if ( $el.is('[data-cb]') )         { def.cb = function() { eval( $el.data('cb') ); return; } }   // =D
                
        return def;
    };
 
    var esocial_set_service = function ( Id, Settings, Redeploy ) {
        var buf;
        var deploy = false;
         
        // validate input
        if ( typeof Id !== "string" || typeof Settings !== "object" ) return false;
          
        // no dupes.
        if ( typeof g_Services[ Id ] == "object" ) {
            buf = $.extend( {}, g_Services[ Id ] );
            if (Redeploy) deploy = true;
        } else {
            buf = $.extend( {}, g_Services["generic"] );
            deploy = true;
        }
        
        if ( typeof Settings.url == "string" || Settings.url === false ) buf.url = Settings.url;
        if ( typeof Settings.img == "string" || Settings.img === false) buf.img = Settings.img;
        if ( typeof Settings.hdr == "string" || Settings.hdr === false) buf.hdr = Settings.hdr;
        if ( typeof Settings.msg == "string" || Settings.msg === false) buf.msg = Settings.msg;
        
        if ( typeof Settings.cb == "function" || Settings.cb === false) buf.cb = Settings.cb;
        if ( typeof Settings.ext == "string" || Settings.ext === false) buf.ext = Settings.ext;
        
        if ( typeof Settings.patterns == "string" ) buf.patterns = Settings.patterns;
        if ( typeof Settings.template == "string" ) buf.template = Settings.template;
        if ( typeof Settings.target == "string" ) buf.target = Settings.target;
        if ( typeof Settings.name == "string" ) buf.name = Settings.name;
        
        //insert service.
        g_Services[Id] = buf;
                
        if (g_Ready && deploy && buf.patterns != "") $(document.body).on('click', buf.patterns, function(Ev) { Ev.preventDefault(); esocial_generic( esocial_parse_defaults( this, Id ) ); });
        
        return esocial_get_defaults( Id );
          
    }
 
    var esocial_deploy = function () {
        var svc_id;
        var pattern;
        
        for ( svc_id in g_Services ) {        
            // skip the functional facebook services ( we will still get "facebook" );
            if (svc_id == "facebook_scrape" || svc_id == "facebook_force") continue; 
        
            pattern = g_Services[svc_id].patterns;
          
            // closure-wrap and deploy
            (function( Pattern, SvcId ){
                if (Pattern != "") $(document.body).on('click', Pattern, function(Ev) { Ev.preventDefault(); esocial_generic( esocial_parse_defaults( this, SvcId ) ); });
            })(pattern, svc_id);
        }
        
        return;
    };
  
    var esocial_get_defaults = function( Type ) {
        // returns default settings for type; can be modified and passed in as override.
        
        if ( typeof Type != "string" ) return false;
        
        if ( typeof g_Services[ Type ] != "object" ) return false;
        
        return $.extend( {}, g_Services[ Type ]); // return a copy.
    }
  
    var esocial_generic = function ( Overrides ) {
        var url = og_url;
        var hdr = og_hdr;
        var msg = og_msg;
        var img = og_img;
        var target = "_blank"; // default
        
        var ext = "";   // extras
        var cb = false;
        
        var buf = "about:blank";
        var svc_name = "generic";
        
        var defaults = false;
        
        var ptr_window;
        
        // parse defaults
        if ( typeof Overrides == "string") defaults = esocial_get_defaults( Overrides );
        if ( typeof defaults != "object") defaults = g_Services.generic;
        
        if ( typeof defaults == "object" ) {
            if ( typeof defaults.url == "string" )  url = defaults.url;
            if ( typeof defaults.hdr == "string" )  hdr = defaults.hdr;
            if ( typeof defaults.msg == "string" )  msg = defaults.msg;
            if ( typeof defaults.img == "string" )  img = defaults.img; 
          
            if ( typeof defaults.ext == "string" )  ext = defaults.ext; 
            if ( typeof defaults.cb == "function" ) cb = defaults.cb; 
            
            if ( typeof defaults.template == "string" ) buf = defaults.template;
            if ( typeof defaults.name == "string" ) svc_name = defaults.name;
            if ( typeof defaults.target == "string" ) target = defaults.target;
        }
        
        // parse input
        if ( typeof Overrides == "object" ) {
            if ( typeof Overrides.url == "string" )  url = Overrides.url;
            if ( typeof Overrides.hdr == "string" )  hdr = Overrides.hdr;
            if ( typeof Overrides.msg == "string" )  msg = Overrides.msg;
            if ( typeof Overrides.img == "string" )  img = Overrides.img; 
          
            if ( typeof Overrides.ext == "string" )  ext = Overrides.ext; 
            if ( typeof Overrides.cb == "function" ) cb = Overrides.cb;   
          
            if ( typeof Overrides.template == "string" ) buf = Overrides.template;
            if ( typeof Overrides.name == "string" ) svc_name = Overrides.name;
            if ( typeof Overrides.target == "string" ) target = Overrides.target;
         
        }
        
        if ( buf.indexOf('%%FBAPP%%') > 0 && typeof og_app !== "string") { 
            // fail over to FB scrape
            buf = g_Services.facebook_scrape.template;
        }
                          
        // build url
        buf = buf.replace(/%%FBAPP%%/g, og_app );
        buf = buf.replace(/%%URL%%/g, encodeURIComponent( url ) );
        buf = buf.replace(/%%IMG%%/g, encodeURIComponent( img ) );
        buf = buf.replace(/%%HDR%%/g, encodeURIComponent( hdr ) );
        buf = buf.replace(/%%MSG%%/g, encodeURIComponent( msg ) );
        buf = buf.replace(/%%EXT%%/g, ext );
        
        try {
        
            if ( target == "_self" ) {
                // special case, need the timeout.
                setTimeout( function() { window.location.href = buf; return; }, g_Config.targetSelfDelay);
                ptr_window = window;
            } else if ( target == "_top") {
                // special case, need the timeout.
                setTimeout( function() { window.top.location.href = buf; return; }, g_Config.targetSelfDelay);
                ptr_window = window.top;
            } else {
                // open window
                 ptr_window = window.open( buf, target, g_Config.windowOpts );
            }
 
            // Track
            if ( g_Config.useV3Tracking === true ) { __utmTrackEvent("Social", "Click", "Share on " + svc_name , svc_name, '/' + g_Config.deployPath + '/' + page_name ); } 
          
            // invoke the callback
            if ( typeof cb == "function" ) { cb(ptr_window); }

        } catch (ex) {
            ; // do nothing
        }
        
        return;
    };
  
    //////////////////////////////////////////////////////////////
    /* PUBLIC */ /////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////

    // Initialize & Deploy
    $( function() { 
        esocial_init();
        esocial_deploy();
	g_Ready = true;
    });

    // External Interface
    window.eSocial = {
        config                      : esocial_get_config,
        init                        : esocial_init,
        share                       : esocial_generic,
        parseElement                : esocial_parse_defaults,
        getService                  : esocial_get_defaults,
        setService                  : esocial_set_service
    };
    
    return;
        
})(); 

