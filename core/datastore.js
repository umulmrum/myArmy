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
 * The DataStore is used to store data on the user's device. It is basically
 * an abstraction for cookie and localStorage.
 */
function DataStore() {
	
	this.setCookie = function(name, value) {
		
		if (navigator.cookieEnabled) {
			var date = new Date();
			date.setTime(date.getTime() + (365 * 24 * 3600 * 1000));
			var cookieString = 
				name + "=" + value
				+ "; domain=" + window.location.hostname
				+ "; expires=" + date.toUTCString()
				+ "; path=/"
				;
			
			document.cookie = cookieString;
		}
	};

	this.readCookieValue = function(name) {
		if (!navigator.cookieEnabled || !document.cookie) {
			return null;
		}
		var cookie = document.cookie.split(";");
		for ( var i in cookie) {
			var myCookie = $.trim(cookie[i]).split("=");
			if (myCookie[0] == name) {
				return myCookie[1];
			}
		}
		return null;
	};

	this.isLocalStorageAvailable = function() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	};
	
	this.setLocalData = function(name, value, permanent) {
		try {
			if(isUndefined(permanent) || !permanent) {
				window.sessionStorage[name] = value;
			} else {
				window.localStorage[name] = value;
			}
		} catch(e) {
			// TODO message
		}
	};
	
	this.unsetLocalData = function(name, permanent) {
		try {
			if(isUndefined(permanent) || !permanent) {
				delete window.sessionStorage[name];
			} else {
				delete window.localStorage[name];
			}
		} catch(e) {
			// TODO message
		}
	};
	
	this.getLocalData = function(name, permanent) {
		if(isUndefined(permanent) || !permanent) {
			return window.sessionStorage[name];
		} else {
			return window.localStorage[name];
		}
	};
	
}