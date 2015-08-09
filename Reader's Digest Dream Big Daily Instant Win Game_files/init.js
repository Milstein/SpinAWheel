var rtmSocialUniqueId = "gd5UhdIY5iff", rtmSocialAddressBarShareClickGuid = ""; rtmSocialFbCompleted = false, rtmSocialInitialTwitterLoad = true, rtmSocialSettingsExtended = null;
var rtmSocialPlatforms = { FACEBOOK: { id: 0, display: "Facebook", width: 550, height: 350 }, TWITTER: { id: 1, display: "Twitter" }, PINTEREST: { id: 2, display: "Pinterest", width: 754, height: 333 }, EMAIL: { id: 3, display: "Email" }, GOOGLEPLUS: { id: 4, display: "Google+", width: 400, height: 300 }, LINKEDIN: { id: 6, display: "LinkedIn", width: 520, height: 370 }, TUMBLR: { id: 7, display: "Tumblr", width: 450, height: 400 }, STUMBLEUPON: { id: 8, display: "StumbleUpon", width: 800, height: 560 }, GMAIL: { id: 9, display: "Gmail", width: 500, height: 500 }, YMAIL: { id: 10, display: "Y!Mail", width: 1020, height: 600 }, AOLMAIL: { id: 11, display: "AOLMail", width: 550, height: 300 }, OUTLOOK: { id: 12, display: "Outlook", width: 550, height: 500 }, DELICIOUS: { id: 13, display: "Delicious", width: 550, height: 410 } };
var isCookieEnabled = IsCookieEnabled();
//logToConsole('isCookieEnabled=' + isCookieEnabled);

var rtmSocialSettingsDefaults = {
    appId: "",
    siteUrl: "",
    memberId: "",
    url: null,
    shareCallback: null,
    showCounterAfter: null,
    shareTargetName: "",
    shareSource: "",
    addressBarSharing: true,
    appendUrl: true,
    decodeTwitter: true,
    emailSubjectDecoded: false,
    lang: "EN",
    platforms: [],
    // BELOW PROPERTIES ARE NOW OBSOLETE
    twitterSelector: null, facebookSelector: null, pinterestSelector: null, googlePlusSelector: null, emailSelector: null, title: null, facebookDescription: null, twitterDescription: null, pinterestDescription: null, emailFrom: null, emailSubject: null, emailContent: null, facebookImage: null, pinterestImage: null
};

var rtmSocialPlatformSettingsDefaults = { platform: -1, selector: "", title: "", description: "", image: "", type: "", from: "", subject: "", content: "", window: null, timer: null, shareGuid: null, dontOpen: false };
setupRealtimeSocial();

function setupRealtimeSocial() {
    if (typeof rtmSocialSettings != "undefined") {
        if (!$.isArray(rtmSocialSettings)) {
            var rtmTmp = rtmSocialSettings;
            rtmSocialSettings = [];
            rtmSocialSettings.push(rtmTmp);
        }

        rtmSocialSettingsExtended = [];

        if (rtmSocialSettings.length) {
            var ct = 0;
            $.each(rtmSocialSettings, function () {
                var obj = $.extend({}, rtmSocialSettingsDefaults, this);

                // merge obsolete settings to new format
                if (obj.facebookSelector) { obj.platforms.push($.extend({}, rtmSocialPlatformSettingsDefaults, { platform: rtmSocialPlatforms.FACEBOOK, selector: obj.facebookSelector, title: obj.title, description: obj.facebookDescription, image: obj.facebookImage })); }
                if (obj.twitterSelector) { obj.platforms.push($.extend({}, rtmSocialPlatformSettingsDefaults, { platform: rtmSocialPlatforms.TWITTER, selector: obj.twitterSelector, description: obj.twitterDescription })); }
                if (obj.pinterestSelector) { obj.platforms.push($.extend({}, rtmSocialPlatformSettingsDefaults, { platform: rtmSocialPlatforms.PINTEREST, selector: obj.pinterestSelector, description: obj.pinterestDescription, image: obj.pinterestImage })); }
                if (obj.emailSelector) { obj.platforms.push($.extend({}, rtmSocialPlatformSettingsDefaults, { platform: rtmSocialPlatforms.EMAIL, selector: obj.emailSelector, from: obj.emailFrom, subject: obj.emailSubject, content: obj.emailContent })); }
                if (obj.googlePlusSelector) { obj.platforms.push($.extend({}, rtmSocialPlatformSettingsDefaults, { platform: rtmSocialPlatforms.GOOGLEPLUS, selector: obj.googlePlusSelector })); }

                ct++;

                if (ct == 1 && ((obj.addressBarSharing == undefined || obj.addressBarSharing) && window.location && window.location.href && window.location.href.indexOf("#.") != -1 && _rtmSocial && _rtmSocial.promotionId && _rtmSocial.baseUrl && window.location.hash.replace("#.", ""))) {
                    if (!document.referrer || document.referrer.indexOf(window.location.protocol + "//" + window.location.host) == -1) {
                        var rtmSocialCookie = rtmSocialGetCookie("share_" + _rtmSocial.promotionId);
                        if (!rtmSocialCookie || (rtmSocialCookie && rtmSocialCookie.indexOf(window.location.hash.replace("#.", "")) == -1)) {
                            if (isCookieEnabled) { //add to check write cookie successfully or not
                                var params = "promotionId=" + _rtmSocial.promotionId + "&memberId=" + obj.memberId + "&appId=&shareUrl=&shareTargetName=" + obj.shareTargetName + "&shareSource=" + (obj.shareSource ? obj.shareSource : escape(window.location.pathname)) + "&uniqueId=" + window.location.hash.replace("#.", "");
                                $.getJSON(_rtmSocial.baseUrl + "AddressBarShare?" + params + "&callback=?", function (results) {
                                    if (results.error != "") { console.warn("-- Realtime Social Error (Share) --\n" + results.error); }
                                    else if (results.shareClickGuid) { rtmSocialAddressBarShareClickGuid = results.shareClickGuid; }
                                });
                            }
                        }
                    }
                }

                rtmSocialSettingsExtended.push(obj);
                setupRealtimeSocialObj(obj);
            });
        }
    }
}

function setupRealtimeSocialObj(obj) {
    if ((obj.addressBarSharing == undefined || obj.addressBarSharing) && window.location && window.location.href && (window.location.href.indexOf("#") == -1 || window.location.href.indexOf("#.") != -1)) {
        var rtmSocialCookie = rtmSocialGetCookie("share_" + _rtmSocial.promotionId);
        //var cookieValue = (rtmSocialCookie && rtmSocialCookie.indexOf(rtmSocialUniqueId) == -1 ? rtmSocialCookie + "," + rtmSocialUniqueId : rtmSocialUniqueId);
        //change for fb iframe that people click next page which load share again, have same #hash
        var cookieValue = (rtmSocialCookie ? (rtmSocialCookie.indexOf(rtmSocialUniqueId) == -1 ? rtmSocialCookie + "," + rtmSocialUniqueId : rtmSocialCookie) : rtmSocialUniqueId);
        if (cookieValue.indexOf(window.location.hash.replace("#.", "")) == -1) { cookieValue += "," + window.location.hash.replace("#.", ""); }

        //document.cookie = "share_" + _rtmSocial.promotionId + "=" + cookieValue;  //original one
        var expires = new Date();
        expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
        document.cookie = "share_" + _rtmSocial.promotionId + "=" + cookieValue + ';expires=' + expires.toUTCString();
        //$.cookie("share_" + _rtmSocial.promotionId, cookieValue, { expires: 365, path: "/" });
        //$.cookie("share_" + _rtmSocial.promotionId, cookieValue, { expires: 365 });
        window.location = "#." + rtmSocialUniqueId;
    }

    if (!_rtmSocial) { console.warn("-- Realtime Social Error --\n_rtmSocial variable not created"); return; }
    else if (!_rtmSocial.promotionId) { console.warn("-- Realtime Social Error --\n_rtmSocial promotionId not set"); return; }
    else if (!_rtmSocial.baseUrl) { console.warn("-- Realtime Social Error --\n_rtmSocial baseUrl not set"); return; }

    $.each(obj.platforms, function () {
        var curPlatform = this;
        $.each(rtmSocialPlatforms, function (x, y) { if (curPlatform.platform.toString().toLowerCase() == x.toString().toLowerCase()) { curPlatform.platform = y; } });

        if (curPlatform.platform.id == rtmSocialPlatforms.TWITTER.id) {
            if (!window.twttr) { window.twttr = (function (d, s, id) { var t, js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return; js = d.createElement(s); js.id = id; js.src = "//platform.twitter.com/widgets.js"; fjs.parentNode.insertBefore(js, fjs); return window.twttr || (t = { _e: [], ready: function (f) { t._e.push(f) } }); }(document, "script", "twitter-wjs")); }

            createTwitterUrl(obj, curPlatform);

            if (rtmSocialInitialTwitterLoad) {
                rtmSocialInitialTwitterLoad = false;

                twttr.ready(function (twttr) {
                    twttr.events.bind("tweet", function (event) {
                        var foundPlatform = null;
                        var tmpCurrentSettings = null;
                        $.each(rtmSocialSettingsExtended, function () {
                            tmpCurrentSettings = this;
                            $.each(tmpCurrentSettings.platforms, function () {
                                if (this.platform.id == rtmSocialPlatforms.TWITTER.id && $(event.target).get(0) == $(this.selector).get(0)) {
                                    foundPlatform = this;
                                    return;
                                }
                            });

                            if (foundPlatform) { return; }
                        });

                        if (foundPlatform) {
                            var params = "promotionId=" + _rtmSocial.promotionId + "&shareGuid=" + foundPlatform.shareGuid;
                            $.getJSON(_rtmSocial.baseUrl + "MarkCompleted?" + params + "&callback=?", function (results) {
                                if (results.error == "") {
                                    createTwitterUrl(tmpCurrentSettings, foundPlatform);

                                    if (tmpCurrentSettings.shareCallback) { window[tmpCurrentSettings.shareCallback](foundPlatform.platform.display, "Shared", tmpCurrentSettings.url || (location.protocol + "//" + location.host + location.pathname), location.pathname); }
                                }
                                else { console.warn("-- Realtime Social Error (MarkCompleted) --\n" + results.error); }
                            });
                        }
                    });
                });
            }
        }

        $(curPlatform.selector).off("click").on("click", function () {
            if (curPlatform.platform.width && curPlatform.platform.height && !curPlatform.dontOpen) {
                curPlatform.window = window.open(_rtmSocial.baseUrl, "", "menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=" + curPlatform.platform.height + ",width=" + curPlatform.platform.width);
            }

            else if (curPlatform.platform.id == rtmSocialPlatforms.EMAIL.id) {
                curPlatform.subject = curPlatform.subject.replace(/\"/g, "&quot;");
                //console.log(curPlatform.from);
                //var emailShareBody = "<strong>Your Email Address</strong><br /><input type=\"text\" id=\"rtmSocialFromEmail\" name=\"rtmSocialFromEmail\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif; margin-bottom: 10px\" value=\"" + (curPlatform.from && curPlatform.from.indexOf("promosupport.com") == -1 ? curPlatform.from : "") + "\" /><strong>Email Addresses to Send To <i>(separate with commas)</i></strong><br /><textarea id=\"rtmSocialEmailSendTo\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif; margin-bottom: 10px\"></textarea><strong>Subject</strong><br /><input type=\"text\" id=\"rtmSocialEmailSubject\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif; margin-bottom: 10px\" value=\"" + (obj.emailSubjectDecoded ? decodeURIComponent(curPlatform.subject.replace(/%26/g, "&")) : curPlatform.subject.replace(/%26/g, "&")) + "\" /><strong>Email Preview</strong><br /><div style=\"border: solid 1px gainsboro; padding: 5px; margin-bottom: 10px\">" + curPlatform.content.replace(/{PROMOTION URL}/g, "#").replace(/%26/g, "&amp;") + "</div><strong>Additional Message</strong><br /><textarea id=\"rtmSocialEmailContent\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif;\"></textarea>";

                var emailShareBody = "<strong>Your Name</strong><br /><input type=\"text\" id=\"rtmSocialFromName\" name=\"rtmSocialFromName\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif; margin-bottom: 10px\" value=\"" + (curPlatform.from && curPlatform.from.indexOf("promosupport.com") == -1 ? curPlatform.from : "") + "\" />" +
                    "<strong>Your Email Address</strong><br /><input type=\"text\" id=\"rtmSocialFromEmail\" name=\"rtmSocialFromEmail\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif; margin-bottom: 10px\" value=\"" + (curPlatform.from && curPlatform.from.indexOf("promosupport.com") == -1 ? curPlatform.from : "") + "\" /><strong>Email Addresses to Send To <i>(separate with commas)</i></strong><br /><textarea id=\"rtmSocialEmailSendTo\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif; margin-bottom: 10px\"></textarea><strong>Subject</strong><br /><input type=\"text\" id=\"rtmSocialEmailSubject\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif; margin-bottom: 10px\" value=\"" + (obj.emailSubjectDecoded ? decodeURIComponent(curPlatform.subject.replace(/%26/g, "&")) : curPlatform.subject.replace(/%26/g, "&")) + "\" /><strong>Email Preview</strong><br /><div style=\"border: solid 1px gainsboro; padding: 5px; margin-bottom: 10px\">" + curPlatform.content.replace(/{PROMOTION URL}/g, "#").replace(/%26/g, "&amp;") + "</div><strong>Additional Message</strong><br /><textarea id=\"rtmSocialEmailContent\" style=\"width: 98%; font-size: 10pt; border: solid 1px gainsboro; border-radius: 0; padding: 3px; font-family: Trebuchet MS, Tahoma, Verdana, Arial, sans-serif;\"></textarea>";

                $("<div id=\"rtmSocialDialog\" title='Share By Email' style='font-size: 10pt; text-align: left'><style>.ui-dialog{font-size: 10pt;}</style>" + emailShareBody + "</div>").dialog({
                    modal: true,
                    height: $(window).height() < 420 ? "auto" : 425,
                    width: $(window).width() < 650 ? "95%" : 500,
                    buttons: {
                        Send: function () {
                            if ($("#rtmSocialEmailSendTo").val() && $("#rtmSocialFromName").val() &&$("#rtmSocialFromEmail").val() && isValidEmailAddress($("#rtmSocialFromEmail").val())) {
                                $("#rtmSocialDialog").parent().children(".ui-dialog-buttonpane").children().children().button("disable");
                                var params = "promotionId=" + _rtmSocial.promotionId + "&memberId=" + obj.memberId + "&appId=&siteUrl=&shareUrl=" + escape(obj.url || (location.protocol + "//" + location.host + location.pathname)) + "&shareType=3&emails=" + escape($("#rtmSocialEmailSendTo").val()) + "&promoSupport=" + (curPlatform.from && curPlatform.from.indexOf("promosupport.com") != -1 ? escape(curPlatform.from.replace(/&/g, "%26")) : "") +  "&emailFrom=" + $("#rtmSocialFromEmail").val() + "&emailFromName=" + escape($("#rtmSocialFromName").val().replace(/&/g, "%26")) + "&title=" + escape(curPlatform.subject.replace(/&/g, "%26")) + "&description=" + encodeURI(curPlatform.content.replace(/#/g, "%23") + ($("#rtmSocialEmailContent").val() ? "<hr />" + $("#rtmSocialEmailContent").val() : "")) + "&image=&createdShareGuid=&shareTargetName=" + obj.shareTargetName + "&shareSource=" + obj.shareSource + "&lang=" + (obj.lang || "EN");
                                $.getJSON(_rtmSocial.baseUrl + "Share?" + params + "&callback=?", function (results) {
                                    if (results.error != "") { console.warn("-- Realtime Social Error (Share) --\n" + results.error); }
                                    else {
                                        if (obj.shareCallback) { window[obj.shareCallback](curPlatform.platform.display, "Shared", obj.url || (location.protocol + "//" + location.host + location.pathname), location.pathname, results.emailsSent); }

                                        $("#rtmSocialDialog").html("<div style='font-size: 10pt; text-align: left; margin-top: 10px'><style>.ui-dialog{font-size: 10pt;}</style>Emails were successfully sent.</div>").dialog("option", "height", 140);
                                        setTimeout(function () { $("#rtmSocialDialog").dialog("close"); }, 2000);
                                    }
                                });
                            }
                        }
                    },
                    open: function () { $("#rtmSocialDialog a").attr("href", "#").css("color", "#333333").css("cursor", "text").click(function (e) { e.preventDefault(); }); },
                    close: function () { $(this).remove(); }
                });
            }

            if (curPlatform.platform.id != rtmSocialPlatforms.EMAIL.id) {
                if (curPlatform.platform.id == rtmSocialPlatforms.PINTEREST.id) { curPlatform.description = curPlatform.description.replace(/#/g, "%23"); }
                var params = "promotionId=" + _rtmSocial.promotionId + "&memberId=" + obj.memberId + "&appId=" + (obj.appId || "") + "&siteUrl=" + ((obj.siteUrl && escape(obj.siteUrl)) || "") + "&shareUrl=" + escape(obj.url || (location.protocol + "//" + location.host + location.pathname)) + "&shareType=" + curPlatform.platform.id + "&title=" + (curPlatform.title ? escape(curPlatform.title) : curPlatform.subject ? escape(curPlatform.subject) : "") + "&description=" + (curPlatform.description ? escape(curPlatform.description) : curPlatform.content ? escape(curPlatform.content) : "") + "&image=" + (curPlatform.image || "") + "&type=" + (curPlatform.type || "") + "&createdShareGuid=" + (curPlatform.shareGuid || "") + "&shareTargetName=" + (encodeURI(obj.shareTargetName) || "") + "&shareSource=" + (encodeURI(obj.shareSource) || "") + "&lang=" + (obj.lang || "EN");
                $.getJSON(_rtmSocial.baseUrl + "Share?" + params + "&callback=?", function (results) {
                    if (results.error != "") { console.warn("-- Realtime Social Error (Share) --\n" + results.error); }
                    else if (results.url) {
                        if (curPlatform.platform.id == rtmSocialPlatforms.FACEBOOK.id) {
                            rtmSocialFbCompleted = false;
                            curPlatform.shareGuid = results.shareGuid;
                            if (curPlatform.dontOpen) { window.location.href = results.url + (results.url.indexOf("?") != -1 ? "&" : "?") + "display=" + (screen.width < 700 ? "touch" : "popup"); }
                            else {
                                curPlatform.window.location.href = results.url + (results.url.indexOf("?") != -1 ? "&" : "?") + "display=" + (screen.width < 700 ? "touch" : "popup");
                                curPlatform.timer = setTimeout(function () { rtmSocialMonitorWindow(obj, curPlatform); }, 1000);
                            }
                        }
                        else if (curPlatform.dontOpen) {
                            window.location.href = results.url;
                        }
                        else if (curPlatform.window) {
                            if (curPlatform.platform.id == rtmSocialPlatforms.GOOGLEPLUS.id) {
                                curPlatform.window.location.href = results.url + "%26shareTitle%3D" + escape((curPlatform.title ? escape(curPlatform.title) : curPlatform.subject ? escape(curPlatform.subject) : "")) + "%26shareDesc%3D" + escape((curPlatform.description ? escape(curPlatform.description) : curPlatform.content ? escape(curPlatform.content) : "")) + "%26shareImg%3D" + escape((curPlatform.image || ""));
                            }
                            else { curPlatform.window.location.href = results.url; }

                            if (obj.shareCallback) { window[obj.shareCallback](curPlatform.platform.display, "Shared", obj.url || (location.protocol + "//" + location.host + location.pathname), location.pathname); }
                        }
                    }
                });
            }

            if (curPlatform.platform.id != rtmSocialPlatforms.TWITTER.id) { return false; }
        });
    });

    if (obj.showCounterAfter) {
        var params = "promotionId=" + _rtmSocial.promotionId + "&shareUrl=" + escape(obj.url || (location.protocol + "//" + location.host + location.pathname));
        $.getJSON(_rtmSocial.baseUrl + "GetShareTotal?" + params + "&callback=?", function (results) {
            if (results.error != "") { console.warn("-- Realtime Social Error (GetShareTotal) --\n" + results.error); }
            else {
                $(obj.showCounterAfter).append("<div id=\"rtmSocialCount\" style='font-size: 10px; color: #666; margin: 2px 3px; float: left; text-align: center; width: 46px; padding: 0px; padding-left: 1px; padding-top: 3px; height: 20px; font-family: arial,sans-serif; background: url(" + _rtmSocial.baseUrl.replace("webmethods.aspx/", "images/bubble.png") + ") no-repeat'>" + results.total + "</div>");
                $.each(obj.platforms, function () { $(this.selector).show(); });
            }
        });
    }
    else { $.each(obj.platforms, function () { $(this.selector).show(); }); }
}

function createTwitterUrl(obj, curPlatform) {
    var params = "promotionId=" + _rtmSocial.promotionId + "&memberId=" + obj.memberId + "&shareUrl=" + escape(obj.url || (location.protocol + "//" + location.host + location.pathname)) + "&shareType=1&title=&description=" + (obj.decodeTwitter ? escape(decodeURIComponent(curPlatform.description)) : curPlatform.description) + "&image=&shareTargetName=" + obj.shareTargetName + "&appendUrl=" + obj.appendUrl;
    $.getJSON(_rtmSocial.baseUrl + "GetShareUrl?" + params + "&callback=?", function (results) {
        if (results.error != "") { console.warn("-- Realtime Social Error (createTwitterUrl) --\n" + results.error); }
        else if (results.url != null) {
            curPlatform.shareGuid = results.shareGuid;
            $(curPlatform.selector).attr("href", results.url);
        }
    });
}

function rtmSocialMonitorWindow(obj, curPlatform) {
    if (!curPlatform.window.closed && !rtmSocialFbCompleted) { curPlatform.timer = setTimeout(function () { rtmSocialMonitorWindow(obj, curPlatform); }, 1000); }
    else {
        clearTimeout(curPlatform.timer);
        var params = "promotionId=" + _rtmSocial.promotionId + "&shareGuid=" + curPlatform.shareGuid;
        $.getJSON(_rtmSocial.baseUrl + "IsCompleted?" + params + "&callback=?", function (results) {
            if (results.error != "") { console.warn("-- Realtime Social Error (IsCompleted) --\n" + results.error); }
            else if (results.completed && obj.shareCallback) {
                window[obj.shareCallback](curPlatform.platform.display, "Shared", obj.url || (location.protocol + "//" + location.host + location.pathname), location.pathname);
            }
        });
    }
}

function rtmSocialGetCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function isValidEmailAddress(emailAddress) {
    var pattern = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i);
    return pattern.test(emailAddress);
}

function rtmSocialGetParameterByName(name, r) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec("?" + r.split("?", 2)[1]);
    if (results == null) { return ""; }
    else { return escape(decodeURIComponent(results[1].replace(/\+/g, " "))); }
}

function IsCookieEnabled() {
    var expires = new Date();
    expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000));
    document.cookie = "testcookie=true;expires=" + expires.toUTCString();
   // $.cookie("testcookie", "true", { expires: 365, path: "/" });
    //if ($.cookie("testcookie") == "true") {
    if (rtmSocialGetCookie("testcookie") == "true") {
       // $.cookie('testcookie', null, { expires: -1, path: '/' });
        document.cookie = "testcookie=null; expires=Thu, 01 Jan 1900 00:00:00 UTC";
        return true;
    }
    else {return false;}
}