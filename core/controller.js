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

function Controller() {
	
	/**
	 * 
	 * Changes the language in which the screen elements are displayed, and refreshes the view
	 * @param language The new language
	 *
	 */
	this.changeLanguage = function(language) {
		_gui.startLongRunningProcess();
		_guiState.lang = language;
		_dataStore.setCookie("myArmy.language", _guiState.lang);
		
		_dispatcher.triggerEvent("postChangeLanguage");
	};
	
	/**
	 * 
	 * Removes all selections in the current army while preserving the selected detachments
	 *
	 */
	this.resetArmylist = function() {
		_armyState.resetArmy();
		
		_dispatcher.triggerEvent("postResetArmy");
	};
	
	this.changeSystem = function(systemId) {
		if (systemId != -1
				&& (_systemState.system == null || systemId != _systemState.system)) {
			
			for ( var i = 0; i < _systems.length; i++) {
				if (_systems[i].systemId == systemId) {
					_systemState.system = _systems[i];
					break;
				}
			}
			_dataReader.readSystem(_systemState.system);
			this.resetArmylist();
			
			_dispatcher.triggerEvent("postChangeSystem");
		}
	};
	
	this.changeDetachmentType = function(detachmentDataIndex, detachmentTypeId) {
		var detachmentType = _systemState.system.detachmentTypes[detachmentTypeId];
		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		if(detachmentData == null) {
			return;
		}
		detachmentData.detachmentType = detachmentType;
		
		_dispatcher.triggerEvent("postChangeDetachmentType", { armyIndex: detachmentDataIndex, newDetachmentTypeId: detachmentTypeId });
	};
	
	this.changeArmy = function(detachmentDataIndex, armyId, detachmentTypeId) {
		_gui.startLongRunningProcess();
		var currentArmy = _armyState.getArmy(detachmentDataIndex, 0);
		var armyChanged = !((armyId == -1) && (currentArmy == null)) || ((currentArmy != null) && (armyId == currentArmy.armyId));
		if (!armyChanged) {
			return;
		}
		_armyState.removeArmy(detachmentDataIndex);
		if(armyId != -1) {
			_armyState.setArmy(detachmentDataIndex, 0, _systemState.armies[armyId]);
			var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
			var armyUnit = detachmentData.getArmyUnit(0);
			_dataReader.readTextsArmy(armyUnit);
			
			_dataReader.loadArmy(armyUnit, detachmentDataIndex, 0);
			_armyState.getDetachmentData(detachmentDataIndex).resetArmy();
		} else {
			_armyState.setArmy(detachmentDataIndex, null);
		}
		if(!isUndefined(detachmentTypeId)) {
			this.changeDetachmentType(detachmentDataIndex, detachmentTypeId);
		}
		_dispatcher.triggerEvent("postChangeArmy", { detachmentDataIndex: detachmentDataIndex, newArmyId: armyId });
	};
	
	this.addEntry = function(detachmentDataIndex, armyUnitIndex, entityslotId, doEntityCalculations) {
        var armyUnit = _armyState.getArmyUnit(detachmentDataIndex, armyUnitIndex);
		var entityslot = armyUnit.getEntityslot(entityslotId).clone();
		var entityId = entityslot.entityId;
		var entity = armyUnit.getFromEntityPool(entityId).clone();
		entityslot.entity = entity;
		
		armyUnit.addEntry(entityslot, doEntityCalculations);
		
		if (doEntityCalculations) {
			registerEntityslotOptionsForPools(entityslot);
			changePoolByEntityslot(entityslot, true);
			_dispatcher.triggerEvent("postAddSelection", { entityslot: entityslot });
		}
		
		return entity;
	};
	
	this.cloneEntry = function(entityslot) {
		var armyUnit = _armyState.getArmyUnit(entityslot.detachmentDataIndex, entityslot.armyUnitIndex);
		var newEntityslot = entityslot.clone();
		var newEntity = newEntityslot.entity;
		armyUnit.addEntry(newEntityslot, false);
		newEntity.totalCost = 0; // will be recalculated later on
		registerEntityslotOptionsForPools(newEntityslot);
		changePoolByEntityslot(newEntityslot, true);
		fixOptionPool(armyUnit, newEntityslot.entity);
		
		_dispatcher.triggerEvent("postAddSelection", { entityslot: newEntityslot });
	};
	
	this.deleteEntry = function(entityslot) {
        var armyUnit = _armyState.getArmyUnit(entityslot.detachmentDataIndex, entityslot.armyUnitIndex);
		var entity = entityslot.entity;
		_armyState.addTotalPoints((-1) * entity.totalCost);
		unregisterEntityslotOptionsForPools(entityslot);
		armyUnit.removeEntry(entityslot);
		
		_dispatcher.triggerEvent("postRemoveSelection", { entityslot: entityslot });
	};
	
	this.setModelCount = function(entityslot, count) {
		if(count < entityslot.entity.minCount || count > entityslot.entity.maxCount) {
			return;
		}
		var oldCount = entityslot.entity.currentCount;
		entityslot.entity.currentCount = count;
		changeModelCountPool(entityslot, oldCount, count);
		entityslot.dirty = true;
		_dispatcher.triggerEvent("postChangeModelCount", { entityslot: entityslot });
	};
	
	this.selectOption = function(optionLocalId, optionCount) {
		_guiState.lastClickedOptionId = optionLocalId;
		var option = _armyState.lookupId(optionLocalId);
		var entityslot = _armyState.lookupId(option.parentEntityslot);
		selectOptionCommon(option, optionCount);
		
		/*
		 * if there are currently more options selected than are available
		 * in this list, then reduce the number of selected options to fit
		 * the restrictions.
		 * We need to do this here to avoid order-dependency when combining multiple option lists
		 */
		var optionList = _armyState.lookupId(option.parentOptionList);
		if (optionList.currentCount > optionList.currentMaxTaken) {
			var diff = optionList.currentCount - optionList.currentMaxTaken;
			for(var i in optionList.options) {
				var myOption = optionList.options[i];
				if(myOption.localId == optionLocalId) {
					continue;
				}
				var newOptionCount = Math.min(Math.max(myOption.currentCount
						- diff, 0), myOption.currentMaxTaken);
				diff = diff - (myOption.currentCount - newOptionCount);
				selectOptionCommon(myOption, newOptionCount);
				if(diff <= 0) {
					break;
				}
			}
		}
		
		entityslot.dirty = true;
		_dispatcher.triggerEvent("postSelectOption", { optionLocalId: optionLocalId });
	};
	
	this.setFocCount = function(focCount) {
		if (focCount > 0) {
			_armyState.setFocCount(focCount);
			_dispatcher.triggerEvent("postChangeFocCount");
		}
	};
	
}
