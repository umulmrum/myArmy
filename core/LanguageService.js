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

function LanguageService(dataStore) {

    this.getLanguage = function() {
        return _guiState.lang;
    };

    this.changeLanguage = function(language) {
        _guiState.lang = language;
        dataStore.setCookie("myArmy.language", _guiState.lang);
    };

    this.restoreLanguage = function() {
        var lang = dataStore.readCookieValue("myArmy.language");
        if (lang != null) {
            _guiState.lang = lang;
        }
    };
}