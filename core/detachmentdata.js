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

	// dynamic data
	this.stateLinkPart = null;
	var position = 0;
	
	var armyUnits = {};
	var maxArmyUnitIndex = 0;
	var armyUnitCount = 0;

	var pools = {};
	var texts = {};

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
			_container.getArmyState().totalPoints -= entityslot.entity.totalCost;
			_container.getArmyState().pointsPerSlot[entityslot.slotId] -= entityslot.entity.totalCost;
		}
		delete armyUnits[armyUnitIndex];
		armyUnitCount--;
		_container.getPersistence().createStatelink();
		return extensionId;
	};
	
	this.getArmyUnit = function(armyUnitIndex) {
		return armyUnits[armyUnitIndex];
	};

	this.getArmyUnitForArmyId = function(armyId) {
		for(var i in armyUnits) {
			if(armyUnits[i].getArmy().armyId == armyId) {
				return armyUnits[i];
			}
		}
		return null;
	};

	this.getFirstArmyUnit = function() {
		for(var i in armyUnits) {
			return armyUnits[i];
		}
		return null;
	};
	
	this.resetArmy = function() {
		for(var i in armyUnits) {
			armyUnits[i].resetArmy();
		}
		this.resetPools();
	};
	
	this.removeEntry = function(armyUnitIndex, entityslot) {
		armyUnits[armyUnitIndex].removeEntry(entityslot);
	};
	
	this.addPool = function(pool) {
		if(isUndefined(pools[pool.name])) {
			pools[pool.name] = pool;
		}
	};

	this.getPools = function() {
		return pools;
	};

	this.getPool = function(name) {
		return pools[name];
	};

	this.resetPools = function() {
		for ( var i in pools) {
			var pool = pools[i];
			pool.currentCount = pool.start;
			pool.dependingOptions = {};
		}
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

	this.removeDetachmentType = function(detachmentTypeId) {
		delete detachmentTypes[detachmentTypeId];
	};

	this.getAllowedExtensions = function() {
		return allowedExtensions;
	};

	this.setAllowedExtensions = function(extensionsParam) {
		allowedExtensions = extensionsParam;
	};

	this.isExtensionAllowed = function(extensionId) {
		return allowedExtensions.hasOwnProperty(extensionId);
	};

	this.getTexts = function() {
		return texts;
	};

	this.getText = function(key) {
		return texts[key];
	};

	this.setTexts = function(textsParam) {
		texts = textsParam;
	};

	this.addTexts = function(textsParam) {
		$.extend(texts, textsParam);
	};
}