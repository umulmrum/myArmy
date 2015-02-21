/*
 * Copyright 2012-2015 Stefan Kruppa
 *
 * This file is part of myArmy.
 *
 * myArmy is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * myArmy is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with myArmy.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

"use strict";

function ModificationService(poolService) {

    var dataReader = null;

    this.init = function() {
        dataReader = _container.getDataReader();
    };

    this.applyModifications = function(detachmentData, modifications, origin) {
        for (var modificationType in modifications) {
            var modificationData = modifications[modificationType];
            for (var k in detachmentData.getArmyUnits()) {
                var affectedArmyUnit = detachmentData.getArmyUnit(k);
                var modification = getModificationForArmyUnit(modificationData, affectedArmyUnit);
                if (modification == null) {
                    continue;
                }
                applyModificationToArmyUnit(modificationType, modification, detachmentData, affectedArmyUnit, origin);
            }
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

    function applyModificationToArmyUnit(modificationType, modification, detachmentData, armyUnit, origin) {
        switch(modificationType) {
            case "entityslot_whitelist":
                applyEntityslotWhitelist(modification, armyUnit);
                break;
            case "extension_whitelist":
                applyExtensionWhitelist(modification, detachmentData, armyUnit);
                break;
            case "entity_changes":
                applyEntityChanges(modification, detachmentData, armyUnit, origin);
                break;
            case "entityslot_blacklist":
                applyEntityslotBlacklist(modification, armyUnit);
                break;
            case "detachmenttype_blacklist":
                applyDetachmentTypeBlacklist(modification, detachmentData);
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

    function applyExtensionWhitelist(modification, detachmentData, armyUnit) {
        if(armyUnit.getArmyUnitIndex() == "a0") {
            var extensions = {};
            for(var i in modification) {
                extensions[modification[i]] = "1";
            }
            detachmentData.setAllowedExtensions(extensions);
            return;
        }
        var armyId = armyUnit.getArmy().armyId;
        if($.inArray(armyId, modification) == -1) {
            detachmentData.removeArmyUnit(armyUnit.getArmyUnitIndex());
        }

    }

    function applyEntityChanges(modification, detachmentData, armyUnit, origin) {

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
                    case "addOptionLists":
                        applyAddOptionLists(change, changedEntity, detachmentData, origin);
                        break;
                    default:
                        changedEntity[j] = change;
                        break;
                }
            }
            changedEntityIds.push(changedEntity.entityId);
        }
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

    function applyAddOptionLists(addedOptionLists, entity, detachmentData, origin) {
        var optionLists = {};
        for(var i = 0; i < addedOptionLists.length; i++) {
            var obj = addedOptionLists[i];
            var optionListId = "" + (getMaxKey(entity.optionLists) + 1);
            var minTaken = coalesce(obj.minTaken, 0);
            var maxTaken = coalesce(obj.maxTaken, Number.MAX_VALUE);
            var optionList = new OptionList(optionListId, minTaken, maxTaken);
            optionList.origin = origin;
            optionList.originOptionListId = obj.olId;
            optionLists[optionListId] = optionList;
            var optionsJson = obj.options;
            optionList.options = {};
            if(!optionsJson) {
                continue;
            }
            for(var j = 0; j < optionsJson.length; j++) {
                var obj2 = optionsJson[j];
                var optionId = obj2.oId;
                var entityId = obj2.eId;
                var cost = coalesce(obj2.cost, 0);
                var costPerModel = coalesce(obj2.costPerModel, 0);
                var minTaken = coalesce(obj2.minTaken, 0);
                var maxTaken = coalesce(obj2.maxTaken, 1);
                var fillsPool = obj2.fillsPool || null;
                fillsPool = poolService.parsePools(origin, fillsPool);
                var needsPool = obj2.needsPool || null;
                needsPool = poolService.parsePools(origin, needsPool);
                var fillsLocalPool = obj2.fillsLocalPool || null;
                fillsLocalPool = poolService.parsePools(origin, fillsLocalPool);
                var needsLocalPool = obj2.needsLocalPool || null;
                needsLocalPool = poolService.parsePools(origin, needsLocalPool);
                var option = new Option(optionId, entityId, cost, costPerModel, minTaken, maxTaken, fillsPool, needsPool, fillsLocalPool, needsLocalPool);
                option.origin = origin;
                optionList.options[optionId] = option;
            }
            dataReader.resolveDeepOptionsForOptionLists(detachmentData.getArmyUnit(entity.armyUnitIndex).getEntityPool(), optionLists);
            if(isUndefined(entity.optionLists)) {
                entity.optionLists = optionLists;
            } else {
                $.extend(entity.optionLists, optionLists);
            }
        }
    }

    function applyEntityslotBlacklist(modification, armyUnit) {
        for(var i in armyUnit.getEntityslots()) {
            if($.inArray(parseInt(i), modification) != -1) {
                var entityslot = armyUnit.getEntityslot(i);
                entityslot.visible = false;
            }
        }
    }

    function applyDetachmentTypeBlacklist(modification, detachmentData) {
        for(var i in detachmentData.getDetachmentTypes()) {
            if($.inArray(parseInt(i), modification) != -1) {
                //var detachmentType = detachmentData.getDetachmentType(i);
                detachmentData.removeDetachmentType(i);
            }
        }
    }

    function getMaxKey(item) {
        var max = 0;
        for(var i in item) {
            var key = parseInt(i);
            if(key > max) {
                max = key;
            }
        }
        return max;
    }
}