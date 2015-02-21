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

// START helper methods

function isUndefined(value) {
	return (typeof value === 'undefined') || (value == null);
}

function hasProperties(object) {
	for(var i in object) {
		return i == i;
	}
	return false;
}

function isString(o) {
	return typeof o == "string"
			|| (typeof o == "object" && o.constructor === String);
}

function isNumber(o) {
	return typeof o == "number"
			|| (typeof o == "object" && o.constructor === Number);
}

function removeItems(array, item) {
	var i = 0;
	while (i < array.length) {
		if (array[i] == item) {
			array.splice(i, 1);
		} else {
			i++;
		}
	}
}

function coalesce(value1, value2) {
	if (isUndefined(value1)) {
		if (isUndefined(value2)) {
			return null;
		} else {
			return value2;
		}
	} else {
		return value1;
	}
}

function getObjectSize(obj) {
	var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
        	size++;
        }
    }
    return size;
}

function traverseOptions(detachmentData, armyUnit, entityOrOption, callback) {
	for(var i in entityOrOption.optionLists) {
		var optionList = entityOrOption.optionLists[i];
		for(var j in optionList.options) {
			var option = optionList.options[j];
			callback(detachmentData, armyUnit, optionList, option);
			
			if(!option.hasOptions()) {
				traverseOptions(detachmentData, armyUnit, option, callback);
			}
		}
	}
}

function traverseDetachmentData(caller, callback, additionalParams) {
	var retValue = {};
	for(var detachmentDataIndex in _container.getArmyState().getDetachments()) {
		var detachmentData = _container.getArmyState().getDetachmentData(detachmentDataIndex);
		retValue[detachmentDataIndex] = callback.call(caller, detachmentData, additionalParams);
	}
	return retValue;
}

function traverseArmyUnit(caller, callback, additionalParams) {
	var params = additionalParams || [];
	params["_caller"] = caller;
	params["_callback"] = callback;
	return traverseDetachmentData(null, doTraverseArmyUnit, params);
}

function doTraverseArmyUnit(detachmentData, additionalParams) {
	var caller = additionalParams["_caller"];
	var callback = additionalParams["_callback"];
	var armyUnits = detachmentData.getArmyUnits();
	var retValue = {};
	for(var armyUnitIndex in armyUnits) {
		var armyUnit = armyUnits[armyUnitIndex];
		retValue[armyUnitIndex] = callback.call(caller, armyUnit, detachmentData, additionalParams);
	}
	return retValue;
}

function cloneObject(obj) {
	if(isUndefined(obj)) {
		return undefined;
	}
	var cloned = {};
	for(var i in obj) {
		if(!isUndefined(obj[i].clone)) {
			// one of our self-defined objects
			cloned[i] = obj[i].clone();
		} else {
			// assume that this is a simple object - might prove wrong in the future!
			cloned[i] = obj[i]; 
		}
	}
	return cloned;
}

// END helper methods

//START localId

function assignEntitySlotLocalId(entityslot) {
	_container.getArmyState().addToIdLookup(entityslot);
	entityslot.entity.parentEntityslot = entityslot.localId;
	assignEntityOrOptionLocalId(entityslot.entity, entityslot);
}

function assignEntityOrOptionLocalId(entityOrOption, entityslot) {
	_container.getArmyState().addToIdLookup(entityOrOption);
	entityOrOption.parentEntityslot = entityslot.localId;
	
	if (entityOrOption.hasOptions()) {
		for ( var i in entityOrOption.optionLists) {
			var optionList = entityOrOption.optionLists[i];
			_container.getArmyState().addToIdLookup(optionList);
			optionList.parentEntity = entityOrOption.localId;
			if (!isUndefined(optionList.options)) {
				for ( var j in optionList.options) {
					var option = optionList.options[j];
					option.parentEntity = entityOrOption.localId;
					option.parentOptionList = optionList.localId;
					assignEntityOrOptionLocalId(option, entityslot);
				}
			}
		}
	}
}

function removeEntitySlotLocalIds(entityslot) {
	_container.getArmyState().removeFromIdLookup(entityslot);
	removeEntityOrOptionLocalIds(entityslot.entity);
}

function removeEntityOrOptionLocalIds(entityOrOption) {
	_container.getArmyState().removeFromIdLookup(entityOrOption);
	if (!isUndefined(entityOrOption.optionLists)) {
		for ( var i in entityOrOption.optionLists) {
			var optionList = entityOrOption.optionLists[i];
			_container.getArmyState().removeFromIdLookup(optionList);
			if (!isUndefined(optionList.options)) {
				for ( var j in optionList.options) {
					var option = optionList.options[j];
					removeEntityOrOptionLocalIds(option);
				}
			}
		}
	}
}

// END localId
