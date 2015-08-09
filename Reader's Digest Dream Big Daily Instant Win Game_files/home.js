ko.bindingHandlers.stopBinding = { init: function () { return { controlsDescendantBindings: true }; } };
ko.virtualElements.allowedBindings.stopBinding = true;
var userEmail = "", memberFirstName;

/*module classes - /html/mod/module.html ================
=========================================================
	modalReg - Makes reg form appear in a modal box
	ageGate - Adds Age Gate to initial page load
	comingSoon - Add Coming Soon Page in place of start page
	welcomeBack - Replace Login page with Welcome Back page
	langSwitch - Adds Language Switcher to Top Nav
	entryCount - Adds Entry Counter to Welcome Back/Thanks Pages
	daysLeft - Adds 'Days Left to Enter' Header
	emailSignIn - Adds Email Login to Splash
	socialSignIn - Adds Secial Media Login to Splash (Add/Remove Buttons in socialSignIn.html)
	footerGal - Footer Gallery if in layout
	abrRules - Add Abbreviated Rules to Footer
=========================================================
=======================================================*/

//For KO, when a date comes from .NET into JS, it isn't formatted properly
function dateFix(dateStr)
{
    var fixedStr = dateStr.replace(/\/Date\(/g, "").replace(/\)\//g, "");
    var fixedNum = parseInt(fixedStr);
    return new Date(fixedNum);
}

function MainModel() {
    var self = this;

    self.member = ko.mapping.fromJS(member);
    
    self.member.Day = ko.observable();
    self.member.Month = ko.observable();
    self.member.Year = ko.observable();
    self.member.BirthDate = ko.pureComputed(function () {
        if (!self.member.Month() || !self.member.Day() || !self.member.Year())
            return "";

        return self.member.Month() + "/" + self.member.Day() + "/" + self.member.Year();
    });

    model = self;
}

function TAFModel()
{
    var self = this;

    self.emailList = ko.observableArray([]);
    self.processing = ko.observable(false);
    self.alreadySubmittedCount = ko.observable(0);
    self.completeEntries = ko.pureComputed(function()
    {
        var c = 0;
        $.each(self.emailList(), function(i, v) { if (v.email != '' && v.name != '') { c++; } });
        return c;
    });
    self.showSkip = function()
    {
        return (tafAmount == 0 || self.alreadySubmittedCount() >= tafAmount);
    };
    self.addTAF = function()
    {
        self.emailList.push({ name: '', email: '' });
        if (self.emailList().length > 9) { $('#addMoreTAF').fadeOut(); }
    };
    self.submitTAF = function()
    {
        if (!self.processing() && $("#tafForm").valid())
        {
            if (tafAmount && tafAmount > 0 && ((tafAmount - self.alreadySubmittedCount()) > self.completeEntries()))
            {
                rtm_showAlert("Sorry", "Please enter at least " + (tafAmount - self.alreadySubmittedCount()) + " email address to share with", false);
            }
            else
            {
                self.processing(true);
                rtm_ajax("SendTAFEmails", { memberId: memberId, emailsToSend: self.emailList(), date: playDate }, function(r)
                {
                    var results = $.parseJSON(r);
                    if (results.errors != "")
                    {
                        rtm_showAlert("Sorry", results.errors, false);
                        self.processing(false);
                    }
                    else if (results.resp != "")
                    {
                        if (results.sweeps) { entries = results.sweeps; entryCount(); }
                        
                        self.processing(false);
                        self.alreadySubmittedCount(parseInt(results.sendCount));
                        if (tafAmount > self.alreadySubmittedCount())
                        {
                            //Only show this message if it requires the user to stay on the TAF page
                            rtm_showAlert("Sorry", results.resp, false);

                            //clear old entries
                            self.emailList([]);
                            for (var i = 0; i < 5; i++)
                                self.emailList.push({ name: '', email: '' });
                        }
                        else
                        {
                            if(results.gameGuid) { setupGame(results) };
                            goGame();
                        }
                    }
                    else
                    {
                        if (results.sweeps) { entries = results.sweeps; entryCount(); }
                        if(results.gameGuid) { setupGame(results) };
                        goGame();
                    }
                });
            }
        }
    };
    self.skipTAF = function() { goGame(); };

    //start with 5
    for (var i = 0; i < 5; i++)
        self.emailList.push({ name: '', email: '' });

    tafModel = self;
}

function contentPageLoad()
{
    if (contentPageLoadExecuted) { return; }
    contentPageLoadExecuted = true;
    if (allowFBLogin)
    {
        FB.Event.subscribe("auth.statusChange", function(response)
        {
            if (response.status === "connected")
            {
                fbUserID = response.authResponse.userID;
                memberFacebookId = fbUserID;
                signedRequest = response.authResponse.signedRequest;
                currentAccessToken = response.authResponse.accessToken;
            }
        });
    }

    if(fbUserID || twitterUserId || googleUserId)
    {
        doSocialLogin(function() { finishPageLoad(); })
    }
    else
    {
        finishPageLoad();       
    }
}

function finishPageLoad()
{
    if ($('body').hasClass('ageGate') && !directToGame) { openModalAspx('ageGate', ageGate);  }
    if ($('body').hasClass('countrySplash') || $('body').hasClass('countryReg') || $('body').hasClass('countryModal')) { countrySelect(); }
    if ($('body').hasClass('langSwitch')) { langSwitch(); }
    if ($('body').hasClass('footerGal')) { footerGal(); }
    if ($('body').hasClass('comingSoon') && daysUntilStart > 0) { daysUntil(); }
    else if ($('body').hasClass('daysLeft')) { daysLeft(); }

    if (gameGuid != null && gameGuid != "") { goRedeem(); }
    else if (directToGame) { goGame(); }
    else if ($('body').hasClass('comingSoon') && daysUntilStart > 0) { comingSoon(); }
    else if ($('body').hasClass('welcomeBack')) { welcomeBack(); }
    else { goHome(); }

    if (!$.trim($("nav .contentArea").text())) { $("nav").hide(); }

    setupFooterShares();
    $container.css("visibility", "visible").fadeIn();

    $('.bxslider').bxSlider({
        touchEnabled: false,
        pager: false,
        controls: false,
        auto: true
    });

    scrollTo(0);
    
}

// Module Functions
function ageGate()
{
    langSwitch();
    $('#ageGate #closeX').remove();
    $('#overlay').stop().css('opacity', '1');
    $('#overlay, #container').unbind('click.overlay');

    if ($.cookie(cookieBase + "Failed") == "true") { ageGateFailed(); }
    else
    {
        for (i = 1; i < 32; i++) { $("#dobDay, #dobDay2").append("<option value=\"" + i + "\">" + i + "</option"); }
        for (i = new Date().getFullYear() - 12; i > (new Date().getFullYear() - 112) ; i--) { $("#dobYear, #dobYear2").append("<option value=\"" + i + "\">" + i + "</option"); }

        validator = $("#ageGateFormSection").validate({ onkeyup: false, onfocusout: false, rules: {}, ignoreTitle: true, showErrors: function(errorMap, errorList) { rtm_showErrors(errorList); } });
        validator.settings.rules.dobYear = { required: true, datemultiple: ["#dobMonth", "#dobDay", "#dobYear"] };
        validator.settings.rules.dobYear2 = { required: true, datemultiple: ["#dobMonth2", "#dobDay2", "#dobYear2"] };
        validator.resetForm();
        addPlaceholders();

        $('#ageGateSubmit').bind('click', function() { checkAge(); });
    }
}

function checkAge()
{
    if ($("#ageGateFormSection").valid())
    {
        if (okAge())
        {
            closeModal();
        }
        else
        {
            ageGateFailed();
        }
    }
}

function ageGateFailed()
{
    $("#ageGate").html("<h1>Sorry, you are ineligible.</h1>");
    $.cookie(cookieBase + "Failed", "true", { expires: 365, path: "/" });
}

function okAge()
{
    var day = parseInt($("#dobDay:visible, #dobDay2:visible").first().val(), 10),
        month = parseInt($("#dobMonth:visible, #dobMonth2:visible").first().val(), 10),
        year = parseInt($("#dobYear:visible, #dobYear2:visible").first().val(), 10),
        dateEntered = new Date(year, month - 1, day),
        bDay = new Date();
    bDay = bDay.setFullYear(bDay.getFullYear() - minAge);

    return bDay > dateEntered;
}

function entryCount()
{
    if (!entries || entries == "" || isNaN(parseInt(entries))) { entries = 0; }

    if ($("body").hasClass("entryCount"))
    {
        if ($("#entryCount").is("*"))
        {
            $("#entryCount .count").html(entries);
            $("#entryCount .primaryLang .word").html(entries == 1 ? "sweepstakes entry" : "sweepstakes entries");
        }
        else
        {
            getHtml("mod/entryCount", function()
            {
                componentHtml = componentHtml.replace(/{ENTRIES}/g, entries).replace("entries", entries == 1 ? "entry" : "entries");
                $("#entryCount").remove();
                $(".counters").append(componentHtml);
                if ($.trim($("nav .contentArea").text())) { $("nav").show(); }
            });
        }
    }
}
function daysLeft() {
    getAspx("mod/daysLeft", function () {
        $(".counters").append(componentHtml);
        if ($.trim($("nav .contentArea").text())) { $("nav").show(); }
    });
}
function daysUntil() {
    getHtml("mod/daysUntil", function () {
        $(".counters").append(componentHtml);
        if ($.trim($("nav .contentArea").text())) { $("nav").show(); }
    });
}
function footerGal() {
    getHtml("mod/footerGal", function () {
        $("#footerGal").append(componentHtml);
    });
}
function countrySelect()
{
    $('input:radio[name="country"]').change(function()
    {
        if (!$('input:radio[name="country"]:checked'))
        {
            if ($(this).val() == "USA")
            {
                $("body").removeClass("fromCA").addClass("fromUS");
            } else
            {
                $("body").removeClass("fromUS").addClass("fromCA");
            };

            if ($("body").addClass("countryReg"))
            {
                $("#legalOpt").slideDown(250, 'easeInQuad');
            };
        } else
        {
            if ($("body").hasClass("countryReg"))
            {
                $("#legalOpt").slideUp(250, 'easeInQuad', function()
                {
                    if ($('input:radio[name="country"]:checked').val() == "USA")
                    {
                        $("body").removeClass("fromCA").addClass("fromUS");
                    } else
                    {
                        $("body").removeClass("fromUS").addClass("fromCA");
                    };
                    $(this).slideDown(250, 'easeInQuad');
                });
            }
            else
            {
                if ($('input:radio[name="country"]:checked').val() == "USA")
                {
                    $("body").removeClass("fromCA").addClass("fromUS");
                } else
                {
                    $("body").removeClass("fromUS").addClass("fromCA");
                };
            }
        }
    });
}
function comingSoon() {
    getAspx("comingSoon", function () {
        $("#content_main").html(componentHtml);
        $(".comingSoonRemindPost ").hide();
        scrollTo(0);
        $("#daysUntilCt").html(daysUntilStart + (daysUntilStart == 1 ? " day" : " days"));
        $("#comingSoon").fadeIn(250, 'easeInQuad');

        var validator = $("#comingSoonForm").validate({ onkeyup: false, onfocusout: false, rules: {}, ignoreTitle: true, showErrors: function (errorMap, errorList) { rtm_showErrors(errorList); } });
        validator.resetForm();

        $("#comingSoonForm").keypress(function (e) { if (e.keyCode == 13 && e.target.type != "textarea") { $("#comingSoonEmailBtn").click(); return false; } });

        $('#comingSoonEmailBtn').click(function () {
            var btn = $(this);
            if (!btn.prop("disabled") && $("#comingSoonForm").valid()) {
                btn.prop("disabled", true).css("opacity", 0.5);

                var params = {
                    email: $("#comingSoonEmail").val(),
                    date: playDate,
                    mobile: isMobile,
                    shareClickGuid: shareClickGuid || (typeof (rtmSocialAddressBarShareClickGuid) != "undefined" && rtmSocialAddressBarShareClickGuid ? rtmSocialAddressBarShareClickGuid : null)
                };

                rtm_ajax("ComingSoonReminder", params, function (r) {
                    var results = $.parseJSON(r);
                    if (results.errors) { rtm_showAlert("Sorry", results.errors); btn.css("opacity", 1).prop("disabled", false); }
                    else {
                        $('.comingSoonRemind').slideUp(250, 'easeInQuad', function () {
                            $('.comingSoonRemindPost').slideDown(250, 'easeOutQuad');
                        });
                    }
                });
            }

            return false;
        });
	
	addPlaceholders();

    });
}

function goHome() {
    if ($("body").hasClass("splash"))
    {
        getAspx("splash", function()
        {
            $("#content_main").html(componentHtml);
            scrollTo(0);
            $("#splash").fadeIn(250, 'easeInQuad');
            if ($('body').hasClass('countrySplash')) { countrySelect(); }
            if ($('body').hasClass('countryModal')) { $("#countryForm").remove(); }

            if ($("#emailLogin").length)
            {
                var validator = $("#emailLoginForm").validate({ onkeyup: false, onfocusout: false, rules: {}, ignoreTitle: true, showErrors: function(errorMap, errorList) { rtm_showErrors(errorList); } });
                validator.resetForm();
                addPlaceholders();

                $("#emailLoginForm").keypress(function(e) { if (e.keyCode == 13 && e.target.type != "textarea") { $("#splashEmailBtn").click(); return false; } });

                $('#splashEmailBtn').click(function()
                {
                    var btn = $(this);
                    if (!btn.prop("disabled") && $("#emailLoginForm").valid())
                    {
                        btn.prop("disabled", true).css("opacity", 0.5);

                        doLogin();
                    }

                    return false;
                });
            }

            if (allowFBLogin)
            {
                $("#splashFBLogin").unbind("click.login").bind("click.login", function()
                {
                    if (!fbUserID || fbUserID == "")
                    {
                        loginFB(function() { doLogin(); });
                    }
                    else
                    {
                        doLogin();
                    }
                });
            }

            if (allowTWLogin)
            {
                if (!twitterUserId || twitterUserId == "")
                {
                    $("#splashTwLogin").attr("href", twitterOAuthUrl);
                }
                else
                {
                    $("#splashTwLogin").unbind("click.login").bind("click.login", function()
                    {
                        doLogin();
                    });
                }
            }

            if (allowGPLogin)
            {
                $("#splashGoogleLogin").unbind("click.login").bind("click.login", function()
                {
                    if (!googleUserId || googleUserId == "")
                    {
                        gapi.auth.signIn();
                    }
                    else
                    {
                        doLogin();
                    }
                });
            }

            if (allowYALogin)
            {
                $("#splashYahooLogin").unbind("click.login").bind("click.login", function()
                {
                    rtm_showAlert("Sorry", "This functionality is currently unavailable", false);
                    return;
                });
            }

            if ($("body").hasClass("featuredPrize"))
            {
                rtm_ajax("GetFeaturedPrize", { playDate: playDate }, function(r)
                {
                    var results = $.parseJSON(r);
                    //if errors getting featured prize, just ignore the whole thing
                    if (results.errors == "" && results.featuredImage != "")
                    {
                        $("#featuredPrizeContainer #featuredPrizeImg").attr("src", results.featuredImage);
                        $("#featuredPrizeContainer #featuredCopy #featuredDescrip").html(results.featuredDescription);
                        $("#featuredPrizeContainer").show();
                    }
                });
            }

            rtm_unblockUI();
        });
    }
    else
    {
        logToConsole("Splash page skipped due to configuration");
        getAspx("register", function()
        {
            $("#content_main").html(componentHtml);
            scrollTo(0);
            loadReg("");

            if ($("body").hasClass("layoutG"))
            {
                $("#register").fadeIn(250, 'easeInQuad', function()
                {
                    if ($("#container").height() > 700) { $("footer").css("position", "relative"); }
                });
            }
            else
            {
                $("#register").fadeIn(250, 'easeInQuad');
            }
        });
    }
}

function doSocialLogin(callback)
{
    var params = {
        email: "",
        fbUserID: allowFBLogin ? (fbUserID ? fbUserID : "") : "",
        signedRequest: allowFBLogin ? (signedRequest ? signedRequest : "") : "",
        twitterId: allowTWLogin ? (twitterUserId ? twitterUserId : "") : "",
        googleId: allowGPLogin ? (googleUserId ? googleUserId : "") : "",
        date: playDate,
        autoLogin: false
    };

    rtm_ajax("Login", params, function(r)
    {
        var results = $.parseJSON(r);
        if (results.errors) { rtm_showAlert("Sorry", results.errors); btn.css("opacity", 1).prop("disabled", false); }
        else
        {
            returningUser = results.returningUser;
            if (results.memberId)
            {
                memberFirstName = results.memberFirstName;
                memberId = results.memberId;
                switch (results.prizeChoice)
                {
                    case "BirdsAndBlooms":
                        $("body").addClass("bnb");
                        break;
                    case "TasteOfHome":
                        $("body").addClass("toh");
                        break;
                    case "ReadersDigest":
                        $("body").addClass("rd");
                        break;
                    case "FamilyHandyman":
                        $("body").addClass("fh");
                        break;
                }
                if (results.sweeps) { entries = results.sweeps; entryCount(); }
                $("body").addClass("welcomeBack");
            }

            if (callback) { callback(); }
        }
    });
}

function doLogin()
{
    var params = {
        email: $("#splashEmail").is("*") ? $("#splashEmail").val() : "",
        fbUserID: allowFBLogin ? (fbUserID ? fbUserID : "") : "",
        signedRequest: allowFBLogin ? (signedRequest ? signedRequest : "") : "",
        twitterId: allowTWLogin ? (twitterUserId ? twitterUserId : "") : "",
        googleId: allowGPLogin ? (googleUserId ? googleUserId : "") : "",
        date: playDate,
        autoLogin: true
    };

    rtm_ajax("Login", params, function(r)
    {
        var results = $.parseJSON(r);
        if (results.errors) { rtm_showAlert("Sorry", results.errors); $('#splashEmailBtn').css("opacity", 1).prop("disabled", false); }
        else if (results.memberId)
        {
            memberId = results.memberId;
            returningUser = results.returningUser;
            switch (results.prizeChoice)
            {
                case "BirdsAndBlooms":
                    $("body").addClass("bnb");
                    break;
                case "TasteOfHome":
                    $("body").addClass("toh");
                    break;
                case "ReadersDigest":
                    $("body").addClass("rd");
                    break;
                case "FamilyHandyman":
                    $("body").addClass("fh");
                    break;
            }
            if (results.sweeps) { entries = results.sweeps; entryCount(); }
            if (results.gameGuid) {setupGame(results)};
            goTAF(results.alreadyEntered);
        }
        else
        {
            if ($('body').hasClass('countryModal'))
            {
                openModal("country", function()
                {
                    countrySelect();

                    $('#countryModalBtn').click(function()
                    {

                        if ($('body').hasClass('modalReg'))
                        {
                            getAspx("register", function()
                            {
                                $("#modal").css('top', $(document).scrollTop() + 50)
                                $("#country").html(componentHtml);
                                //ko.cleanNode(document.getElementById("register"));
                                //ko.applyBindings(new MainModel(), document.getElementById("register"));
                                //model.member.Email(params.email);
                                setupReg();

                                if ($("body").hasClass("layoutG"))
                                {
                                    $("#register").fadeIn(250, 'easeInQuad', function()
                                    {
                                        scrollTo(0);
                                        if ($("#container").height() > 700) { $("footer").css("position", "relative") }
                                        rtm_unblockUI();
                                    });
                                }
                                else
                                {
                                    $("#register").fadeIn(250, 'easeInQuad', function()
                                    {
                                        rtm_unblockUI();
                                        scrollTo(0);
                                    });
                                }
                            });
                        } else
                        {
                         closeModal();
                           getAspx("register", function()
                            {
                                $("#content_main").html(componentHtml);
                                //ko.cleanNode(document.getElementById("register"));
                                //ko.applyBindings(new MainModel(), document.getElementById("register"));
                                //model.member.Email(params.email);
                                setupReg();

                                if ($("body").hasClass("layoutG"))
                                {
                                    $("#register").fadeIn(250, 'easeInQuad', function()
                                    {
                                        scrollTo(0);
                                        if ($("#container").height() > 700) { $("footer").css("position", "relative") }
                                        rtm_unblockUI();
                                    });
                                }
                                else
                                {
                                    $("#register").fadeIn(250, 'easeInQuad', function()
                                    {
                                        rtm_unblockUI();
                                        scrollTo(0);
                                    });
                                }
                            });
                        }
                    });
                });
            }
            else if ($('body').hasClass('modalReg'))
            {
                openModalAspx("register", function()
                {
                    loadReg(params.email);
                    rtm_unblockUI();
                });
            } else
            {
                getAspx("register", function()
                {
                    $("#content_main").html(componentHtml);
                    scrollTo(0);

                    loadReg(params.email);

                    if ($("body").hasClass("layoutG"))
                    {
                        $("#register").fadeIn(250, 'easeInQuad', function()
                        {
                            if ($("#container").height() > 700) { $("footer").css("position", "relative"); }
                            rtm_unblockUI();
                        });
                    }
                    else
                    {
                        $("#register").fadeIn(250, 'easeInQuad');
                        rtm_unblockUI();
                    }
                });
            }
        }
    });
}

function loadReg(loginEmail)
{
    //ko.cleanNode(document.getElementById("register"));
    //ko.applyBindings(new MainModel(), document.getElementById("register"));
    //model.member.Email(loginEmail);
    userEmail = loginEmail;
    setupReg();
    rtm_unblockUI();
}

function returningUserPlay()
{
    if (memberId)
    {
        rtm_ajax("ReturningUserPlay", { memberId: memberId, playDate: playDate }, function(r)
        {
            var results = $.parseJSON(r);
            if (results.errors != "")
            {
                rtm_showAlert("Sorry", results.errors, false);
                //goHome();
            }
            else
            {
                if (results.sweeps) { entries = results.sweeps; entryCount(); }
                if (results.gameGuid) { setupGame(results)};
                goTAF(results.alreadyEntered);
            }
        });
    }
    else
    {
        rtm_showAlert("Sorry", "Member is not recognized, please login.", false);
        goHome();
    }
}

//Register Functions
function setupReg() {
    if (typeof (recaptcha) != "undefined") { captchaInjector('captchaBox'); }
    if (typeof (google) != "undefined") { initialize(); }

    regValidator = $("#registerForm").validate({ onkeyup: false, onfocusout: false, ignore: [], rules: {}, ignoreTitle: true, showErrors: function (errorMap, errorList) { rtm_showErrors(errorList); } });
    regValidator.settings.rules.phone = { required: true, minlength: 12, maxlength: 12 };
    if ($("#emailConfirm").is("*")) { regValidator.settings.rules.emailConfirm = { required: true, email: true, equal2: "#email" } }
    if ($("#apiAddr").is("*")) { regValidator.settings.rules.apiAddr = { required: true, requiredManualAddress: true }}
    if ($("#addr1").is("*")) { regValidator.settings.rules.addr1 = { required: true }; }
    if ($("#city").is("*")) { regValidator.settings.rules.city = { required: true }; }
    if ($("#state").is("*")) { regValidator.settings.rules.state = { required: true }; }
    if ($("#zip").is("*")) { regValidator.settings.rules.zip = { required: true, minlength: 5, maxlength: 5 }; }
    if ($("#dobY").is("*")) { regValidator.settings.rules.dobY = { required: true, datemultiple: ["#dobM", "#dobD", "#dobY"] }; }
    if ($("#prize1").is("*")) { regValidator.settings.rules.prizeSelectHidden = { prizeSelectRequired: true }; }
    if ($('body').hasClass('countryReg') ) { countrySelect(); }
    regValidator.resetForm();

    //$("#opt1").prop("checked", true);

    //if (model.member.Email().length > 0) { $("#email").prop("readonly", true).prop("disabled", true); }
    if (userEmail.length > 0) { $("#email").val(userEmail); $("#email").prop("readonly", true).prop("disabled", true); }

    $("#registerForm").keypress(function (e) { if (e.keyCode == 13 && e.target.type != "textarea") { $("#regSubmit").click(); return false; } });

    for (i = 1; i < 32; i++) {
        $("#dobD, #dobD2").append("<option value=\"" + i + "\">" + i + "</option");
    }

    for (i = new Date().getFullYear(); i > (new Date().getFullYear() - 112) ; i--) {
        $("#dobY, #dobY2").append("<option value=\"" + i + "\">" + i + "</option");
    }

    addPlaceholders();

    langSwitch()

    $("#phone, #mobile").mask("000-000-0000");

    $('#regSubmit').click(function () {
        var btn = $(this);
        if (!btn.prop("disabled") && $("#registerForm").valid()) {
            rtm_blockUI();
            btn.prop("disabled", true).css("opacity", 0.5);

            //member.Misc6 = $("input[name='vacation']:checked").val();
            member.FirstName = $("#fName").val();
            member.LastName = $("#lName").val();
            member.Email = $("#email").val();
            //member.Phone = $("#phone").val();
            member.Address1 = $("#addr1").val();
            member.Address2 = $("#addr2").val();
            member.City = $("#city").val();
            member.State = $("#state, #state2").val();
            member.PostalCode = $("#zip").val();
            //member.BirthDate = $("#dobM, #dobM2").val() + "/" + $("#dobD, #dobD2").val() + "/" + $("#dobY, #dobY2").val();
            //member.Optin1 = $("#opt1").prop("checked");
            member.SiteCode = isMobile ? "Mobile" : "Microsite";


            //model.member.SiteCode(isMobile ? "Mobile" : "Microsite");
            //mobel.member.Optin1(true); //auto optin

            var params = {
                member: member, // ko.toJS(model.member),
                fbUserID: allowFBLogin ? (fbUserID ? fbUserID : "") : "",
                signedRequest: allowFBLogin ? (signedRequest ? signedRequest : "") : "",
                twitterId: allowTWLogin ? (twitterUserId ? twitterUserId : "") : "",
                googleId: allowGPLogin ? (googleUserId ? googleUserId : "") : "",
                emailConfirm: $("#emailConfirm").is("*") ? $("#emailConfirm").val() : "",
                shareClickGuid: shareClickGuid || (typeof (rtmSocialAddressBarShareClickGuid) != "undefined" && rtmSocialAddressBarShareClickGuid ? rtmSocialAddressBarShareClickGuid : null),
                date: playDate,
                challenge: typeof (recaptcha) != "undefined" ? Recaptcha.get_challenge() : "",
                response: typeof (recaptcha) != "undefined" ? Recaptcha.get_response() : ""
            };

            rtm_ajax("Register", params, function (r) {
                var results = $.parseJSON(r);
                if (results.errors) { rtm_showAlert("Sorry", results.errors); btn.css("opacity", 1).prop("disabled", false); if (typeof (Recaptcha != "undefined")) { Recaptcha.reload(); } rtm_unblockUI(); }
                else if (results.memberId) {
                    memberId = results.memberId;

                    switch (member.Misc5)
                    {
                        case "BirdsAndBlooms":
                            $("body").addClass("bnb");
                            break;
                        case "TasteOfHome":
                            $("body").addClass("toh");
                            break;
                        case "ReadersDigest":
                            $("body").addClass("rd");
                            break;
                        case "FamilyHandyman":
                            $("body").addClass("fh");
                            break;
                    }

                    if (results.sweeps) { entries = results.sweeps; entryCount(); }
                    if (results.gameGuid) {setupGame(results)};
                    goTAF(results.alreadyEntered);
                }
            });
        }

        return false;
    });
}

function addrSwitch() {
    $('#apiAddress').slideUp(250, 'easeOutQuad', function () {
        $('#manualAddress').slideDown(250, 'easeInQuad');
    });
}

function countChar(val) {
    var len = val.value.length;
    if (len >= 300) { val.value = val.value.substring(0, 300); } else { $('#charNum').text(len + 1); }
}

function prizeSelect(prize, prizeType) {
    $('.selected').removeClass('selected');
    $('#' + prize).addClass('selected');
    member.Misc5 = prizeType;
}

function mobileNumber() {
    $('.mobileNumber').slideToggle(250, 'easeInQuad');
    if ($(".mobileNumber").parent().children(".optBox").children(":checkbox").prop("checked"))
    {
        regValidator.settings.rules.mobile = { required: true, minlength: 12, maxlength: 12 };
    }
    else
    {
        regValidator.settings.rules.mobile = { required: false };
    }

    regValidator.resetForm();
}

//function playGame() {
//    var params = {
//        currentMember:member, 
//        date: playDate
//    };

//    rtm_ajax("PlayGame", params, function (r) {
//        var results = $.parseJSON(r);
//        if (results.errors) { rtm_showAlert("Sorry", results.errors); btn.css("opacity", 1).prop("disabled", false); }
//        else
//        {
//            if (results.gameGuid) { setupGame(results) };

//            //if (callback) { callback(); }
//        }
//    });
//}

function goTAF()
{
    if ($('body').hasClass('tellAFriend'))
    {
        closeModal();

        getAspx("tellAFriend", function()
        {
            $("#content_main").html(componentHtml);
            scrollTo(0);

            ko.cleanNode(document.getElementById("taf"));
            ko.applyBindings(new TAFModel(), document.getElementById("taf"));

            tafValidator = $("#tafForm").validate({ onkeyup: false, onfocusout: false, rules: {}, ignoreTitle: true, showErrors: function(errorMap, errorList) { rtm_showErrors(errorList); } });
            tafValidator.resetForm();

            rtm_ajax("GetTAFShareCount", { memberId: memberId, playDate: playDate }, function(r)
            {
                var results = $.parseJSON(r);
                if (results.errors == "")
                {
                    tafModel.alreadySubmittedCount(parseInt(results.shareCount));
                }
            });

            $("#taf").fadeIn(250, 'easeInQuad', function()
            {
                if ($("body").hasClass("entryCount"))
                {
                    if (!$('#entryCount').length) { entryCount(); }
                }

                addPlaceholders();

                i = 5

            });

        });
    }
    else { goGame(); }
}

function setupGame(results)
{
    gameGuid = results.gameGuid;
    win = results.playResult == "w";
    prizeWin = results.prizeId;
    prizeDesc = results.prizeDescription;
    prizeID = results.prizeWheelId;
    playsRemainingPromo = parseInt(results.playsRemainingPromo);
    playsRemainingDaily = parseInt(results.playsRemainingDaily);
}

function goGame()
{
    closeModal();
    $("body").removeClass("TAFpage");

    getAspx("game", function()
    {
        
        $("#content_main").html(componentHtml);
        if ((returningUser == null || returningUser == false || returningUser == "false") && !directToGame)
        {
            //if not a returning user, do not allow to skip the game
            $(".gameSkip").remove();
        }

        $("#game").fadeIn(250, 'easeInQuad', function()
        {

            loadGame();

            scrollTo($("#game").offset().top - 20);

        });

    });
}

function gameEnd()
{
    $('.gameArea').append('<div id="dialog"></div>');
    fader('show');

    if (win == true || win == "true")
    {
        endCopy = '<h2 class="primaryLang primary">Congratulations! You are one of today\'s Instant Winners.<br>You won<br><span id="prizeWinName">' + prizeDesc + '</span>!</h2>'
            + '<h2 class="secondLang primary">Felicitaciones, usted es un ganador!<br>Has ganado <span class="prizeDesc"></span>!</h2>'
            + '<p class="primaryLang">Thank you for playing the <strong>Dream Big Daily Instant Win</strong>.  You will receive the exciting prize details very soon, so keep an eye on your email.</p>'
            + '<p class="primaryLang">And we have more good news for you...</p>'
            + '<a href="javascript:void(0)" id="thanksBtn" class="btn continue gameContinueBtn">'
                + '<span class="btnTxt primaryLang">Continue</span>'
                + '<span class="btnTxt secondLang">Continuar</span>'
                + '<span class="btnIcon socicon">L</span>'
            + '</a>';
    }
    else
    {
        endCopy = '<h2 class="primaryLang primary">Sorry, your spin is not a winner</h2>'
            + '<h2 class="secondLang primary">Lo sentimos no eres un ganador instant&aacute;neo.<br>Vuelve para un ma&ntilde;ana oportunidad!</h2>'
            + '<p class="primaryLang">Thank you for playing the <strong>Dream Big Daily Instant Win</strong>.  Make sure to come back each day for additional chances to win.  Tomorrow we\'ll select more winners!</p>'
            + '<p class="primaryLang">Even though you didn\'t win today, we have a special surprise for you!</p>'
            + '<a href="javascript:void(0)" id="thanksBtn" class="btn continue gameContinueBtn">'
                + '<span class="btnTxt primaryLang">Continue</span>'
                + '<span class="btnTxt secondLang">Continuar</span>'
                + '<span class="btnIcon socicon">L</span>'
            + '</a>';
    }
    $('#dialog').html(endCopy).hide().fadeTo(400, '1');
    if ($("body").hasClass("layoutC") || $("body").hasClass("layoutG"))
    {
        $("#content_main").animate({ scrollTop: $('#dialog').offset().top - 60 }, 1000)
    }
    else
    {
        $("html, body").animate({ scrollTop: $('#dialog').offset().top - 60 }, 1000)
    }
    $(".prizeDesc").html(prizeDesc)

    //If went directly to the game, don't go to the thanks/redeem page
    if (directToGame == null || (directToGame != true && directToGame != "true" && directToGame != "True"))
    {
        $("#thanksBtn").click(function()
        {
            if ($('body').hasClass('prizeRedeem') && (win == true || win == "true")) { goRedeem(); }
            else { goThanks(); }
        });
    }
}

function goThanks()
{
    
    closeModal();
    getAspx("thanks", function () {
        $("#content_main").html(componentHtml);
        scrollTo(0);

        var ins = (navigator && navigator.userAgent && navigator.userAgent.indexOf("Trident/7") == -1 && navigator.userAgent.indexOf("MSIE") == -1) ? "%27" : "";

        rtmSocialSettings = {
            memberId: memberId,
            url: siteUrl[siteUrl.length - 1] == "/" ? siteUrl.substring(0, siteUrl.length - 1) : siteUrl,
            shareTargetName: "Homepage",
            shareSource: "Thanks",
            platforms: [
                { platform: "FACEBOOK", selector: "#fbThanksShare", title: "Now's your chance to Dream BIG!", description: "Dream Big and Win Big. You could win $10,000 and make your dreams come true.  Plus \"spin to win\" every day for any of 450 Instant Win prizes. Will you become one of today's wins?  Hurry and enter now!", image: rtmSiteUrl + "images/RD-Share-FB.jpg", dontOpen: isFacebookMobileApp },
                { platform: "TWITTER", selector: "#twThanksShare", description: "Spin to Win for any of 450 instant win prizes plus the Dream Big prize of $10,000 {url}", dontOpen: isFacebookMobileApp },
                { platform: "PINTEREST", selector: "#pinThanksShare", description: "What would you do with $10,000?  Dream Big and you could win BIG.  Enter today and you could be the Grand Prize winner of $10,000!  Plus instant winners named every day.  Hurry!", image: rtmSiteUrl + "images/RD-Share-Pin.jpg", dontOpen: isFacebookMobileApp },
                { platform: "GOOGLEPLUS", selector: "#gThanksShare", title: "Google Plus title share copy here", description: "Google Plus description share copy here", image: rtmSiteUrl + "images/g_share_image.jpg", dontOpen: isFacebookMobileApp },
                { platform: "EMAIL", selector: "#emailThanksShare", subject: "Email Subject!", content: "Email description share copy here!<br><a href=\"{PROMOTION URL}\" target=\"_blank\">Click here</a> to enter now.", dontOpen: isFacebookMobileApp }
            ]
        };

        if (typeof setupRealtimeSocial == "function") { setupRealtimeSocial(); }

        if ($("#urlCopy").is("*"))
        {
            rtm_ajax("GetThanksPageShareUrl", { memberId: memberId, playDate: playDate }, function(r)
            {
                var results = $.parseJSON(r);
                if (results.errors == "")
                {
                    $("#urlCopy, #urlCopy2").val(results.shareUrl);
                    $("#urlCopy, #urlCopy2").bind("click", function() { this.setSelectionRange(0, this.value.length); });
                }
            });
        }

        $("#thanks").fadeIn(250, 'easeInQuad', function() {
            entryCount();
            $(".visitSite").unbind().bind("click", function () {                
                ga('send', 'event', 'Click Coupon', "Link", $(this).attr("data-linktype"));
                
            });

            $("body").append("<script>(function() {" +
                "var _fbq = window._fbq || (window._fbq = []);" +
                "if (!_fbq.loaded) {" +
                "    var fbds = document.createElement('script');" +
                "    fbds.async = true;" +
                "    fbds.src = '//connect.facebook.net/en_US/fbds.js';" +
                "    var s = document.getElementsByTagName('script')[0];" +
                "    s.parentNode.insertBefore(fbds, s);" +
                "    _fbq.loaded = true;" +
                "}" +
            "})();" +
           " window._fbq = window._fbq || [];" +
            "window._fbq.push(['track', '6033380603704', {'value':'0.00','currency':'USD'}]);" +
           " </script>" +
           " <noscript><img height='1' width='1' alt='' style='display:none' src='https://www.facebook.com/tr?ev=6033380603704&amp;cd[value]=0.00&amp;cd[currency]=USD&amp;noscript=1' /></noscript>" 
            );
        });

        //Load facebook like button
        //try { FB.XFBML.parse(); } catch (ex) { }

        //Load twitter follow button
        //twttr.widgets.load();

        //Load googl+ follow button
        //if (typeof gapi != 'undefined' && gapi) { gapi.follow.go(); }

        //Load pintrest follow button
        //window.parsePins();

    });
}

function goRedeem()
{
    rtm_ajax("GetMemberForRedeem", { gameGuid: gameGuid }, function(r)
    {
        rtm_blockUI();
        var results = $.parseJSON(r);
        if (results.errors != "")
        {
            rtm_showAlert("Sorry", results.errors, false);
            //Do something here...
            rtm_unblockUI();
        }
        else if (results.alreadyRedeemed)
        {
            rtm_showAlert("Sorry", "This prize has already been redeemed.", false);
            goHome();
            rtm_unblockUI();
        }
        else
        {
            getAspx("redeem", function()
            {
                if (memberId == null || memberId == "")
                {
                    memberId = results.redeemMember.MemberId;
                }

                $("#content_main").html(componentHtml);

               // ko.cleanNode(document.getElementById("register"));
               // ko.applyBindings(new MainModel(), document.getElementById("register"));
               // ko.mapping.fromJS(results.redeemMember, model.member)

                setupRedeemForm(results);
            });
        }
    });
}

function setupRedeemForm(redeemResults)
{
    rtm_blockUI();

    regValidator = $("#registerForm").validate({ onkeyup: false, onfocusout: false, ignore: [], rules: {}, ignoreTitle: true, showErrors: function(errorMap, errorList) { rtm_showErrors(errorList); } });
    regValidator.settings.rules.phone = { required: true, minlength: 12, maxlength: 12 };
    if ($("#emailConfirm").is("*")) { regValidator.settings.rules.emailConfirm = { required: true, email: true, equalTo: "#email" }}
    if ($("#apiAddr").is("*")) { regValidator.settings.rules.apiAddr = { required: true, requiredManualAddress: true } }
    if ($("#addr1").is("*")) { regValidator.settings.rules.addr1 = { required: true }; }
    if ($("#city").is("*")) { regValidator.settings.rules.city = { required: true }; }
    if ($("#state").is("*")) { regValidator.settings.rules.state = { required: true }; }
    if ($("#zip").is("*")) { regValidator.settings.rules.zip = { required: true, minlength: 5, maxlength: 5 }; }
   // if ($("#dobY").is("*")) { regValidator.settings.rules.dobY = { required: true, datemultiple: ["#dobM", "#dobD", "#dobY"] }; }
    if ($("#prize1").is("*")) { regValidator.settings.rules.prizeSelectHidden = { prizeSelectRequired: true }; }
    regValidator.resetForm();

    //if (model.member.Email().length > 0) { $("#email").prop("readonly", true).prop("disabled", true); }
    redeemMember = redeemResults.redeemMember;

    //redeemMember.Misc6 = $("input[name='vacation']:checked").val();
    $("#fName").val(redeemMember.FirstName);
    $("#lName").val(redeemMember.LastName);
    $("#email").val(redeemMember.Email);
    $("#phone").val(redeemMember.Phone);
    $("#addr1").val(redeemMember.Address1);
    $("#addr2").val(redeemMember.Address2);
    $("#city").val(redeemMember.City);
    $("#state, #state2").val(redeemMember.State);
    $("#zip").val(redeemMember.PostalCode);
    //redeemMember.BirthDate = $("#dobM, #dobM2").val() + "/" + $("#dobD, #dobD2").val() + "/" + $("#dobY, #dobY2").val();
   // var tempBDate = dateFix(redeemMember.BirthDate);
    //$("#dobY, #dobY2").val(tempBDate.getFullYear());
    //$("#dobM, #dobM2").val(tempBDate.getMonth() + 1);
    //$("#dobD, #dobD2").val(tempBDate.getDate());
   // $("#opt1").prop("checked", redeemMember.Optin1);

    //if (model.member.Email().length > 0) { $("#email").prop("readonly", true).prop("disabled", true); }
    if ($("#email").val() != "") { $("#email").prop("readonly", true).prop("disabled", true); }


    $("#registerForm").keypress(function(e) { if (e.keyCode == 13 && e.target.type != "textarea") { $("#regSubmit").click(); return false; } });

    //for (i = 1; i < 32; i++)
    //{
    //    $("#dobD, #dobD2").append("<option value=\"" + i + "\">" + i + "</option");
    //}

    //for (i = new Date().getFullYear() ; i > (new Date().getFullYear() - 112) ; i--)
    //{
    //    $("#dobY, #dobY2").append("<option value=\"" + i + "\">" + i + "</option");
    //}

    if ($("#addr1").val() != "")
    {
        addrSwitch();
    }

    //if (member.Misc5() != null && member.Misc5 != "")
    //{
    //    $("#prizeSelectHolder .prizeSelect[data-value='" + model.member.Misc5() + "']").click();
    //}

    //if (redeemResults.redeemMember != null && redeemResults.redeemMember.BirthDate != null)
    //{
    //    var tempBDate = dateFix(redeemResults.redeemMember.BirthDate)
    //    model.member.Year(tempBDate.getFullYear());
    //    model.member.Month(tempBDate.getMonth() + 1);
    //    model.member.Day(tempBDate.getDate());
    //}

    addPlaceholders();
    langSwitch()
    scrollTo(0);


    $("#phone, #mobile").mask("000-000-0000");

    $("#register").fadeIn(250, 'easeInQuad', function()
    {
        $("#regSubmit").click(function()
        {
            if (!$("regSubmit").prop("disabled") && $("#registerForm").valid())
            {
                $("#regSubmit").prop("disabled", true).css("opacity", 0.5);

                //model.member.DateCreated(dateFix(model.member.DateCreated()));
                //model.member.LastChanged(dateFix(model.member.LastChanged()));

                member.FirstName = $("#fName").val();
                member.LastName = $("#lName").val();
                member.Email = $("#email").val();
                //member.Phone = $("#phone").val();
                member.Address1 = $("#addr1").val();
                member.Address2 = $("#addr2").val();
                member.City = $("#city").val();
                member.State = $("#state, #state2").val();
                member.PostalCode = $("#zip").val();
               // member.BirthDate = $("#dobM, #dobM2").val() + "/" + $("#dobD, #dobD2").val() + "/" + $("#dobY, #dobY2").val();


                var redeemParams = {
                    gameGuid: gameGuid,
                    member: member, // ko.toJS(model.member),
                    emailConfirm: $("#emailConfirm").is("*") ? $("#emailConfirm").val() : "",
                    playDate: playDate
                };

                //if (model.member.BirthDate != null)
                //{
                //    redeemParams.member.BirthDate = dateFix(model.member.BirthDate);
                //}

                rtm_ajax("RedeemPrize", redeemParams, function(r)
                {
                    var redeemResults = $.parseJSON(r);
                    if (redeemResults.errors != "")
                    {
                        rtm_showAlert("Sorry", redeemResults.errors, false);
                        $("#regSubmit").prop("disabled", false).css("opacity", 1.0);
                    }
                    else
                    {
                        goThanks();
                    }
                });
            }
        });

        rtm_unblockUI();

    });
}

function welcomeBack() {
    entryCount();

    getAspx("welcomeBack", function()
    {
        $("#content_main").html(componentHtml);
        scrollTo(0);
        addPlaceholders();

        $("#welcomeBack").fadeIn(250, 'easeInQuad', function () {
            //$("memberName").html(member.FirstName);
            $("#memberName").html(memberFirstName);
            rtm_unblockUI();
        });

        if ($("body").hasClass("featuredPrize"))
        {
            rtm_ajax("GetFeaturedPrize", { playDate: playDate }, function(r)
            {
                var results = $.parseJSON(r);
                //if errors getting featured prize, just ignore the whole thing
                if (results.errors == "")
                {
                    $("#featuredPrizeContainer #featuredPrizeImg").attr("src", results.featuredImage);
                    $("#featuredPrizeContainer #featuredCopy #featuredDescrip").html(results.featuredDescription);
                    $("#featuredPrizeContainer").show();
                }
            });
        }

        
    });
}
