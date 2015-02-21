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

/**
 * Persistence is used to load and save armies (in fact, it only generates the
 * code to re-create the army. How this code is used is up to the GUI).
 * See the documentation on how the code is being created and parsed.
 */
function Persistence(dispatcher, systemService, systemState, armyState, poolService, detachmentService, selectionService, optionService) {

	var currentFileVersion = "2";

	// we use 36 as the base of our number pool. This means that the
	// resulting string will contain 0-9 and a-z (lower-case) for the
	// saved values. This shortens the resulting strings, as
	// every number x with 0 <= x <= 35 can be represented with a
	// single character.
	var BASE = 36; 
	
	// we use marker characters to distinguish tokens from values. Every marker
	// must be written in upper-case so that there is no collision with the
	// values in base36 encoding. They also may only have length 1 each.
	var MARKER = {};
	// add every marker character!
	MARKER.SET = {Y:1,D:1,A:1,F:1,E:1,C:1,L:1,O:1,U:1,N:1,T:1};
	MARKER.SYSTEM = "Y";
	MARKER.DETACHMENT = "D";
	MARKER.ARMY = "A";
	MARKER.ALLY = "A";
	MARKER.FOC = "F";
	MARKER.ENTITY = "E";
	MARKER.ALLYENTITY = "T";
	MARKER.COUNT = "C";
	MARKER.OPTIONLIST = "L";
	MARKER.OPTION = "O";
	MARKER.SUBOPTION = "U";
	MARKER.SUBOPTION_END = "N";
	//MARKER.MODIFICATION_OPTIONLIST = "";
	//MARKER.MODIFICATION_OPTION = "";

	this.init = function() {
        
		dispatcher.bindEvent("postStateRefresh", this, this.createStatelink, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postChangeDetachmentType", this, this.createStatelink, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postAddDetachment", this, this.createStatelink, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postResetArmy", this, this.createStatelink, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postAddExtension", this, this.createStatelink, dispatcher.PHASE_STATE);
		dispatcher.bindEvent("postDeleteDetachment", this, this.createStatelink, dispatcher.PHASE_ACTION);
		dispatcher.bindEvent("postDeleteExtension", this, this.createStatelink, dispatcher.PHASE_ACTION);

		jQuery.event.add(window, "hashchange", function() {
			if(_guiState.hashEventEnabled) {
				dispatcher.triggerEvent("postHashChange");
				init();
			}
		});
	};
	
	this.onPostStateRefresh = function(event) {
		this.createStatelink();
	};

	this.restoreState = function() {
	
		var q = location.hash.substring(1);
		
		var i = 0;
		while (i < q.length) {
			var fileVersion;
			if(q[i] == MARKER.SYSTEM) {
				fileVersion = 0;
			} else {
				fileVersion = parseInt(q[i], BASE);
				i++;
				
			}
			switch (q[i]) {
			case MARKER.SYSTEM:
				i = restoreSystem(fileVersion, q, i + 1);
				break;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreState");
				return;
			}
		}
		
		traverseArmyUnit(this, doEntityCalculations);
	};

	function doEntityCalculations(armyUnit) {
		for(var i = 0; i < armyUnit.getSelectionCount(); i++) {
			var entityslot = armyUnit.getSelection(i);
            poolService.registerEntityslotOptionsForPools(entityslot);
            poolService.changePoolByEntityslot(entityslot, true);
		}
		armyUnit.recalculateSelectionSlotCost();
	}
	
	function val(q, i) {
		var text = "";
		var j = i;
		while(j < q.length) {
			if(MARKER.SET.hasOwnProperty(q[j])) {
				return text;
			} else {
				text += q[j];
				j++;
			}
		}
		return text;
	}
	
	function restoreSystem(fileVersion, q, i) {
		var value = val(q, i);
		var systemid = parseInt(value, BASE);
		systemService.changeSystem(systemid);
		i = i + value.length;
		var detachmentDataIndex = 0;
		while(i < q.length) {
			switch(q[i]) {
                case MARKER.DETACHMENT:
                    i = restoreDetachment(fileVersion, q, i + 1, "d" + detachmentDataIndex);
                    detachmentDataIndex++;
                    break;
				case MARKER.ARMY:
					i = restoreArmy(fileVersion, q, i + 1, "d" + detachmentDataIndex, 0);
					detachmentDataIndex++;
					break;
				case MARKER.FOC:
					i = restoreFoc(fileVersion, q, i + 1);
					break;
				default:
					alert("Unexpected token '" + q[i] + "' in restoreSystem");
					return i + 1;
			}
		}
		return i+1;
	}

    function restoreDetachment(fileVersion, q, i, detachmentDataIndex) {

        var value = val(q, i);
        var detachmentTypeId = parseInt(value, BASE);
        var armyUnitIndex = 0;

        i += value.length;

		// first load all armies in the detachment, so the they can interact (e.g. extensions add detachment types)
		var armyUnitIdList = findArmyUnits(fileVersion, q, i);
		detachmentService.addDetachment(armyUnitIdList[0], "1");
		var detachmentData = armyState.getDetachmentData(detachmentDataIndex);
		for(var j = 1; j < armyUnitIdList.length; j++) {
			detachmentService.addExtension(detachmentData, armyUnitIdList[j]);
		}
		detachmentService.changeDetachmentType(detachmentData, detachmentData.getDetachmentType(detachmentTypeId));

        while(i < q.length) {
            switch(q[i]) {
                case MARKER.DETACHMENT:
                    return i;
                    break;
                case MARKER.ARMY:
                    i = restoreArmy(fileVersion, q, i + 1, detachmentDataIndex, armyUnitIndex, detachmentTypeId);
                    armyUnitIndex++;
                    break;
                default:
                    alert("Unexpected token '" + q[i] + "' in restoreDetachment");
                    return;
            }
        }
        return i+1;
    }

	function findArmyUnits(fileVersion, q, i) {
		var armyUnits = [];
		do {
			if(q[i] == MARKER.ARMY) {
				i++;
				var value = val(q, i);
				armyUnits.push(parseInt(value, BASE));
				i += value.length;
			} else {
				i++;
			}
		} while(i < q.length && q[i] != MARKER.DETACHMENT);
		return armyUnits;
	}

	function restoreArmy(fileVersion, q, i, detachmentDataIndex, armyUnitIndex, detachmentTypeId) {

        var value = val(q, i);
        var armyId = parseInt(value, BASE);
		var isExtension = false;
		if(fileVersion < 2) {
			// in older versions each army was loaded when it "appeared" in the saved string
			if(isUndefined(systemState.armies[armyId]) && !isUndefined(systemState.extensions[armyId])) {
				isExtension = true;
			}
			if(isExtension) {
				detachmentService.addExtension(armyState.getDetachmentData(detachmentDataIndex), armyId);
			} else {
				detachmentService.addDetachment(armyId, detachmentTypeId);
			}
		}
		var detachmentData = armyState.getDetachmentData(detachmentDataIndex);
		var armyUnit = detachmentData.getArmyUnit("a" + armyUnitIndex);
		var options = {};
		if(detachmentData.detachmentType.isFormation()) {
			options = { deletable: false, clonable: false };
		}
        i = i + value.length;

        while(i < q.length) {
			switch(q[i]) {
			case MARKER.DETACHMENT:
                if(fileVersion < 2) {
				    i = restoreDetachmentType(fileVersion, q, i + 1, detachmentData);
                } else {
                    return i;
                }
				break;
			case MARKER.ARMY:
				if(fileVersion == 0) {
					i = restoreCurrentArmyLegacy(fileVersion, q, i + 1);
				} else {
					return i;
				}
				break;
			case MARKER.FOC:
				i = restoreFoc(fileVersion, q, i + 1);
				break;
			case MARKER.ENTITY:
				i = restoreEntity(fileVersion, q, i + 1, armyUnit, options);
				break;
			case MARKER.ALLYENTITY:
				// legacy
				i = restoreEntity(fileVersion, q, i + 1, 1, "a0");
				break;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreArmy");
				return;
			}
		}
		return i+1;
	}
	
	function restoreDetachmentType(fileVersion, q, i, detachmentData) {
		var value = val(q, i);
		var detachmentTypeId = parseInt(value, BASE);
		detachmentService.changeDetachmentType(detachmentData, detachmentData.getDetachmentType(detachmentTypeId));
		i = i + value.length;
		return i;
	}
	
	function restoreCurrentArmyLegacy(fileVersion, q, i) {
		var value = val(q, i);
		var armyid = parseInt(value, BASE);
		detachmentService.addDetachment(armyid);
		i = i + value.length;
		return i;//+1;
	}
	
	function restoreFoc(fileVersion, q, i) {
		var value = val(q, i);
		// ignore result as this is a legacy feature (needs to be in though, to provide backwards compatibility)
//		armyState.setFocCount(parseInt(value, BASE));
		return i + value.length;
	}
	
	function restoreEntity(fileVersion, q, i, armyUnit, options) {
		var value = val(q, i);
		var entityslotId = parseInt(value, BASE);
		i = i + value.length;
		// workaround to remove old system entities without completely breaking saved armies
		if(entityslotId >= 901 && entityslotId <= 904) {
			while(i < q.length && q[i] != MARKER.ENTITY && q[i] != MARKER.ARMY && q[i] != MARKER.ALLYENTITY) {
				i++;
			}
		} else {
			var entityslot = selectionService.addSelection(armyUnit, entityslotId, false, options);
            var entity = entityslot.entity;
		}
		while(i < q.length) {
			switch(q[i]) {
			case MARKER.COUNT:
				i = restoreModelcount(fileVersion, q, i + 1, entity);
				break;
			case MARKER.OPTIONLIST:
				i = restoreOptionList(fileVersion, q, i + 1, entity, entity);
				break;
			case MARKER.ENTITY:
				return i;
				break;
			case MARKER.ARMY:
				return i;
				break;
            case MARKER.DETACHMENT:
                return i;
                break;
			case MARKER.ALLYENTITY:
				i = restoreEntity(fileVersion, q, i + 1, armyUnit);
				break;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreEntity ");
				return i + 1;
			}
		}
		return i+1;
	}
	
	function restoreModelcount(fileVersion, q, i, entity) {
		var value = val(q, i);
		entity.currentCount = parseInt(value, BASE);
		var entityslot = armyState.lookupId(entity.parentEntityslot);
		poolService.changeModelCountPool(entityslot, 0, entity.currentCount);
		i = i + value.length;
		return i;
	}
	
	function restoreOptionList(fileVersion, q, i, parentEntity, baseEntity) {
		var value = val(q, i);
		var optionListId = parseInt(value, BASE);
		var optionList = parentEntity.optionLists[optionListId];
		if (isUndefined(optionList)) {
			return i + 1;
		}
		for ( var j in optionList.options) { // remove default selections
			// as we cloned the object before - this offers room for improvement
			optionList.options[j].selected = false;
		}
		i = i + value.length;
		while(i < q.length) {
			switch(q[i]) {
			case MARKER.OPTION:
				i = restoreOption(fileVersion, q, i + 1, parentEntity, baseEntity, optionList);
				break;
			case MARKER.OPTIONLIST: // only when returning from restoreOption
				return i;
			case MARKER.ENTITY:
				return i;
			case MARKER.ALLYENTITY:
				return i;
			case MARKER.SUBOPTION_END:
				return i;
			case MARKER.ARMY:
				return i;
				break;
            case MARKER.DETACHMENT:
                return i;
                break;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreOptionList");
				return i + 1;
			}
		}
		return i+1;
	}
	
	function restoreOption(fileVersion, q, i, parentEntity, baseEntity, optionList) {
		var value = val(q, i);
		var optionId = parseInt(value, BASE);
		var option = optionList.options[optionId];
//		resolveOptionMinMax(parentEntity, baseEntity, optionList, option);
		// directly select the option, circumventing all checks (if the user managed to save this state, we assume that it is valid)
		optionService.doSelectOption(optionList, option, 1);
		i = i + value.length;
		while(i < q.length) {
			switch(q[i]) {
			case MARKER.OPTION:
				i = restoreOption(fileVersion, q, i + 1, parentEntity, baseEntity, optionList);
				break;
			case MARKER.SUBOPTION:
				i = restoreSuboption(fileVersion, q, i + 1, parentEntity, baseEntity, option);
				break;
			case MARKER.SUBOPTION_END:
				return i;
				break;
			case MARKER.COUNT:
				i = restoreOptionCount(fileVersion, q, i + 1, parentEntity, optionList, option);
				break;
			case MARKER.OPTIONLIST:
				return i;
			case MARKER.ENTITY:
				return i;
			case MARKER.ALLYENTITY:
				return i;
			case MARKER.ARMY:
				return i;
				break;
            case MARKER.DETACHMENT:
                return i;
                break;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreOption");
				return i + 1;
			}
		}
		return i+1;
	}
	
	function restoreOptionCount(fileVersion, q, i, entity, optionList, option) {
		var value = val(q, i);
        optionService.doSelectOption(optionList, option, parseInt(value, BASE));
		i = i + value.length;
		return i;
	}
	
	function restoreSuboption(fileVersion, q, i, parentEntity, baseEntity, option) {
		while(i < q.length) {
			switch(q[i]) {
			case MARKER.OPTIONLIST:
				i = restoreOptionList(fileVersion, q, i + 1, option, baseEntity);
				break;
			case MARKER.SUBOPTION_END:
				return i + 1;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreSuboption");
				return i + 1;
			}
		}
		return i+1;
	}

	this.restoreFragment = function(q, detachmentData, options) {
		var armyUnit = detachmentData.getFirstArmyUnit();
		var i = 0;

		while(i < q.length) {
			switch(q[i]) {
				case MARKER.ARMY:
					i++;
					var value = val(q, i);
					var newArmyUnit = detachmentData.getArmyUnitForArmyId(parseInt(value));
					if(newArmyUnit == null) {
						alert("Could not find armyUnit for armyId " + value);
					}
					armyUnit = newArmyUnit;
					i += value.length;
					break;
				case MARKER.ENTITY:
					i = restoreEntity(currentFileVersion, q, i + 1, armyUnit, options);
					break;
				default:
					alert("Unexpected token '" + q[i] + "' in restoreFragment");
					return;
			}
		}
		traverseArmyUnit(this, doEntityCalculations);
	};
	
	this.createStatelink = function() {
		var stateLink = window.location.href;
	
		if (stateLink.indexOf("#") > -1) {
			stateLink = stateLink.substring(0, stateLink.indexOf("#"));
		}
	
		if (systemState.system == null) {
			return;
		}
	
		var state = currentFileVersion; // version of link format (zero-based; if none is given, we assume 0 when loading an army)
		state += MARKER.SYSTEM + systemState.system.systemId.toString(BASE);
		if(armyState.getFocCount() > 1) {
			state += MARKER.FOC + armyState.getFocCount().toString(BASE);
		}
	
		if (armyState.getDetachmentCount() != 0) {
			var stateLinksPerArmy = traverseDetachmentData(this, createStateLinkForDetachmentData);
			for(var i in stateLinksPerArmy) {
				if(stateLinksPerArmy[i] != null) {
					state += stateLinksPerArmy[i];
				}
			}
		}
	
		stateLink += "#" + state;
		armyState.setStateLink(stateLink);
		this.setHashEvent(false);
		location.hash = state;
		window.setTimeout("window.setTimeout(\"_container.getPersistence().setHashEvent(true)\", 1)", 1);
	};
	
	function createStateLinkForDetachmentData(detachmentData) {
		
		var state = MARKER.DETACHMENT + detachmentData.detachmentType.id.toString(BASE);

        for(var armyUnitIndex in detachmentData.getArmyUnits()) {
            var armyUnit = detachmentData.getArmyUnit(armyUnitIndex);
            state += createStateLinkForArmyUnit(armyUnit);
        }
		detachmentData.stateLinkPart = state;
		return state;
	}
	
	function createStateLinkForArmyUnit(armyUnit) {
		var army = armyUnit.getArmy();
		if(army == null) {
			return "";
		}
		var state = MARKER.ARMY + army.armyId.toString(BASE);
		for(var i in armyUnit.getSelections()) {
			var entityslot = armyUnit.getSelection(i);
			state += entityslot.state;
		}
		return state;
	}
	
	this.setHashEvent = function(value) {
		_guiState.hashEventEnabled = value;
	};
	
	this.calculateEntityslotSaveState = function(entityslot) {
		var entity = entityslot.entity;
		var entityString = "";
		entityString += MARKER.ENTITY;
		entityString += parseInt(entityslot.entityslotId).toString(BASE);
	
		entityString += MARKER.COUNT;
		entityString += entity.currentCount.toString(BASE);
		for ( var i in entity.optionLists) {
			var optionList = entity.optionLists[i];
			entityString += createStateForOptionList(entity, optionList);
		}
		entityslot.state = entityString;
	};
	
	function createStateForOptionList(entity, optionList) {
		var optionListString = "";
		var optionString = "";
		for ( var j in optionList.options) {
			var option = optionList.options[j];
			if (option.selected) {
				optionString += MARKER.OPTION;
				optionString += option.optionId.toString(BASE);
				if(option.currentMaxTaken > 1) {
					optionString += MARKER.COUNT;
					optionString += option.currentCount.toString(BASE);
				}
				if(!isUndefined(option.optionLists)) {
					var tempOptionString = MARKER.SUBOPTION;
					for(var k in option.optionLists) {
						tempOptionString += createStateForOptionList(entity, option.optionLists[k]);
					}
					if(tempOptionString.length > 1) {
						optionString += tempOptionString;
						optionString += MARKER.SUBOPTION_END;
					}
				}
			}
		}
		if (optionString.length > 0) {
			optionListString += MARKER.OPTIONLIST;
			optionListString += optionList.optionListId.toString(BASE);
			optionListString += optionString;
		}
		return optionListString;
	}
	
}