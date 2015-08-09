var $container, baseUrl, siteUrl, rtmSiteUrl, displayConsoleLogs, isMobile, uId = "", uIdHash = "", playDate = "", shareClickGuid = "", componentHtml, isFacebookMobileApp, isFacebook, fbAppId, isFacebookMobileApp, daysUntilStart;
var memberId, model, member, entries, regValidator, tafValidator;
var returningUser = false;
var fbUserID = "", signedRequest = "", currentAccessToken = "", allowFBLogin, allowTWLogin, allowGPLogin, allowYALogin;
//for now, twitter is ready when the page loads.  logins by cookie or oAuth query strings
//yahoo is disabled for now, but should be implemented later.  Default to ready until fully programmed
var fbReady = false, gpReady = false, twReady = true, yaReady = true;
var twitterUserId, twCookieName;
var googleUserId, googleStatus = "";
var twGoToReg = false;
var contentPageLoadExecuted = false;
var cookieBase;
var minAge, tafAmount;
var gameGuid, directToGame;
var prizeDesc = '';
var win = false; //50-50 win lose randomizer
var prizeWin = 0;
var playsRemainingPromo = 0, playsRemainingDaily = 0;

function loadPage() {
    rtm_blockUI();
    if (allowTWLogin) {
        if (!twitterUserId || twitterUserId == "") {
            getTwitterIdFromCookie();
        }

        if (twitterUserId && twitterUserId != "") {
            setTwitterCookie();
            /*
            if (!memberId || memberId == "")
            {
                doLastLinePageLoad = false;
                doLogin("", "", "", twitterUserId, "");
            }
            */
        }
    }

    if (allowFBLogin) {
        FB.getLoginStatus(function (response) {
            checkStatus(response, function () {
                fbReady = true;
                socialLoginComplete("facebook1");
            });
        });
    }

    $container = $("#container");

    if (isFacebook) { $("html, body").css({ "overflow-x": "hidden", "overflow-y": "hidden" }); }

    $("body").on("click", "a[href^='http']:not([href*='" + location.host + "']):not([href*='rtm.com']):not([href*='https://twitter.com/intent/tweet'])", function () { ga('send', 'event', location.pathname, 'Clicked', $(this).attr("href")); });

    if (navigator && navigator.userAgent && (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i))) {
        var viewportmeta = document.querySelector('meta[name="viewport"]');
        if (viewportmeta) {
            viewportmeta.content = 'width=device-width, minimum-scale=1.0, maximum-scale=1.0, initial-scale=1.0';
            document.body.addEventListener('gesturestart', function () {
                viewportmeta.content = 'width=device-width, minimum-scale=0.25, maximum-scale=1.6';
            }, false);
        }
    }

    //this is the default fallback for if only email is enabled.
    socialLoginComplete("email/twitter");
}

function socialLoginComplete(which) {
    if (which != null) { logToConsole("socialLoginComplete: " + which); }

    var done = true;

    if (allowFBLogin && !fbReady)
        done = false;
    if (allowGPLogin && !gpReady)
        done = false;
    if (allowTWLogin && !twReady)
        done = false;
    if (allowYALogin && !yaReady)
        done = false;

    if (done) {
        if (window.contentPageLoad) { window.contentPageLoad(); } else { $container.fadeIn(); }
    }
}

/****  Facebook Functions  ****/
function checkStatus(response, callback) {
    if (response.status === "connected") {
        if (fbUserID && fbUserID != response.authResponse.userID) {
            parent.location.href = fbPage;
        }
        else {
            processFbResponse(response, callback);
        }
    }
    else if (response.status === "unknown" && isFacebook) { if (callback) { callback(); } /*rtm_showAlert("Sorry", "Please log in to Facebook first.", false);*/ return false; }
    else { if (callback) { callback(); } }
}

function processFbResponse(response, callback) {
    fbUserID = response.authResponse.userID;
    signedRequest = response.authResponse.signedRequest;
    currentAccessToken = response.authResponse.accessToken;

    if (callback) { callback(); }
    /*
    if (!memberId || memberId == "")
    {
        doLogin("", fbUserID, signedRequest, "", "");

    } else if (callback) { callback(); }
    */
}

function loginFB(callback) {
    FB.login(function (response) {
        if (response.authResponse) {
            processFbResponse(response, callback);
        }
    });
}

/****  Twitter Functions  ****/
function setTwitterCookie() {
    if (twitterUserId && twitterUserId != "") {
        $.cookie(twCookieName, twitterUserId, { expires: 365, path: "/" });
    }
}

function getTwitterIdFromCookie() {
    twitterUserId = $.cookie(twCookieName);
}

function removeTwitterIdCookie() {
    $.cookie(twCookieName, null, { path: "/" });
}

/****  Google+ Functions ****/
function googlePlusSigninCallback(authResult) {
    //if (signingOut) return;

    if (authResult['status']['signed_in'] && googleStatus != "signed_in" /*&& !loggedInUsername*/) {
        googleStatus = "signed_in";
        if (!googleUserId) {
            gapi.client.load("plus", "v1", function () {
                var request = gapi.client.plus.people.get({ "userId": "me" });
                request.execute(function (resp) {
                    if (resp && resp.id) {
                        //googleLoaded = true;
                        googleUserId = resp.id;
                        //if (allLoaded || (fbLoaded && googleLoaded)) { loginStatusChanged(googleSignInClicked); }
                        gpReady = true;
                        socialLoginComplete("google1");
                        //doLogin("", "", "", "", googleUserId);
                    }
                });
            });
        }
        else {
            //if (allLoaded || (fbLoaded && googleLoaded)) { loginStatusChanged(googleSignInClicked); }
            gpReady = true;
            socialLoginComplete("google2");
            //doLogin("", "", "", "", googleUserId);
        }
    }
    else if (authResult['status'] != googleStatus/* && !googleLoaded*/) {
        //logToConsole("Reached portion of googleplus code not yet handled.  authResults['status'] = " + authResult['status']);
        gpReady = true;
        socialLoginComplete("google3");
        /*
        googleLoaded = true;
        if (allLoaded || (fbLoaded && googleLoaded)) { loginStatusChanged(googleSignInClicked); }
        */
    }
}

/****  General Functions  ****/
function rtm_ajax(method, parameters, callback) {

    $.ajax({
        type: "POST",
        url: baseUrl + "WebMethods.aspx/" + method,
        data: JSON.stringify(parameters),
        contentType: "application/json; charset=utf-8",
        success: function (msg) {
            if (callback != null) { callback(msg.d); }
        },
        error: function (xhr, err) {
            if (xhr.responseText) {
                rtm_showAlert("Error", "<p>An error has occurred:</p><p>" + xhr.responseText + "</p>");
            }
        }
    });
}

function rtm_showAlert(title, message) {
    //alert(message);
    openModalError('error', function () {
        $('#errorTitle').text(title);
        $('#errorText').html(message);
    });
}

function rtm_showErrors(errorList) {
    $(".qtip").remove();
    if (errorList.length > 0) {
        if (errorList[0].element.id == "prizeSelectHidden") {
            $("#prizeSelectHolder").qtip({
                content: errorList[0].message,
                position: { my: errorList[0].element.id == "recaptcha_response_field" ? "top center" : "bottom center", at: errorList[0].element.id == "recaptcha_response_field" ? "top center" : "top center", adjust: { y: errorList[0].element.id == "recaptcha_response_field" ? 5 : -5 }, viewport: $("#container") },
                style: { classes: "qtip-bootstrap" }
            }).focus().qtip("show");
        }
        else {
            $("#" + errorList[0].element.id).qtip({
                content: errorList[0].message,
                position: { my: errorList[0].element.id == "recaptcha_response_field" ? "top center" : "bottom center", at: errorList[0].element.id == "recaptcha_response_field" ? "top center" : "top center", adjust: { y: errorList[0].element.id == "recaptcha_response_field" ? 5 : -5 }, viewport: $("#container") },
                style: { classes: "qtip-bootstrap" }
            }).focus().qtip("show");
        }

        scrollTo($("#" + errorList[0].element.id).offset().top - 80);
    }
}

//// block ui
//function rtm_blockUI()
//{
//    $.blockUI({ theme: false, css: { border: "none", backgroundColor: "" }, baseZ: "1013", title: "", message: "<div class='ui-corner-all' style='background-color: #fff; width: 50px; margin: 0 auto; padding: 10px'><img src='" + baseUrl + "images/ajax-loader.gif' alt='Loading'/></div>" });
//}

//// unblock ui
//function rtm_unblockUI()
//{
//    $.unblockUI();
//}

// block ui
function rtm_blockUI() {
    $.blockUI({ theme: false, css: { border: "none", backgroundColor: "" }, baseZ: "1013", title: "", message: "<div class='ui-corner-all' style='background-color: #fff; width: 50px; margin: 0 auto; padding: 10px'><img src='" + baseUrl + "images/ajax-loader.gif' alt='Loading'/></div>" });
}

// unblock ui
function rtm_unblockUI() {
    $.unblockUI();
}
// ajax call with block or do not block ui parameter
function rtm_ajaxBlockUI(method, blockui, parameters, callback) {
    if (blockui) { rtm_blockUI(); }

    $.ajax({
        type: "POST",
        url: baseUrl + "WebMethods.aspx/" + method,
        data: JSON.stringify(parameters),
        contentType: "application/json; charset=utf-8",
        success: function (msg) {
            if (blockui) { $.unblockUI({ onUnblock: function () { if (callback != null) { callback(msg.d); } } }); }
            else if (callback != null) { callback(msg.d); }
        },
        error: function (xhr, err) {
            rtm_unblockUI();
            if (xhr.responseText) {
                rtm_showAlert("Error", "<p>An error has occurred:</p><p>" + xhr.responseText + "</p>", false);
            }
        }
    });
}

// create captcha and clear all others
function captchaInjector(captchaHolderId) {
    var cap = "<div class='captcha'>" +
                    "<div id='recaptcha_widget' class='clearfix'>" +
                        "<div id='recaptcha_holder'>" +
                            "<div id='recaptcha_image'></div>" +
                            "<div class='recaptcha_only_if_incorrect_sol' style='color: red; display: none;'>Incorrect please try again</div>" +
                            "<input type='hidden' id='recaptcha_challenge_field' name='recaptcha_challenge_field' />" +
                        "</div>" +
                        "<div id='recaptcha_btns'>" +
                            "<div class='recaptcha_Get_Another'><a href='javascript:Recaptcha.reload()'>Reload</a></div>" +
                            "<div class='recaptcha_only_if_audio'><a href='javascript:Recaptcha.switch_type(\"audio\")'>Get an audio CAPTCHA</a></div>" +
                            "<div class='recaptcha_only_if_image'><a href='javascript:Recaptcha.switch_type(\"image\")'>Get an image CAPTCHA</a></div>" +
                            "<div class='recaptcha_info'><a href='http://www.google.com/recaptcha/help' target='_blank'>Help</a></div>" +
                        "</div>" +
                   "</div>" +
                    "<input type='text' id='recaptcha_response_field' class='required margintop10' name='recaptcha_response_field' placeholder='Enter the characters above' />" +
                "</div>";
    $(".captchaHolder").empty();
    $("#" + captchaHolderId).empty().append(cap);

    $(".recaptcha_only_if_audio").click(function () {
        $(this).hide();
        $(".recaptcha_only_if_image").show();
    });

    $(".recaptcha_only_if_image").click(function () {
        $(this).hide();
        $(".recaptcha_only_if_audio").show();
    });

    Recaptcha.create("6Ldw0sgSAAAAAD5t65wlPYusfiymB-cIhzfRMGDA", "recaptcha_image", { theme: "custom", callback: function () { addPlaceholders(); $("iframe[src='about:blank']").hide(); } });
}

function logToConsole(message) {
    if (typeof (console) != "undefined" && typeof (console.log) == "function" && typeof (displayConsoleLogs) != undefined && displayConsoleLogs != null && displayConsoleLogs) {
        console.log("logToConsole: " + message);
    }
}

// add placeholders for non html5 support
function addPlaceholders() {
    $("input.placeholderPluginProcessed").removeClass("placeholderPluginProcessed").placeholderEnhanced("destroy");
    if (!Modernizr.input.placeholder) { $("input[placeholder]").addClass("placeholderPluginProcessed").placeholderEnhanced(); }
}

function getHtml(filename, callback) {
    $.ajax({
        type: "GET",
        cache: false,
        async: true,
        url: baseUrl + "html/" + filename + ".html",
        success: function (html) {
            if (typeof (ga) != "undefined") { ga("send", "pageview", "/" + filename); }
            componentHtml = html.replace(/{baseUrl}/g, baseUrl);
            if (callback) { callback(); }
        },
        error: function (xhr, status, err) {
            if (xhr && xhr.responseText) {
                rtm_showAlert("Sorry", "<p>An error has occurred:</p><p>" + (xhr && xhr.responseText) || (status + " - " + err) + "</p>");
            }
        }
    });
}

function getAspx(filename, callback) {
    $.ajax({
        type: "GET",
        cache: false,
        async: true,
        url: baseUrl + "html/" + filename + ".aspx",
        success: function (html) {
            if (typeof (ga) != "undefined") { ga("send", "pageview", "/" + filename); }
            componentHtml = html.replace(/{baseUrl}/g, baseUrl);
            if (callback) { callback(); }
        },
        error: function (xhr, status, err) {
            if (xhr && xhr.responseText) {
                rtm_showAlert("Sorry", "<p>An error has occurred:</p><p>" + (xhr && xhr.responseText) || (status + " - " + err) + "</p>");
            }
        }
    });
}

function scrollTo(pos) {
    if (isFacebook) { fbScrollTo(pos); }
    else { $("html, body").animate({ scrollTop: pos }, "fast"); }
}

function fbScrollTo(y) {
    FB.Canvas.getPageInfo(function (pageInfo) {
        $({ y: pageInfo.scrollTop }).animate({ y: y }, { duration: 200, step: function (offset) { FB.Canvas.scrollTo(0, offset); } });
    });
}

function fader(proc) {
    if (proc == "show") { $('#dialog').before('<div id="overlay" class="clearfix"></div>'); $("#overlay").css("opacity", 0); $("#overlay").fadeTo(400, .5); } else if (proc == "hide") { $("#overlay").fadeOut(400, function () { $("#overlay").remove(); }); }
}


function setupFooterShares() {
    var ins = (navigator && navigator.userAgent && navigator.userAgent.indexOf("Trident/7") == -1 && navigator.userAgent.indexOf("MSIE") == -1) ? "%27" : "";

    rtmSocialSettings = {
        memberId: memberId,
        url: siteUrl[siteUrl.length - 1] == "/" ? siteUrl.substring(0, siteUrl.length - 1) : siteUrl,
        shareTargetName: "Homepage",
        shareSource: "Footer",
        platforms: [
            { platform: "FACEBOOK", selector: "#fbFooterShare", title: "Now's your chance to Dream BIG!", description: "Dream Big and Win Big. You could win $10,000 and make your dreams come true.  Plus \"spin to win\" every day for any of 450 Instant Win prizes. Will you become one of today's wins?  Hurry and enter now!", image: rtmSiteUrl + "images/RD-Share-FB.jpg", dontOpen: isFacebookMobileApp },
            { platform: "TWITTER", selector: "#twFooterShare", description: "Spin to Win for any of 450 instant win prizes plus the Dream Big prize of $10,000 {url}", dontOpen: isFacebookMobileApp },
            { platform: "PINTEREST", selector: "#pinFooterShare", description: "What would you do with $10,000?  Dream Big and you could win BIG.  Enter today and you could be the Grand Prize winner of $10,000!  Plus instant winners named every day.  Hurry!", image: rtmSiteUrl + "images/RD-Share-Pin.jpg", dontOpen: isFacebookMobileApp },
            { platform: "GOOGLEPLUS", selector: "#gFooterShare", title: "Google Plus title share copy here", description: "Google Plus description share copy here", image: rtmSiteUrl + "images/g_share_image.jpg", dontOpen: isFacebookMobileApp },
            { platform: "EMAIL", selector: "#emailFooterShare", subject: "Your friend, {YOUR NAME}, wants you to enter xxxxx!", content: "Email description share copy here!<br><a href=\"{PROMOTION URL}\" target=\"_blank\">Click here</a> to enter now.", dontOpen: isFacebookMobileApp }
        ]
    };

    if (typeof setupRealtimeSocial == "function") { setupRealtimeSocial(); }
}

$.validator.addMethod("required", function (value, element, param) {
    return (value != null && $.trim(value) != param && $.trim(value) != '' && (!$(element).is(".placeholderPluginProcessed") || $.trim(value) != $(element).attr("placeholder")));
}, "This field is required");

$.validator.addMethod("requiredIfEmail", function (value, element, param) {
    var ok = true;
    if ($(element).val() == "" && $(element).parentsUntil("#regForm", ".tafLine").find(".tafEmail").val() != "") {
        ok = false;
    }
    return $(element).is(":hidden") || ok;
}, "A name is required if an email address is provided");

$.validator.addMethod("requiredIfName", function (value, element, param) {
    var ok = true;
    if ($(element).val() == "" && $(element).parentsUntil("#regForm", ".tafLine").find(".tafName").val() != "") {
        ok = false;
    }
    return $(element).is(":hidden") || ok;
}, "An email address is required if a name is provided");

$.validator.addMethod("uniqueEmail", function (value, element, param) {
    var ok = true;
    $(".tafEmail").not($(element)).each(function (i, v) { if ($(v).val().toLowerCase() == $(element).val().toLowerCase()) { ok = false; } });
    return $(element).is(":hidden") || $(element).val() == "" || ok;
}, "Each email address must be unique");

$.validator.addMethod("requiredManualAddress", function (value, element, param) {
    var ok = true;
    var el, v;
    $("#addr1, #city, #state, #zip").each(function (ind, val) {
        el = $(this);
        v = $(el).val();
        if (v == null || v == '' || ($(el).is(".placeholderPluginProcessed") && v == $(el).attr("placeholder"))) { ok = false; }
    });

    return $(element).is(":hidden") || ok;
}, "A full address is required");

/*
    Valid Date with Multiple Inputs
    Ensure date is valid/legit date when input comes from 3 separate places
    yearTextboxField: { datemultiple: ["#monthSelector", "#daySelector", "#yearSelector"] }
*/
$.validator.addMethod("datemultiple", function (value, element, params) {
    var daySelector = params[1],
        monthSelector = params[0],
        yearSelector = params[2];

    if ($(daySelector).is(":hidden") || $(monthSelector).is(":hidden") || $(yearSelector).is(":hidden"))
        return true;

    var day = parseInt($(daySelector).val(), 10),
        month = parseInt($(monthSelector).val(), 10),
        year = parseInt($(yearSelector).val(), 10),
        dateEntered = new Date(year, month - 1, day);

    return this.optional(element) || (!isNaN(dateEntered.valueOf()) && dateEntered.getMonth() == (month - 1));

}, "Please enter a valid date");

$.validator.addMethod("prizeSelectRequired", function (value, element, param) {
    var ok = true;

    //must be more than 1 prize to require validation
    if ($(".prizeSelect").length <= 1)
        return true;

    if ($(".prizeSelect.selected").length == 0)
        ok = false;

    return ok;

}, "Please select a prize");

$.validator.addMethod("confirmEmail", function (value, element, param) {
    return this.optional(element) || value == $(param).val();
}, "Confirmation email must match");

$.validator.addClassRules("tafName", { requiredIfEmail: true });
$.validator.addClassRules("tafEmail", { requiredIfName: true, email: true, uniqueEmail: true });

// validator for valid US phone number
$.validator.addMethod("phoneUS", function (phone_number, element) {
    if (phone_number == "Phone Number") return true;
    phone_number = phone_number.replace(/\s+/g, "");
    return this.optional(element) || phone_number.length > 9 &&
		phone_number.match(/^(1-?)?(\([2-9]\d{2}\)|[2-9]\d{2})-?[2-9]\d{2}-?\d{4}$/);
}, "Please specify a valid phone number");

$.validator.addMethod("validUSCANZip", function (value, element, params) {
    // logToConsole(params[0]);
    // logToConsole(params[1]);
    var allowUS = params[0] ? params[0] : true;
    var allowCAN = params[1] ? params[1] : true;
    var usPattern = /^(\d{5}((-)\d{4})?)$/;
    var canPattern = /^([A-Za-z]\d[A-Za-z]( |-)?\d[A-Za-z]\d)$/;

    // return this.optional(element) || ((allowUS && usPattern.test(value)) || (allowCAN && canPattern.test(value)));
    return this.optional(element) || ((allowUS && usPattern.test(value)));

}, "Please enter a valid US ZIP code");

jQuery.validator.addMethod("equal2", function (value, element, param) {
    return (value.toLowerCase() == $(param).val().toLowerCase());
}, "Confirmation email must match.");

function langSwitch() {
    $('.langSwitcher').unbind("click.lang").bind("click.lang", function () {
        var lang = $(this).attr("data-lang");
        var goto = $(this).attr("data-goto");

        if (goto == "second") {
            //Switch to second lang
            $("body").removeClass("primaryLang").addClass("secondLang");
            $("select option[value='']").not(".primaryLang").prop("selected", true)
        }
        else {
            //switch to primary lang
            $("body").removeClass("secondLang").addClass("primaryLang");
            $("select option[value='']").not(".secondLang").prop("selected", true)
        }
        addPlaceholders();
    });
}

function openModal(mSrc, callback, obj) {
    $('#container').append('<div id="overlay"></div>');
    $('#overlay').fadeIn(250);
    $('#container').append('<div id="modal">' + (mSrc == "ageGate" ? '' : '<a href="javascript:closeModal();" id="closeX"></a>') + '</div>').unbind("click.overlay").bind("click.overlay", function () { closeModal(); });

    getHtml(mSrc, function () {
        $('#modal').addClass(mSrc).append(componentHtml).css('top', $(document).scrollTop() + ($(window).height() / 2) - ($("#modal").height() / 2)).click(function (e) { e.stopPropagation(); });

       // $('#overlay').unbind("click.overlay").bind("click.overlay", function () {
         //   closeModal();
       // });

        if (callback) { callback(obj); }
    });
}

function openModalAspx(mSrc, callback, obj) {
    $('#container').append('<div id="overlay"></div>');
    $('#overlay').fadeIn(250);
    $('#container').append('<div id="modal">' + (mSrc == "ageGate" ? '' : '<a href="javascript:closeModal();" id="closeX"></a>') + '</div>');
    getAspx(mSrc, function () {
        $('#modal').addClass(mSrc).css('top', $(document).scrollTop() + 50).append(componentHtml);
        $('#' + mSrc).show();

        //if ($(window).height() - 100 > $('#modal').height()) { $(document).scroll(function () { $('#modal').css('top', $(document).scrollTop() + 50); }) }

        //$('#overlay').unbind("click.overlay").bind("click.overlay", function()
        //{
        //    closeModal();
        //});

        if (callback) { callback(obj); }
    });
}

function closeModal() {
    //if showing a modal error, don't close the regular modal
    if ($('#modalError').is("*")) { return; }

    if ($('#splashEmailBtn').is("*")) { $('#splashEmailBtn').css("opacity", 1).prop("disabled", false); }

    $('#overlay').fadeOut(350, function () { $('#overlay').remove(); });
    $('#modal').fadeOut(350, function () { $('#modal').remove(); });
}

function openRules(mSrc, callback, obj) {
    $('#overlayRules').remove();
    //If modal not being shown, load overlay
    if ($("#modal").is("*")) { $("#modal").fadeOut('fast'); } else { $('#container').append('<div id="overlay"></div>'); $('#overlay').fadeIn(250); }
    $('#container').append('<div id="modalRules"><a href="javascript:closeRules();" id="closeXRules"></a></div>');
    $('#overlayRules').fadeIn(250);
    getHtml(mSrc, function () {
        $('#modalRules').addClass('rules').css('top', $(document).scrollTop() + 75).append(componentHtml).click(function (e) { e.stopPropagation(); });
        if (callback) { callback(obj); }
        //$('#overlay').unbind("click.overlay").bind("click.overlay", function () {
        //    closeRules();
        //});

    });
}

function closeRules() {
    $('#modalRules').fadeOut(350, function () { $('#modalRules').remove(); });
    if ($("#modal").is("*")) {
        $("#modal").fadeIn('fast');
        //$('#overlay').unbind("click.overlay").bind("click.overlay", function () {
        //    closeModal();
        //});
    } else { $('#overlay').fadeOut(350, function () { $('#overlay').remove(); }); }

}

function openModalError(mSrc, callback, obj) {
    //If modal not being shown, load overlay
    if ($("#modal").is("*")) { /*$("#modal").fadeOut('fast');*/ } else { $('#container').append('<div id="overlay"></div>'); $('#overlay').fadeIn(250); }
    $('#container').append('<div id="modalError"></div>');

    getHtml(mSrc, function () {
        $('#modalError').addClass(mSrc).css('top', $(document).scrollTop() + 75).append(componentHtml).click(function (e) { e.stopPropagation(); });
        if (callback) { callback(obj); }
    });
}

function closeModalError() {
    $('#modalError').fadeOut(350, function () { $('#modalError').remove(); });
    if ($("#modal").is("*")) {
        /*$("#modal").fadeIn('fast');*/
        $('#overlay').unbind("click.overlay").bind("click.overlay", function () {
            closeModal();
        });
    } else { $('#overlay').fadeOut(350, function () { $('#overlay').remove(); }); }
}


