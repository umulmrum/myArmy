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
 * A single army detachment's data
 */
function DetachmentData(detachmentDataIndexParam) {

	var detachmentDataIndex = detachmentDataIndexParam;
	this.detachmentType = null;
	
	// static data (these variables do only depend on the army type, so will not changed after the army data was read)
	this.allowedAllies = [];
	var allowedExtensions = {};
	this.entityslotCount = {}; // the number of selectable entityslots per slot
	var detachmentTypes = {};
	
	this.stateLinkPart = null;
	var position = 0;
	
	var armyUnits = {};
	var maxArmyUnitIndex = 0;
	var armyUnitCount = 0;

	this.getDetachmentDataIndex = function() {
		return detachmentDataIndex;
	};

	this.getArmy = function(armyUnitIndex) {
		if(isUndefined(armyUnits[armyUnitIndex])) {
			return null;
		}
		return armyUnits[armyUnitIndex].getArmy();
	};
	
	this.getArmyUnits = function() {
		return armyUnits;
	};
	
	this.addArmyUnit = function(army) {
		var newArmyUnitIndex = "a" + maxArmyUnitIndex;
		var armyUnit = new ArmyUnit(newArmyUnitIndex, army, (maxArmyUnitIndex > 0));
		armyUnits[newArmyUnitIndex] = armyUnit;
		armyUnitCount++;
		maxArmyUnitIndex++;
		return armyUnit;
	};

	this.removeExtension = function(armyUnitIndex) {
		return this.removeArmyUnit(armyUnitIndex);
	};

	this.removeArmyUnit = function(armyUnitIndex) {
		var armyUnit = armyUnits[armyUnitIndex];
		var extensionId = armyUnit.getArmy(armyUnitIndex).armyId;
		for(var j = 0; j < armyUnit.getSelectionCount(); j++) {
			var entityslot = armyUnit.getSelection(j);
			removeEntitySlotLocalIds(entityslot);
			_armyState.totalPoints -= entityslot.entity.totalCost;
			_armyState.pointsPerSlot[entityslot.slotId] -= entityslot.entity.totalCost;
		}
		delete armyUnits[armyUnitIndex];
		armyUnitCount--;
		_persistence.createStatelink();
		return extensionId;
	};
	
	this.getArmyUnit = function(armyUnitIndex) {
		return armyUnits[armyUnitIndex];
	};
	
	this.getArmyUnitCount = function() {
		//return getObjectSize(armyUnits);
		return armyUnitCount;
	};
	
	this.resetArmy = function() {
		for(var i in armyUnits) {
			armyUnits[i].resetArmy();
		}
	};
	
	this.addEntry = function(armyUnitIndex, entityslot, doEntityCalculations) {
		armyUnits[armyUnitIndex].addEntry(entityslot, doEntityCalculations);
	};

	this.removeEntry = function(armyUnitIndex, entityslot) {
		armyUnits[armyUnitIndex].removeEntry(entityslot);
	};
	
	this.addPool = function(armyUnitIndex, name, pool) {
		armyUnits[armyUnitIndex].addPool(name, pool);
	};

	this.increaseEntityslotCount = function(slotId) {
		if(isUndefined(this.entityslotCount[slotId])) {
			this.entityslotCount[slotId] = 1;
		} else {
			this.entityslotCount[slotId]++;
		}
	};
	
	this.getEntityCount = function(armyUnitIndex, entityslotId) {
		return armyUnits[armyUnitIndex].getEntityCount(entityslotId);
	};
	
	this.setEntityCount = function(armyUnitIndex, entityslotId, count) {
		armyUnits[armyUnitIndex].setEntityCount(entityslotId, count);
	};
	
	this.getPools = function(armyUnitIndex) {
		return armyUnits[armyUnitIndex].getPools();
	};
	
	this.getPool = function(armyUnitIndex, name) {
		return armyUnits[armyUnitIndex].getPool(name);
	};
	
	this.setPools = function(armyUnitIndex, pools) {
		armyUnits[armyUnitIndex].setPools(pools);
	};

	this.hasExtension = function(extensionId) {
		for(var i in armyUnits) {
			if(armyUnits[i].getArmy().armyId == extensionId) {
				return true;
			}
		}
		return false;
	};

	this.hasSelections = function() {
		for(var i in armyUnits) {
			if(armyUnits[i].hasSelections()) {
				return true;
			}
		}
		return false;
	};
	
	this.getPosition = function() {
		return position;
	};

	this.setPosition = function(positionParam) {
		position = positionParam;
	};

	this.getDetachmentTypes = function() {
		return detachmentTypes;
	};

	this.getDetachmentType = function(id) {
		return detachmentTypes[id];
	};

	this.setDetachmentTypes = function(detachmentTypesParam) {
		detachmentTypes = detachmentTypesParam;
	};

	this.addDetachmentTypes = function(detachmentTypesParam) {
		$.extend(true, detachmentTypes, detachmentTypesParam);
	};

	this.setAllowedExtensions = function(extensionsParam) {
		allowedExtensions = extensionsParam;
	};

	this.isExtensionAllowed = function(extensionId) {
		return allowedExtensions.hasOwnProperty(extensionId);
	}
}