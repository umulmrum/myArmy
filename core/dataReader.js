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
	
	function getArmyPath(army) {
		return _systemState.system.systemBaseDir + army.armyPrefix + "/";
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
		_guiState.text = {};
		this.readTextsCommon();
		this.readTextsSystem();
		traverseArmyData(this, this.readTextsArmy);
	};
	
	this.readTextsCommon = function() {
		this.readTexts("data/textcommon", _guiState.text);
	};
	
	this.readTextsSystem = function() {
		var currentSystem = _systemState.system;
		if(currentSystem != null) {
			this.readTexts(currentSystem.systemBaseDir + "textsystem", _guiState.text);
			if(_armyState.getArmyData(0) != null) {
				this.readTexts(currentSystem.systemBaseDir + "textarmy", _armyState.getArmyData(0).text);
			}
		}
	};
	
	this.readTextsArmy = function(armyData) {
		var army = armyData.army;
		if(army != null) {
			this.readTexts(getArmyPath(army) + "textarmy", armyData.text);
		}
	};
	
	this.readTexts = function(filepath, target) {
		var file = filepath + "_" + _guiState.lang + ".json";
		doJson(file, this.readTextsSuccess, null, false, { target: target });
	};
	
	this.readTextsSuccess = function(data, additionalParams) {
		for(var i in data) {
			additionalParams.target[i] = data[i];
		}
	};
	
	this.readSystems = function() {
		doJson('data/system.json', this.readSystemsSuccess, loadfail, false);
	};
	
	this.readSystemsSuccess = function(data) {
		for(var i = 0; i < data.length; i++) {
			var obj = data[i];
			var systemId = obj.systemid;
			var systemName = obj.systemname;
			var systemBaseDir = obj.systembasedir;
			var defaultSlotCost = coalesce(obj.defaultSlotCost, 1);
			var slots = obj.slots;
			var special = obj.special;
			var system = new System(systemId, systemName, systemBaseDir, defaultSlotCost, slots, special);
			_systems.push(system);
			var detachmentTypes = obj.detachmentTypes;
			for(var j = 0; j < detachmentTypes.length; j++) {
				var obj2 = detachmentTypes[j];
				system.detachmentTypes[obj2.id] = new DetachmentType(obj2.id, obj2.name, obj2.minSlotCounts, obj2.maxSlotCounts, isUndefined(obj2.canBePrimary) ? true : obj2.canBePrimary);
			}
		}
	};
	
	this.readArmies = function() {
		doJson(_systemState.system.systemBaseDir + "armies.json", this.readArmiesSuccess, loadfail, false);
	};
	
	this.readArmiesSuccess = function(data) {
		_systemState.armies = {};
		
		for(var i = 0; i < data.length; i++) {
			var obj = data[i];
			var armyId = obj.id;
			var armyName = obj.name;
			var armyPrefix = obj.prefix;
			var armyGroup = obj.group;
			_systemState.armies[armyId] = new Army(armyId, armyName, armyPrefix, armyGroup);
		}
	};
	
	this.readArmy = function(data, additionalParams) {
		this.readArmydata(additionalParams.armyIndex, data);
	};
	
	this.readArmydata = function(armyIndex, data) {
		
		var armyData = _armyState.getArmyData(armyIndex);
		
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
			var localPools = readPools(armyIndex, obj.localPools);
			var modelCountPoolChange = obj.modelCountPoolChange;
			var entity = new Entity(entityId, entityName, cost, costPerModel, minCount, maxCount, special, localPools, modelCountPoolChange);
			var optionLists = obj.optionLists;
			if(!isUndefined(optionLists)) {
				//			entity.optionDisplayState = _guiState.OPTION_DISPLAYSTATE_EXPANDED;
				readOptions(armyIndex, entity, optionLists);
				//		} else {
				//			entity.optionDisplayState = _guiState.OPTION_DISPLAYSTATE_ALWAYS;
			}
			
			armyData.entityPool[entity.entityId] = entity;
		}
		
		var pools = data.pools || [];
		for(var i = 0; i < pools.length; i++) {
			var obj = pools[i];
			var pool = new Pool(armyIndex, obj.name, obj.start);
			armyData.addPool(pool.name, pool);
		}
		
		var entityslots = data.entityslots || [];
		for(var i = 0; i < entityslots.length; i++) {
			var obj = entityslots[i];
			var entityslotId = obj.esId;
			var entityId = obj.eId;
			var slotId = obj.sId;
			var minTaken = coalesce(obj.minTaken, 0);
			var maxTaken = coalesce(obj.maxTaken, Number.MAX_VALUE);
			var slotCost = coalesce(obj.slotCost, _systemState.system.defaultSlotCost);
			var fillsPool = coalesce(obj.fillsPool, null);
			fillsPool = parsePools(armyIndex, fillsPool);
			var needsPool = coalesce(obj.needsPool, null);
			needsPool = parsePools(armyIndex, needsPool);
			
			var entityslot = new EntitySlot(armyIndex, entityslotId, entityId, slotId, minTaken, maxTaken, slotCost, fillsPool, needsPool);
			armyData.entityslots[entityslot.entityslotId] = entityslot;
			armyData.setEntityCount(entityslot.entityslotId, 0);
			registerEntityslotForPools(entityslot);
			if(isUndefined(armyData.entityslotCount[slotId])) {
				armyData.entityslotCount[slotId] = 1;
			} else {
				armyData.entityslotCount[slotId]++;
			}
		}
		
		resolveDeepOptions(armyData);
		resolveLocalPoolChain(armyData);
		
		var allies = data.allies || [];
		if(allies.length > 0) {
			armyData.allowedAllies.push.apply(armyData.allowedAllies, allies);
		}
		
		traverseArmyData(null, checkPoolsAvailable);
	};
	
	this.loadArmy = function(armyData, armyIndex) {
		var armyPath = getArmyPath(armyData.army) + "army.json";
		doJson(armyPath, $.proxy(this.readArmy, this), loadfail, false, { armyIndex: armyIndex});
	};
	
	this.loadSystemArmy = function() {
		doJson(_systemState.system.systemBaseDir + "army.json", $.proxy(this.readArmy, this), loadfail, false, { armyIndex: 0});
	};
	
	function readOptions(armyIndex, entity, optionListsJson) {
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
			for(var j = 0; j < optionsJson.length; j++) {
				var obj2 = optionsJson[j];
				var optionId = obj2.oId;
				var entityId = obj2.eId;
				var cost = coalesce(obj2.cost, 0);
				var costPerModel = coalesce(obj2.costPerModel, 0);
				var minTaken = coalesce(obj2.minTaken, 0);
				var maxTaken = coalesce(obj2.maxTaken, 1);
				var fillsPool = obj2.fillsPool || null;
				fillsPool = parsePools(armyIndex, fillsPool);
				var needsPool = obj2.needsPool || null;
				needsPool = parsePools(armyIndex, needsPool);
				var fillsLocalPool = obj2.fillsLocalPool || null;
				fillsLocalPool = parsePools(armyIndex, fillsLocalPool);
				var needsLocalPool = obj2.needsLocalPool || null;
				needsLocalPool = parsePools(armyIndex, needsLocalPool);
				var option = new Option(optionId, entityId, cost, costPerModel, minTaken, maxTaken, fillsPool, needsPool, fillsLocalPool, needsLocalPool);
				optionList.options[optionId] = option;
			}
			entity.optionLists = optionLists;
		}
	}

	function resolveDeepOptions(armyData) {
		for(var i in armyData.entityPool) {
			var entity = armyData.entityPool[i];
			if(entity.hasOptions()) {
				doResolveDeepOptions(armyData, entity.optionLists);
			}
		}
	}

	function doResolveDeepOptions(armyData, optionLists) {
		for(var i in optionLists) {
			var optionList = optionLists[i];
			for(var j in optionList.options) {
				var option = optionList.options[j];
				var entity = armyData.entityPool[option.entityId];
				if(entity.hasOptions() /*&& !option.hasOptions()*/) { // the second condition is to avoid duplicate computations
					option.optionLists = cloneObject(entity.optionLists);
					doResolveDeepOptions(armyData, option.optionLists);
				}
			}
		}
	}

	function resolveLocalPoolChain(armyData) {
		for(var i in armyData.entityPool) {
			var entity = armyData.entityPool[i];
			if(entity.hasOptions()) {
				traverseOptions(armyData, entity, copyLocalPools);
			}
		}
	}
	
	function copyLocalPools(armyData, optionList, option) {
		var optionEntity = armyData.entityPool[option.entityId];
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
	
	function readPools(armyIndex, poolsParam) {
		var pools = {};
		if(isUndefined(poolsParam)) {
			return pools;
		}
		for(var i = 0; i < poolsParam.length; i++) {
			var name = poolsParam[i].name;
			var start = poolsParam[i].start;
			pools[name] = new Pool(armyIndex, name, start);
		}
		return pools;
	}

}