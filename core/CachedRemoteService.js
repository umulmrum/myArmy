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

function CachedRemoteService(decoratedRemoteService, dataStore) {

    this.init = function() {
        var version = dataStore.getLocalData("myArmyVersion", true);
        if(version != _version) {
            purgeCache();
            dataStore.setLocalData("myArmyVersion", _version, true);
        }
    };

    this.getRemoteFile = function(file, successHandler, errorHandler, isAsync, additionalParams) {

        var data = getFromCache(file);
        if(data != null) {
            successHandler(JSON.parse(data), additionalParams);
        } else {
            additionalParams = additionalParams || [];
            additionalParams['CachedRemoteService.cacheKey'] = file;
            additionalParams['CachedRemoteService.successHandler'] = successHandler;
            decoratedRemoteService.getRemoteFile(file, cacheSuccess, errorHandler, isAsync, additionalParams, 'text');
        }

    };

    function cacheSuccess(data, additionalParams) {
        putToCache(additionalParams['CachedRemoteService.cacheKey'], data);
        var successHandler = additionalParams['CachedRemoteService.successHandler'];
        successHandler(JSON.parse(data), additionalParams);
    }

    function getFromCache(key) {
        var data = dataStore.getLocalData("remote/" + key, true);
        if(isUndefined(data)) {
            return null;
        } else {
            return data;
        }
    }

    function putToCache(key, content) {
        dataStore.setLocalData("remote/" + key, content, true);
    }

    function purgeCache() {
        for(var key in localStorage) {
            if(key.indexOf("remote/") == 0) {
                delete localStorage[key];
            }
        }
    }
}