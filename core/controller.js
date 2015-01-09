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
			_dataReader.readArmies();
			this.resetArmylist();
			
			_dispatcher.triggerEvent("postChangeSystem");
		}
	};
	
	this.changeDetachmentType = function(armyIndex, detachmentTypeId) {
		var detachmentType = _systemState.system.detachmentTypes[detachmentTypeId];
		var armyData = _armyState.getArmyData(armyIndex);
		if(armyData == null) {
			return;
		}
		armyData.detachmentType = detachmentType;
		
		_dispatcher.triggerEvent("postChangeDetachmentType", { armyIndex: armyIndex, newDetachmentTypeId: detachmentTypeId });
	};
	
	this.changeArmy = function(armyIndex, armyId, detachmentTypeId) {
		_gui.startLongRunningProcess();
		var currentArmy = _armyState.getArmy(armyIndex);
		var armyChanged = !((armyId == -1) && (currentArmy == null)) || ((currentArmy != null) && (armyId == currentArmy.armyId));
		if (!armyChanged) {
			return;
		}
		_armyState.removeArmy(armyIndex);
		if(armyId != -1) {
			_armyState.setArmy(armyIndex, _systemState.armies[armyId]);
			var armyData = _armyState.getArmyData(armyIndex); 
			_dataReader.readTextsArmy(armyData);
			
			_dataReader.loadArmy(armyData, armyIndex);
			_armyState.getArmyData(armyIndex).resetArmy();
		} else {
			_armyState.setArmy(armyIndex, null);
		}
		if(!isUndefined(detachmentTypeId)) {
			this.changeDetachmentType(armyIndex, detachmentTypeId);
		}
		_dispatcher.triggerEvent("postChangeArmy", { armyIndex: armyIndex, newArmyId: armyId });
	};
	
	this.addEntry = function(armyIndex, entityslotId, doEntityCalculations) {
		var armyData = _armyState.getArmyData(armyIndex);
		var entityslot = armyData.entityslots[entityslotId].clone();
		var entityId = entityslot.entityId;
		var entity = armyData.entityPool[entityId].clone();
		entityslot.entity = entity;
		
		armyData.addEntry(entityslot, doEntityCalculations);
		
		if (doEntityCalculations) {
			registerEntityslotOptionsForPools(entityslot);
			changePoolByEntityslot(entityslot, true);
			_dispatcher.triggerEvent("postAddSelection", { entityslot: entityslot });
		}
		
		return entity;
	};
	
	this.cloneEntry = function(entityslot) {
		var armyData = _armyState.getArmyData(entityslot.armyIndex);
		var newEntityslot = entityslot.clone();
		var newEntity = newEntityslot.entity;
		armyData.addEntry(newEntityslot, false);
		newEntity.totalCost = 0; // will be recalculated later on
		registerEntityslotOptionsForPools(newEntityslot);
		changePoolByEntityslot(newEntityslot, true);
		fixOptionPool(newEntityslot.entity);
		
		_dispatcher.triggerEvent("postAddSelection", { entityslot: newEntityslot });
	};
	
	this.deleteEntry = function(entityslot) {
		var armyData = _armyState.getArmyData(entityslot.armyIndex);
		var entity = entityslot.entity;
		_armyState.addTotalPoints((-1) * entity.totalCost);
		unregisterEntityslotOptionsForPools(entityslot);
		armyData.removeEntry(entityslot);
		
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
