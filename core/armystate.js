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
 * ArmyState() manages all current army data.
 * It holds data for each detachment as well as aggregate information (e.g. total points). 
 */
function ArmyState(systemState) {
	
	this.pointsPerSlot = {}; // the current points values per slot

	this.totalPoints = 0;
	this.focCount = 1;
	this.stateLink = null;

	this.maxLocalId = 0; // each item (entityslot, entity, optionList, option) that has been added to the current army gets assigned a temporary ID.
						// This variable will hold the current maximum so that new items can get a subsequent ID.
	this.armyLookup = {};

	var detachmentData = {};
	var maxDetachmentIndex = 0;
	var detachmentCount = 0;

	this.resetArmy = function() {
		for(var i in detachmentData) {
			detachmentData[i].resetArmy();
		}
		
		this.resetPointsPerSlot();
		this.focCount = 1;
		this.totalPoints = 0;
		this.maxLocalId = 0;
		this.armyLookup = {};
	};
	
	this.resetPointsPerSlot = function() {
		for(var i in systemState.slots) {
			var slotId = systemState.slots[i].slotId;
			this.pointsPerSlot[slotId] = 0;
		}
	};

	this.addDetachment = function(army) {
		var detachmentDataIndex = "d" + maxDetachmentIndex;
		var detachment = new DetachmentData(detachmentDataIndex);
		detachment.addArmyUnit(army);
		detachmentData[detachmentDataIndex] = detachment;
		detachmentCount++;
		maxDetachmentIndex++;
		setDetachmentPositions();
		detachment.setDetachmentTypes($.extend(true, {}, systemState.system.detachmentTypes));

		return detachment;
	};

	this.removeDetachment = function(detachmentDataParam) {
        for(var i in detachmentDataParam.getArmyUnits()) {
            var armyUnit = detachmentDataParam.getArmyUnit(i);
			detachmentDataParam.removeArmyUnit(i);
        }
		delete detachmentData[detachmentDataParam.getDetachmentDataIndex()];
		detachmentCount--;
		setDetachmentPositions();
	};

	function setDetachmentPositions() {
		var pos = 1;
		for(var i in detachmentData) {
			detachmentData[i].setPosition(pos++);
		}
	}

	this.getFirstDetachment = function() {
		for(var i in detachmentData) {
			return detachmentData[i];
		}
		return null;
	};
	
	this.addToIdLookup = function(element) {
		this.maxLocalId++;
		element.localId = this.maxLocalId;
		this.armyLookup[element.localId] = element;
	};
	
	this.removeFromIdLookup = function(element) {
		delete this.armyLookup[element.localId];
	};

	this.getDetachments = function() {
		return detachmentData;
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
	
	this.getDetachmentCount = function() {
		return detachmentCount;
	};
	
	this.getArmy = function(detachmentDataIndex, armyUnitIndex) {
		if(detachmentData[detachmentDataIndex] == null) {
			return null;
		}
		return detachmentData[detachmentDataIndex].getArmy(armyUnitIndex);
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
	
	this.getStateLink = function() {
		return this.stateLink;
	};
	
	this.setStateLink = function(link) {
		this.stateLink = link;
	};
	
}
