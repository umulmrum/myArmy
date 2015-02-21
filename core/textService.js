"use strict";

function TextService(dispatcher, armyState) {

    this.init = function() {
        dispatcher.bindEvent("postInit", this, this.onPostInit, dispatcher.PHASE_STATE);
        dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachmentAction, dispatcher.PHASE_ACTION);
        dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, dispatcher.PHASE_STATE);
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
        for(var i in armyState.getDetachments()) {
            var detachmentData = armyState.getDetachmentData(i);
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