"use strict";

function ModificationService() {

    this.applyModifications = function(detachmentData, modifications) {
        for (var modificationType in modifications) {
            var modificationData = detachmentData.detachmentType.modifications[modificationType];
            //for (var j in _armyState.getDetachments()) {
            //    var detachment = _armyState.getDetachmentData(j);
                for (var k in detachmentData.getArmyUnits()) {
                    var affectedArmyUnit = detachmentData.getArmyUnit(k);
                    var modification = getModificationForArmyUnit(modificationData, affectedArmyUnit);
                    if (modification == null) {
                        continue;
                    }
                    applyModificationToArmyUnit(modificationType, modification, affectedArmyUnit);
                }
            //}
        }
    };

    function getModificationForArmyUnit(modificationData, armyUnit) {
        var armyId = "" + armyUnit.getArmy().armyId;
        if(modificationData.hasOwnProperty(armyId)) {
            return modificationData[armyId];
        } else if(modificationData.hasOwnProperty("default")) {
            return modificationData["default"];
        } else {
            return null;
        }
    }

    function applyModificationToArmyUnit(modificationType, modification, armyUnit) {
        switch(modificationType) {
            case "entityslot_whitelist":
                applyEntityslotWhitelist(modification, armyUnit);
                break;
            case "extension_whitelist":
                break;
            case "entity_changes":
                applyEntityChanges(modification, armyUnit);
                break;
            default:
                alert("Unknown modification: " + modificationType);
                break;
        }
    }

    function applyEntityslotWhitelist(modification, armyUnit) {
        for(var i in armyUnit.getEntityslots()) {
            if($.inArray(parseInt(i), modification) == -1) {
                var entityslot = armyUnit.getEntityslot(i);
                entityslot.visible = false;
            }
        }
    }

    function applyEntityChanges(modification, armyUnit) {

        var changedEntityIds = [];
        for(var i in modification) {
            var entityChanges = modification[i];
            var changedEntity = armyUnit.getFromEntityPool(entityChanges.eId);
            for(var j in entityChanges) {
                var change = entityChanges[j];
                switch(j) {
                    case "eId":
                        break;
                    case "optionLists":
                        applyOptionListChanges(change, changedEntity.optionLists);
                        break;
                    default:
                        changedEntity[j] = change;
                        break;
                }
            }
            changedEntityIds.push(changedEntity.entityId);
        }
        //for(var i in armyUnit.getSelections()) {
        //    var selection = armyUnit.getSelection(i);
        //    if($.inArray(selection.entityId, changedEntityIds) != -1) {
        //        selection.dirty = true;
        //    }
        //}
    }

    function applyOptionListChanges(optionListChanges, optionLists) {
        for(var i = 0; i < optionListChanges.length; i++) {
            var optionListChange = optionListChanges[i];
            var changedOptionList = optionLists[optionListChange.olId];
            for(var j in optionListChange) {
                switch (j) {
                    case "olId":
                        break;
                    case "options":
                        applyOptionChanges(optionListChange[j], changedOptionList.options);
                        break;
                    default:
                        changedOptionList[j] = optionListChange[j];
                        break;
                }

            }
        }
    }

    function applyOptionChanges(optionChanges, options) {
        for(var i = 0; i < optionChanges.length; i++) {
            var optionChange = optionChanges[i];
            var changedOption = options[optionChange.oId];
            for(var j in optionChange) {
                switch (j) {
                    case "oId":
                        break;
                    default:
                        changedOption[j] = optionChange[j];
                        break;
                }

            }
        }
    }
}