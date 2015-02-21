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
    var dataReader = null;
    var systemState = null;
    var armyState = null;
    var persistence = null;
    var modificationService = null;
    var controller = null;
    var textService = null;
    var extensionManager = null;
    var poolService = null;
    var gui = null;

    this.init = function() {

        systemState = new SystemState();

        armyState = new ArmyState(systemState);

        dispatcher = new Dispatcher();

        poolService = new PoolService(armyState);

        persistence = new Persistence(dispatcher, systemState, armyState, poolService);
        persistence.init();

        state = new State(dispatcher, systemState, armyState, persistence, poolService);
        state.init();

        dataStore = new DataStore();

        remoteService = new RemoteService();
        if(_options.core.cacheRemoteFiles && dataStore.isLocalStorageAvailable()) {
            remoteService = new CachedRemoteService(remoteService, dataStore);
        }
        remoteService.init();

        modificationService = new ModificationService(poolService);

        dataReader = new DataReader(dispatcher, remoteService, systemState, modificationService, poolService);
        dataReader.init();

        modificationService.init();

        controller = new Controller(dispatcher, dataStore, dataReader, systemState, armyState, persistence, poolService, modificationService);

        textService = new TextService(dispatcher, armyState);
        textService.init();

        gui = new Gui(dispatcher, systemState, armyState, controller);
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
}