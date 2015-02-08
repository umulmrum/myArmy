"use strict";

function TextService() {

    this.init = function() {
        _dispatcher.bindEvent("postInit", this, this.onPostInit, _dispatcher.PHASE_STATE);
        _dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachmentAction, _dispatcher.PHASE_ACTION);
        _dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, _dispatcher.PHASE_STATE);
    };

    this.onPostInit = function() {
        this.refreshAllDetachmentTexts();
    };

    this.onPostChangeLanguage = function() {
        this.refreshAllDetachmentTexts();
    };

    this.onPostAddDetachmentAction = function(event, additionalData) {
        this.addCommonTextsToDetachment(additionalData.detachmentData);
    };

    this.addCommonTextsToDetachment = function(detachmentData) {
        var detachmentTexts = getTexts(_guiState, "detachment.");
        detachmentData.addTexts(detachmentTexts);
    };


    this.refreshAllDetachmentTexts = function() {
        for(var i in _armyState.getDetachments()) {
            var detachmentData = _armyState.getDetachmentData(i);
            this.addCommonTextsToDetachment(detachmentData);
        }
    };

    function getTexts(from, prefix) {
        var texts = {};
        for(var bundlekey in from.getTexts()) {
            if(bundlekey.indexOf(prefix) == 0) {
                texts[bundlekey] = from.getText(bundlekey);
            }
        }
        return texts;
    }
}