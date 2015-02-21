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
 * DataReader reads data from the data repository (i.e. mainly the server or 
 * the file system when used offline).
 */
function DataReader(dispatcher, remoteService, systemState, modificationService, poolService, languageService) {
	
	this.init = function() {
		dispatcher.bindEvent("postInit", this, this.onPostInit, dispatcher.PHASE_BEGIN);
		dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, dispatcher.PHASE_BEGIN);
	};
	
	this.onPostInit = function(event) {
		this.reloadAllTexts();
	};
	
	this.onPostChangeLanguage = function(event) {
		this.reloadAllTexts();
	};

    function getSystemPath(system) {
        return "data/" + system.systemPrefix + "/";
    }

	function getArmyPath(army) {
		return getSystemPath(systemState.system) + army.armyPrefix + "/";
	}
	
	function loadfail(filename, response, errortype, message) {
		alert("Error: Failed to read file: " + filename + ", error message: " + message);
	}
	
	this.reloadAllTexts = function() {
		_guiState.resetTexts();
		this.readTextsCommon();
		this.readTextsSystem();
		traverseArmyUnit(this, this.readTextsArmy);
	};
	
	this.readTextsCommon = function() {
		this.readTexts("data/textcommon", $.proxy(_guiState.addTexts, _guiState));
	};
	
	this.readTextsSystem = function() {
		var currentSystem = systemState.system;
		if(currentSystem != null) {
			this.readTexts(getSystemPath(currentSystem) + "textsystem", $.proxy(_guiState.addTexts, _guiState));
		}
	};
	
	this.readTextsArmy = function(armyUnit, detachmentData) {
		var army = armyUnit.getArmy();
		if(army != null) {
			this.readTexts(getArmyPath(army) + "textarmy", $.proxy(detachmentData.addTexts, detachmentData));
		}
	};
	
	this.readTexts = function(filepath, callback) {
		var file = filepath + "_" + languageService.getLanguage() + ".json";
		remoteService.getRemoteFile(file, this.readTextsSuccess, null, false, { callback: callback });
	};
	
	this.readTextsSuccess = function(data, additionalParams) {
		additionalParams.callback(data);
	};
	
	this.readSystems = function() {
		remoteService.getRemoteFile('data/systems.json', this.readSystemsSuccess, loadfail, false);
	};
	
	this.readSystemsSuccess = function(data) {
		for(var i = 0; i < data.length; i++) {
			var obj = data[i];
			var systemId = obj.systemid;
			var systemName = obj.systemname;
			var systemPrefix = obj.systemprefix;
			var system = new System(systemId, systemName, systemPrefix);
			_systems.push(system);
		}
	};

    this.readSystem = function(system) {
		remoteService.getRemoteFile(getSystemPath(system) + '/system.json', this.readSystemSuccess, loadfail, false, { system: system });
    };

    this.readSystemSuccess = function(data, additionalParams) {

        var system = additionalParams.system;
        var defaultSlotCost = coalesce(data.defaultSlotCost, 1);
        var slots = data.slots;
        var special = data.special;
        var armies = data.armies;
        var extensions = data.extensions;

        for (var i = 0; i < slots.length; i++) {
            var mySlot = slots[i];
            systemState.slots[mySlot.id] = new Slot(mySlot.id, mySlot.name, mySlot.order);
        }
        for (var i = 0; i < special.length; i++) {
            var mySpecial = special[i];
            system.special[mySpecial.id] = new Special(mySpecial.id, mySpecial.name);
        }

        var detachmentTypes = {};
        for(var i = 0; i < data.detachmentTypes.length; i++) {
            var obj = data.detachmentTypes[i];
            detachmentTypes[obj.id] = new DetachmentType(obj.id, obj.name, obj.group, obj.minSlotCounts, obj.maxSlotCounts, isUndefined(obj.canBePrimary) ? true : obj.canBePrimary, null, obj.modifications, null);
        }
        system.detachmentTypes = detachmentTypes;

		systemState.armies = parseArmies(armies);
		systemState.extensions = parseArmies(extensions);
		//$.extend(true, systemState.armies, systemState.extensions);
	};

	function parseArmies(armies) {
		var retValue = {};
		for(var i = 0; i < armies.length; i++) {
			var obj = armies[i];
			var armyId = obj.id;
			var armyName = obj.name;
			var armyPrefix = obj.prefix;
			var armyGroup = obj.group;
			retValue[armyId] = new Army(armyId, armyName, armyPrefix, armyGroup);
		}
		return retValue;
	}
	
	this.readArmy = function(data, additionalParams) {
		this.readArmydata(additionalParams.detachmentData, additionalParams.armyUnit, data);
	};
	
	this.readArmydata = function(detachmentData, armyUnit, data) {

		var detachmentDataIndex = detachmentData.getDetachmentDataIndex();
		var armyUnitIndex = armyUnit.getArmyUnitIndex();

		//var modifications = data.modifications || [];
		//var detachmentTypeBlacklist = [];
		//for(var i = 0; i < modifications.length; i++) {
		//	var modification =
		//	if() {
		//
		//	}
		//}

		var entities = data.entities || [];
		for(var i = 0; i < entities.length; i++) {
			var obj = entities[i];
			var entityId = obj.eId;
			var entityName = obj.eName;
			var cost = obj.cost || 0;
			var costPerModel = obj.costPerModel || 0;
			var minCount = coalesce(obj.minCount, 1);
			var maxCount = coalesce(obj.maxCount, 1);
			var special = obj.special;
			var localPools = readPools(detachmentDataIndex, obj.localPools);
			var modelCountPoolChange = obj.modelCountPoolChange;
			var entity = new Entity(detachmentDataIndex, armyUnitIndex, entityId, entityName, cost, costPerModel, minCount, maxCount, special, localPools, modelCountPoolChange);
			var optionLists = obj.optionLists;
			if(!isUndefined(optionLists)) {
				//			entity.optionDisplayState = _guiState.OPTION_DISPLAYSTATE_EXPANDED;
				readOptions(detachmentDataIndex, entity, optionLists);
				//		} else {
				//			entity.optionDisplayState = _guiState.OPTION_DISPLAYSTATE_ALWAYS;
			}
			
			armyUnit.addToEntityPool(entity);
		}
		
		var pools = data.pools || [];
		for(var i = 0; i < pools.length; i++) {
			var obj = pools[i];
			var pool = new Pool(detachmentDataIndex, obj.name, obj.start);
			detachmentData.addPool(pool);
		}
		
		var entityslots = data.entityslots || [];
		for(var i = 0; i < entityslots.length; i++) {
			var obj = entityslots[i];

			var restricted = coalesce(obj.restricted, false);
			if(restricted) {
				var armyRestrictions = obj.armyRestrictions || [];
				if($.inArray(detachmentData.getArmy("a0").armyId, armyRestrictions) == -1) {
					continue;
				}
			}

			var entityslotId = obj.esId;
			var entityId = obj.eId;
			var slotId = obj.sId;
			var minTaken = coalesce(obj.minTaken, 0);
			var maxTaken = coalesce(obj.maxTaken, Number.MAX_VALUE);
			var slotCost = coalesce(obj.slotCost, systemState.system.defaultSlotCost);
			var fillsPool = coalesce(obj.fillsPool, null);
			fillsPool = poolService.parsePools(detachmentDataIndex, fillsPool);
			var needsPool = coalesce(obj.needsPool, null);
			needsPool = poolService.parsePools(detachmentDataIndex, needsPool);
			var visible = coalesce(obj.visible, true);
			
			var entityslot = new EntitySlot(detachmentDataIndex, armyUnitIndex, entityslotId, entityId, slotId, minTaken, maxTaken, slotCost, fillsPool, needsPool, visible, armyUnitIndex);
			armyUnit.addEntityslot(entityslot);
			armyUnit.setEntityCount(entityslot.entityslotId, 0);
            poolService.registerEntityslotForPools(entityslot);
			if(visible) {
				detachmentData.increaseEntityslotCount(slotId);
			}
		}

		var detachmentTypes = {};
		var detachmentTypesObj = data.detachmentTypes || [];

		for(var i = 0; i < detachmentTypesObj.length; i++) {
			var obj = detachmentTypesObj[i];
			var canBePrimary = isUndefined(obj.canBePrimary) ? true : obj.canBePrimary;
			detachmentTypes[obj.id] = new DetachmentType(obj.id, obj.name, obj.group, obj.minSlotCounts, obj.maxSlotCounts, canBePrimary, obj.formationData, obj.modifications, armyUnitIndex);
		}
		detachmentData.addDetachmentTypes(detachmentTypes);

		if(!armyUnit.isExtension()) {
			var extensions = {};
			var extensionObj = data.extensions || [];
			for(var i in extensionObj) {
				extensions[extensionObj[i]] = "1";
			}
			detachmentData.setAllowedExtensions(extensions);
		}

		var entityPool = armyUnit.getEntityPool();
		this.resolveDeepOptions(entityPool);
		resolveLocalPoolChain(detachmentData, armyUnit);
		
//		var allies = data.allies || [];
//		if(allies.length > 0) {
//			detachmentData.allowedAllies.push.apply(detachmentData.allowedAllies, allies);
//		}
		
		traverseDetachmentData(poolService, poolService.checkPoolsAvailable);

		if(armyUnit.isExtension()) {
			var modifications = data.modifications || [];
			modificationService.applyModifications(detachmentData, modifications, armyUnit)
		}
	};
	
	this.loadArmy = function(armyUnit, detachmentData) {
		this.readTextsArmy(armyUnit, detachmentData);
		var armyPath = getArmyPath(armyUnit.getArmy()) + "army.json";
		remoteService.getRemoteFile(armyPath, $.proxy(this.readArmy, this), loadfail, false, { detachmentData: detachmentData, armyUnit: armyUnit });
	};
	
	function readOptions(detachmentDataIndex, entity, optionListsJson) {
		var optionLists = {};
		for(var i = 0; i < optionListsJson.length; i++) {
			var obj = optionListsJson[i];
			var optionListId = obj.olId;
			var minTaken = coalesce(obj.minTaken, 0);
			var maxTaken = coalesce(obj.maxTaken, Number.MAX_VALUE);
			var optionList = new OptionList(optionListId, minTaken, maxTaken);
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
				fillsPool = poolService.parsePools(detachmentDataIndex, fillsPool);
				var needsPool = obj2.needsPool || null;
				needsPool = poolService.parsePools(detachmentDataIndex, needsPool);
				var fillsLocalPool = obj2.fillsLocalPool || null;
				fillsLocalPool = poolService.parsePools(detachmentDataIndex, fillsLocalPool);
				var needsLocalPool = obj2.needsLocalPool || null;
				needsLocalPool = poolService.parsePools(detachmentDataIndex, needsLocalPool);
				var option = new Option(optionId, entityId, cost, costPerModel, minTaken, maxTaken, fillsPool, needsPool, fillsLocalPool, needsLocalPool);
				optionList.options[optionId] = option;
			}
			entity.optionLists = optionLists;
		}
	}

	this.resolveDeepOptions = function(entityPool) {
		for(var i in entityPool) {
			this.resolveDeepOptionForEntity(entityPool, entityPool[i]);
		}
	};

	this.resolveDeepOptionForEntity = function(entityPool, entity) {
		if(entity.hasOptions()) {
			this.resolveDeepOptionsForOptionLists(entityPool, entity.optionLists);
		}
	};

	this.resolveDeepOptionsForOptionLists = function(entityPool, optionLists) {
		for(var i in optionLists) {
			var optionList = optionLists[i];
			for(var j in optionList.options) {
				var option = optionList.options[j];
				var entity = entityPool[option.entityId];
				if(entity.hasOptions() /*&& !option.hasOptions()*/) { // the second condition is to avoid duplicate computations
					option.optionLists = cloneObject(entity.optionLists);
					this.resolveDeepOptionsForOptionLists(entityPool, option.optionLists);
				}
			}
		}
	};

	function resolveLocalPoolChain(detachmentData, armyUnit) {
		for(var i in armyUnit.getEntityPool()) {
			var entity = armyUnit.getFromEntityPool(i);
			if(entity.hasOptions()) {
				traverseOptions(detachmentData, armyUnit, entity, copyLocalPools);
			}
		}
	}
	
	function copyLocalPools(detachmentData, armyUnit, optionList, option) {
		var optionEntity = armyUnit.getFromEntityPool(option.entityId);
		var hasLocalPools = false;
		var localPools = {};
		for(var i in optionEntity.localPools) {
			hasLocalPools = true;
			localPools[i] = optionEntity.localPools[i].clone();
		}
		if(hasLocalPools) {
			option.localPools = localPools;
		}
	}
	
	function readPools(detachmentDataIndex, poolsParam) {
		var pools = {};
		if(isUndefined(poolsParam)) {
			return pools;
		}
		for(var i = 0; i < poolsParam.length; i++) {
			var name = poolsParam[i].name;
			var start = poolsParam[i].start;
			pools[name] = new Pool(detachmentDataIndex, name, start);
		}
		return pools;
	}

}
