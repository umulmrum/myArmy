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
 * ArmyState() manages all current army data.
 * It holds data for each detachment as well as aggregate information (e.g. total points). 
 */
function ArmyState() {
	
	var detachmentData = [];
	this.pointsPerSlot = {}; // the current points values per slot
	
	this.totalPoints = 0;
	this.focCount = 1;
	this.stateLink = null;
	
	this.maxLocalId = 0; // each item (entityslot, entity, optionList, option) that has been added to the current army gets assigned a temporary ID. 
						// This variable will hold the current maximum so that new items can get a subsequent ID. 
	this.armyLookup = {};
	
	this.resetArmy = function() {
		for(var i = 0; i < detachmentData.length; i++) {
			detachmentData[i].resetArmy();
		}
		
		this.resetPointsPerSlot();
		this.focCount = 1;
		this.totalPoints = 0;
		this.maxLocalId = 0;
		this.armyLookup = {};
	};
	
	this.resetPointsPerSlot = function() {
		for(var i in _systemState.slots) {
			var slotId = _systemState.slots[i].slotId;
			this.pointsPerSlot[slotId] = 0;
		}
	};
	
	this.removeDetachment = function(detachmentDataIndex) {
		if(((this.getArmyCount() -1) < detachmentDataIndex) || (detachmentData[detachmentDataIndex].getArmy(0) == null)) {
			return;
		}
        for(var i = 0; i < detachmentData[detachmentDataIndex].getArmyUnitCount(); i++) {
            var armyUnit = detachmentData[detachmentDataIndex].getArmyUnit(i);
            for(var j = 0; j < armyUnit.getSelectionCount(); j++) {
                var entityslot = armyUnit.getSelection(j);
                removeEntitySlotLocalIds(entityslot);
                this.totalPoints -= entityslot.entity.totalCost;
                this.pointsPerSlot[entityslot.slotId] -= entityslot.entity.totalCost;
            }
        }
		//detachmentData.splice(detachmentDataIndex, 1);
		//this.setArmy(detachmentDataIndex, null);

		_persistence.createStatelink();
	};
	
	this.recalculate = function() {
		this.totalPoints = 0;
		this.resetPointsPerSlot();
		this.stateLink = null;
	};
	
	this.addToIdLookup = function(element) {
		this.maxLocalId++;
		element.localId = this.maxLocalId;
		this.armyLookup[element.localId] = element;
	};
	
	this.removeFromIdLookup = function(element) {
		delete this.armyLookup[element.localId];
	};
	
	this.getDetachmentData = function(detachmentDataIndex) {
		return detachmentData[detachmentDataIndex];
	};

    this.setDetachmentData = function(detachmentDataIndex, detachmentDataParam) {
        detachmentData[detachmentDataIndex] = detachmentDataParam;
    };
	
	this.getArmyUnit = function(detachmentDataIndex, armyUnitIndex) {
        if(detachmentData[detachmentDataIndex] == null) {
            return null;
        }
		return detachmentData[detachmentDataIndex].getArmyUnit(armyUnitIndex);
	};
	
	this.getDetachmentDataCount = function() {
		return detachmentData.length;
	};
	
	this.getArmy = function(detachmentDataIndex, armyUnitIndex) {
		if(detachmentData[detachmentDataIndex] == null) {
			return null;
		}
		return detachmentData[detachmentDataIndex].getArmy(armyUnitIndex);
	};
	
	this.addDetachment = function(army) {
		var detachmentDataIndex = this.getLastArmyIndex() + 1;
		var detachment = new DetachmentData(detachmentDataIndex);
		detachment.setArmy(army);
		detachmentData[detachmentDataIndex] = detachment;
		return detachment;
	};
	
	this.getArmyCount = function() {
		var count = 0;
		for(var i = 0; i < detachmentData.length; i++) {
			if(detachmentData[i].getArmy(0) != null) {
				count++;
			}
		}
		return count;
	};
	
	this.getFirstArmyIndex = function() {
		for(var i = 0; i < detachmentData.length; i++) {
			if(detachmentData[i].getArmy(0) != null) {
				return i;
			}
		}
		return -1;
	};

	this.getLastArmyIndex = function() {
		for(var i = detachmentData.length - 1; i >= 0; i--) {
			if(detachmentData[i].getArmy(0) != null) {
				return i;
			}
		}
		return -1;
	};

	this.addExtension = function(detachmentDataIndex, extension) {
		return detachmentData[detachmentDataIndex].addExtension(extension);
	};

	this.removeExtension = function(detachmentDataIndex, armyUnitIndex) {
		return detachmentData[detachmentDataIndex].removeExtension(armyUnitIndex);
	};

	
	this.lookupId = function(localId) {
		return this.armyLookup[localId];
	};
	
	this.getTotalPoints = function() {
		return this.totalPoints;
	};
	
	this.setTotalPoints = function(points) {
		this.totalPoints = points;
	};
	
	this.addTotalPoints = function(points) {
		this.totalPoints += points;
	};
	
	this.addPointsPerSlot = function(slotId, points) {
		this.pointsPerSlot[slotId] += points;
	};
	
	this.getFocCount = function() {
		return this.focCount;
	};
	
	this.setFocCount = function(count) {
		this.focCount = count;
	};
	
	this.getStateLink = function() {
		return this.stateLink;
	};
	
	this.setStateLink = function(link) {
		this.stateLink = link;
	};
	
}
