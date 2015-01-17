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
 * DataReader reads data from the data repository (i.e. mainly the server or 
 * the file system when used offline).
 */
function DataReader() {
	
	this.init = function() {
		_dispatcher.bindEvent("postInit", this, this.onPostInit, _dispatcher.PHASE_BEGIN);
		_dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, _dispatcher.PHASE_BEGIN);
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
		return getSystemPath(_systemState.system) + army.armyPrefix + "/";
	}
	
	function doJson(file, successHandler, errorHandler, isAsync, additionalParams) {
		$.ajax({
			url : file,
			dataType : 'json',
			success : function(data, textstats, jqXHR) {
				successHandler(data, additionalParams);
			},
			error : errorHandler,
			async: isAsync,
			cache: false
		});
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
		var currentSystem = _systemState.system;
		if(currentSystem != null) {
			this.readTexts(getSystemPath(currentSystem) + "textsystem", $.proxy(_guiState.addTexts, _guiState));
		}
	};
	
	this.readTextsArmy = function(armyUnit) {
		var army = armyUnit.getArmy();
		if(army != null) {
			this.readTexts(getArmyPath(army) + "textarmy", $.proxy(armyUnit.setTexts, armyUnit));
		}
		var detachmentTexts = {};
		for(var bundlekey in _guiState.text) {
			if(bundlekey.indexOf("detachment.") == 0) {
				detachmentTexts[bundlekey] = _guiState.getText(bundlekey);
			}
		}
		armyUnit.addTexts(detachmentTexts);
	};
	
	this.readTexts = function(filepath, callback) {
		var file = filepath + "_" + _guiState.lang + ".json";
		doJson(file, this.readTextsSuccess, null, false, { callback: callback });
	};
	
	this.readTextsSuccess = function(data, additionalParams) {
		additionalParams.callback(data);
	};
	
	this.readSystems = function() {
		doJson('data/systems.json', this.readSystemsSuccess, loadfail, false);
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
        doJson(getSystemPath(system) + '/system.json', this.readSystemSuccess, loadfail, false, { system: system });
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
            _systemState.slots[mySlot.id] = new Slot(mySlot.id, mySlot.name, mySlot.order);
        }
        for (var i = 0; i < special.length; i++) {
            var mySpecial = special[i];
            system.special[mySpecial.id] = new Special(mySpecial.id, mySpecial.name);
        }

        var detachmentTypes = {};
        for(var i = 0; i < data.detachmentTypes.length; i++) {
            var obj2 = data.detachmentTypes[i];
            detachmentTypes[obj2.id] = new DetachmentType(obj2.id, obj2.name, obj2.minSlotCounts, obj2.maxSlotCounts, isUndefined(obj2.canBePrimary) ? true : obj2.canBePrimary);
        }
        system.detachmentTypes = detachmentTypes;

		_systemState.armies = parseArmies(armies);
		_systemState.extensions = parseArmies(extensions);

	};

	function parseArmies(armies) {
		var retValue = [];
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
		this.readArmydata(additionalParams.detachmentDataIndex, additionalParams.armyUnitIndex, data);
	};
	
	this.readArmydata = function(detachmentDataIndex, armyUnitIndex, data) {
		
		var detachmentData = _armyState.getDetachmentData(detachmentDataIndex);
		var armyUnit = detachmentData.getArmyUnit(armyUnitIndex);
		
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
			var entity = new Entity(entityId, entityName, cost, costPerModel, minCount, maxCount, special, localPools, modelCountPoolChange);
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
			armyUnit.addPool(pool);
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
			var slotCost = coalesce(obj.slotCost, _systemState.system.defaultSlotCost);
			var fillsPool = coalesce(obj.fillsPool, null);
			fillsPool = parsePools(detachmentDataIndex, fillsPool);
			var needsPool = coalesce(obj.needsPool, null);
			needsPool = parsePools(detachmentDataIndex, needsPool);
			var enabled = true;//coalesce(obj.enabled, true);
			
			var entityslot = new EntitySlot(detachmentDataIndex, armyUnitIndex, entityslotId, entityId, slotId, minTaken, maxTaken, slotCost, fillsPool, needsPool, enabled);
			armyUnit.addEntityslot(entityslot);
			armyUnit.setEntityCount(entityslot.entityslotId, 0);
			registerEntityslotForPools(entityslot);
			if(enabled) {
				detachmentData.increaseEntityslotCount(slotId);
			}
		}

		var detachmentTypes = {};
		var detachmentTypesObj = data.detachmentTypes || [];

		for(var i = 0; i < detachmentTypesObj.length; i++) {
			var obj = detachmentTypesObj[i];
			detachmentTypes[obj.id] = new DetachmentType(obj.id, obj.name, obj.minSlotCounts, obj.maxSlotCounts, isUndefined(obj.canBePrimary) ? true : obj.canBePrimary);
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
		resolveDeepOptions(entityPool);
		resolveLocalPoolChain(armyUnit);
		
//		var allies = data.allies || [];
//		if(allies.length > 0) {
//			detachmentData.allowedAllies.push.apply(detachmentData.allowedAllies, allies);
//		}
		
		traverseArmyUnit(null, checkPoolsAvailable);
	};
	
	this.loadArmy = function(armyUnit, detachmentDataIndex) {
		this.readTextsArmy(armyUnit);
		var armyPath = getArmyPath(armyUnit.getArmy()) + "army.json";
		doJson(armyPath, $.proxy(this.readArmy, this), loadfail, false, { detachmentDataIndex: detachmentDataIndex, armyUnitIndex: armyUnit.getArmyUnitIndex() });
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
				fillsPool = parsePools(detachmentDataIndex, fillsPool);
				var needsPool = obj2.needsPool || null;
				needsPool = parsePools(detachmentDataIndex, needsPool);
				var fillsLocalPool = obj2.fillsLocalPool || null;
				fillsLocalPool = parsePools(detachmentDataIndex, fillsLocalPool);
				var needsLocalPool = obj2.needsLocalPool || null;
				needsLocalPool = parsePools(detachmentDataIndex, needsLocalPool);
				var option = new Option(optionId, entityId, cost, costPerModel, minTaken, maxTaken, fillsPool, needsPool, fillsLocalPool, needsLocalPool);
				optionList.options[optionId] = option;
			}
			entity.optionLists = optionLists;
		}
	}

	function resolveDeepOptions(entityPool) {
		for(var i in entityPool) {
			var entity = entityPool[i];
			if(entity.hasOptions()) {
				doResolveDeepOptions(entityPool, entity.optionLists);
			}
		}
	}

	function doResolveDeepOptions(entityPool, optionLists) {
		for(var i in optionLists) {
			var optionList = optionLists[i];
			for(var j in optionList.options) {
				var option = optionList.options[j];
				var entity = entityPool[option.entityId];
				if(entity.hasOptions() /*&& !option.hasOptions()*/) { // the second condition is to avoid duplicate computations
					option.optionLists = cloneObject(entity.optionLists);
					doResolveDeepOptions(entityPool, option.optionLists);
				}
			}
		}
	}

	function resolveLocalPoolChain(armyUnit) {
		for(var i in armyUnit.getEntityPool()) {
			var entity = armyUnit.getFromEntityPool(i);
			if(entity.hasOptions()) {
				traverseOptions(armyUnit, entity, copyLocalPools);
			}
		}
	}
	
	function copyLocalPools(armyUnit, optionList, option) {
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
