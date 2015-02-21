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

function Container() {

    var dispatcher = null;
    var state = null;
    var dataStore = null;
    var remoteService = null;
    var languageService = null;
    var dataReader = null;
    var systemState = null;
    var systemService = null;
    var armyState = null;
    var persistence = null;
    var modificationService = null;
    var controller = null;
    var textService = null;
    var extensionManager = null;
    var poolService = null;
    var detachmentService = null;
    var selectionService = null;
    var optionService = null;
    var gui = null;

    this.init = function() {

        systemState = new SystemState();

        systemService = new SystemService(systemState);

        armyState = new ArmyState(systemState);

        dispatcher = new Dispatcher();

        optionService = new OptionService(armyState);

        poolService = new PoolService(armyState, optionService);
        optionService.setPoolService(poolService);

        selectionService = new SelectionService(armyState, poolService);

        detachmentService = new DetachmentService(systemState, armyState);

        persistence = new Persistence(dispatcher, systemService, systemState, armyState, poolService, detachmentService, selectionService, optionService);
        persistence.init();

        state = new State(dispatcher, systemState, armyState, persistence, poolService, optionService);
        state.init();

        dataStore = new DataStore();

        remoteService = new RemoteService();
        if(_options.core.cacheRemoteFiles && dataStore.isLocalStorageAvailable()) {
            remoteService = new CachedRemoteService(remoteService, dataStore);
        }
        remoteService.init();

        languageService = new LanguageService(dataStore);

        modificationService = new ModificationService(poolService);

        dataReader = new DataReader(dispatcher, remoteService, systemState, modificationService, poolService, languageService);
        dataReader.init();

        modificationService.init();

        detachmentService.setDataReader(dataReader);
        detachmentService.setModificationService(modificationService);
        detachmentService.setPersistence(persistence);
        systemService.setDataReader(dataReader);

        controller = new Controller(dispatcher, languageService, systemService, detachmentService, selectionService, optionService);

        textService = new TextService(dispatcher, armyState);
        textService.init();

        gui = new Gui(dispatcher, systemState, armyState, controller, languageService);
        gui.init();

        extensionManager = new ExtensionManager(dispatcher, gui);

    };


    this.getDispatcher = function() {
        return dispatcher;
    };

    this.getState = function() {
        return state;
    };

    this.getDataStore = function() {
        return dataStore;
    };

    this.getRemoteService = function() {
        return remoteService;
    };

    this.getLanguageService = function() {
        return languageService;
    };

    this.getDataReader = function() {
        return dataReader;
    };

    this.getSystemState = function() {
        return systemState;
    };

    this.getArmyState = function() {
        return armyState;
    };

    this.getPersistence = function() {
        return persistence;
    };

    this.getModificationService = function() {
        return modificationService;
    };

    this.getController = function() {
        return controller;
    };

    this.getTextService = function() {
        return textService;
    };

    this.getExtensionManager = function() {
        return extensionManager;
    };

    this.getPoolService = function() {
        return poolService;
    };

    this.getGui = function() {
        return gui;
    };

    this.getOptionService = function() {
        return optionService;
    };

    this.getSystemService = function() {
        return systemService;
    };
}