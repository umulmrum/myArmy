/*
 * Copyright 2012-2014 Stefan Kruppa
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
function Persistence() {
	
	// we use 36 as the base of our number pool. This means that the
	// resulting string will contain 0-9 and a-z (lower-case) for the
	// saved values. This shortens the resulting strings, as
	// every number x with 0 <= x <= 35 can be represented with a
	// single character.
	var BASE = 36; 
	
	// we use marker characters to distinguish tokens from values. Every marker
	// must be written in upper-case so that there is no collision with the
	// values in base36 encoding.
	var MARKER = {};
	// add every marker character!
	MARKER.SET = {Y:1,D:1,A:1,F:1,E:1,C:1,L:1,O:1,U:1,N:1,T:1};
	MARKER.SYSTEM = "Y";
	MARKER.DETACHMENT_TYPE = "D";
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

	this.init = function() {
		_dispatcher.bindEvent("postStateRefresh", this, this.createStatelink, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeDetachmentType", this, this.createStatelink, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeArmy", this, this.createStatelink, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postResetArmy", this, this.createStatelink, _dispatcher.PHASE_STATE);
		
		jQuery.event.add(window, "hashchange", function() {
			if(_guiState.hashEventEnabled) {
				_dispatcher.triggerEvent("postHashChange");
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
				i = restoreSystem(fileVersion, q, i + MARKER.SYSTEM.length);
				break;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreState");
				return;
			}
		}
		
		traverseArmyData(this, doEntityCalculations);
	};

	function doEntityCalculations(armyData) {
		for(var i = 0; i < armyData.selections.length; i++) {
			var entityslot = armyData.selections[i];
			registerEntityslotOptionsForPools(entityslot);
			changePoolByEntityslot(entityslot, true);
		}
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
		_controller.changeSystem(systemid);
		i = i + value.length;
		var armyIndex = 0;
		while(i < q.length) {
			switch(q[i]) {
				case MARKER.ARMY:
					i = restoreCurrentArmy(fileVersion, q, i + MARKER.ARMY.length, armyIndex);
					armyIndex++;
					break;
				case MARKER.FOC:
					i = restoreFoc(fileVersion, q, i + MARKER.FOC.length);
					break;
				default:
					alert("Unexpected token '" + q[i] + "' in restoreCurrentSystem");
					return i + 1;
			}
		}
		return i+1;
	}
	
	function restoreCurrentArmy(fileVersion, q, i, armyIndex) {
		var value = val(q, i);
		var armyid = parseInt(value, BASE);
		_controller.changeArmy(armyIndex, armyid);
		if(_armyState.getArmyData(armyIndex).getDetachmentType == null) {
			setDefaultDetachmentType(armyIndex);
		}
		i = i + value.length;
		while(i < q.length) {
			switch(q[i]) {
			case MARKER.DETACHMENT_TYPE:
				i = restoreDetachmentType(fileVersion, q, i + MARKER.DETACHMENT_TYPE.length, armyIndex);
				break;
			case MARKER.ARMY:
				if(fileVersion == 0) {
					i = restoreCurrentArmyLegacy(fileVersion, q, i + MARKER.ARMY.length);
				} else {
					return i;
				}
				break;
			case MARKER.FOC:
				i = restoreFoc(fileVersion, q, i + MARKER.FOC.length);
				break;
			case MARKER.ENTITY:
				i = restoreEntity(fileVersion, q, i + MARKER.ENTITY.length, armyIndex);
				break;
			case MARKER.ALLYENTITY:
				// legacy
				i = restoreEntity(fileVersion, q, i + MARKER.ALLYENTITY.length, 1);
				break;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreCurrentArmy");
				return;
			}
		}
		return i+1;
	}
	
	function restoreDetachmentType(fileVersion, q, i, armyIndex) {
		var value = val(q, i);
		var detachmentTypeId = parseInt(value, BASE);
		_controller.changeDetachmentType(armyIndex, detachmentTypeId);
		i = i + value.length;
		return i;
	}
	
	function restoreCurrentArmyLegacy(fileVersion, q, i) {
		var value = val(q, i);
		var armyid = parseInt(value, BASE);
		_controller.changeArmy(1, armyid);
		if(_armyState.getArmyData(armyIndex).getDetachmentType == null) {
			setDefaultDetachmentType(armyIndex);
		}
		i = i + value.length;
		return i;//+1;
	}
	
	/**
	 * Sets a default value for the army's detachment type.
	 * This method serves as a "converter" for legacy armies where no detachments existed
	 * There are fixed IDs in this methods which is why it is quite hacky. In theory this 
	 * should not be a problem though.
	 * 
	 * @param armyIndex
	 */
	function setDefaultDetachmentType(armyIndex) {
		var armyData = _armyState.getArmyData(armyIndex);
		if(armyIndex == 0) {
			armyData.detachmentType = _systemState.system.detachmentTypes["1"];
		} else {
			armyData.detachmentType = _systemState.system.detachmentTypes["2"];
		}
	}
	
	function restoreFoc(fileVersion, q, i) {
		var value = val(q, i);
		// ignore result as this is a legacy feature (needs to be in though, to provide backwards compatibility)
//		_armyState.setFocCount(parseInt(value, BASE));
		return i + value.length;
	}
	
	function restoreEntity(fileVersion, q, i, armyIndex) {
		var value = val(q, i);
		var entityslotId = parseInt(value, BASE);
		var entity = _controller.addEntry(armyIndex, entityslotId, false);
		i = i + value.length;
		while(i < q.length) {
			switch(q[i]) {
			case MARKER.COUNT:
				i = restoreModelcount(fileVersion, q, i + MARKER.COUNT.length, entity);
				break;
			case MARKER.OPTIONLIST:
				i = restoreOptionList(fileVersion, q, i + MARKER.OPTIONLIST.length, entity, entity);
				break;
			case MARKER.ENTITY:
				return i;
				break;
			case MARKER.ARMY:
				return i;
				break;
			case MARKER.ALLYENTITY:
				i = restoreEntity(fileVersion, q, i + MARKER.ALLYENTITY.length, 1);
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
		var entityslot = _armyState.lookupId(entity.parentEntityslot);
		changeModelCountPool(entityslot, 0, entity.currentCount);
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
				i = restoreOption(fileVersion, q, i + MARKER.OPTION.length, parentEntity, baseEntity, optionList);
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
		doSelectOption(optionList, option, 1);
		i = i + value.length;
		while(i < q.length) {
			switch(q[i]) {
			case MARKER.OPTION:
				i = restoreOption(fileVersion, q, i + MARKER.OPTION.length, parentEntity, baseEntity, optionList);
				break;
			case MARKER.SUBOPTION:
				i = restoreSuboption(fileVersion, q, i + MARKER.SUBOPTION.length, parentEntity, baseEntity, option);
				break;
			case MARKER.SUBOPTION_END:
				return i;
				break;
			case MARKER.COUNT:
				i = restoreOptionCount(fileVersion, q, i + MARKER.COUNT.length, parentEntity, optionList, option);
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
			default:
				alert("Unexpected token '" + q[i] + "' in restoreOption");
				return i + 1;
			}
		}
		return i+1;
	}
	
	function restoreOptionCount(fileVersion, q, i, entity, optionList, option) {
		var value = val(q, i);
		doSelectOption(optionList, option, parseInt(value, BASE));
		i = i + value.length;
		return i;
	}
	
	function restoreSuboption(fileVersion, q, i, parentEntity, baseEntity, option) {
		while(i < q.length) {
			switch(q[i]) {
			case MARKER.OPTIONLIST:
				i = restoreOptionList(fileVersion, q, i + MARKER.OPTIONLIST.length, option, baseEntity);
				break;
			case MARKER.SUBOPTION_END:
				return i + MARKER.SUBOPTION_END.length;
			default:
				alert("Unexpected token '" + q[i] + "' in restoreSuboption");
				return i + 1;
			}
		}
		return i+1;
	}
	
	this.createStatelink = function() {
		var stateLink = window.location.href;
	
		if (stateLink.indexOf("#") > -1) {
			stateLink = stateLink.substring(0, stateLink.indexOf("#"));
		}
	
		if (_systemState.system == null) {
			return;
		}
	
		var state = "1"; // version of link format (currently 2 versions; if none is given, we assume 0 when loading an army)
		state += MARKER.SYSTEM + _systemState.system.systemId.toString(BASE);
		if(_armyState.getFocCount() > 1) {
			state += MARKER.FOC + _armyState.getFocCount().toString(BASE);
		}
	
		if (_armyState.getArmyCount() != 0) {
			var stateLinksPerArmy = traverseArmyData(this, createStateLinkForArmy);
			for(var i = 0; i < stateLinksPerArmy.length; i++) {
				if(stateLinksPerArmy[i] != null) {
					state += stateLinksPerArmy[i];
				}
			}
		}
	
		stateLink += "#" + state;
		_armyState.setStateLink(stateLink);
		_persistence.setHashEvent(false);
		location.hash = state;
		window.setTimeout("window.setTimeout(\"_persistence.setHashEvent(true)\", 1)", 1);
	};
	
	function createStateLinkForArmy(armyData) {
		
		var state = MARKER.ARMY + armyData.army.armyId.toString(BASE);
		state += MARKER.DETACHMENT_TYPE + armyData.detachmentType.id;
		for(var i in armyData.selections) {
			var entityslot = armyData.selections[i];
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
					if(tempOptionString.length > MARKER.SUBOPTION.length) {
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