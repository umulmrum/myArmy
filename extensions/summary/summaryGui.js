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

function SummaryGui() {

	this.init = function() {
		_dispatcher.bindEvent("postInit", this, this.onPostInit, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("postChangeLanguage", this, this.onPostChangeLanguage, _dispatcher.PHASE_STATE);
		//_dispatcher.bindEvent("postAddDetachment", this, this.onPostAddDetachment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("preCallFragment", this, this.onPreCallFragment, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("summary.postChangeOptions", this, this.onPostChangeOptions, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("summary.postSelectAll", this, this.onPostSelectAll, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("summary.postClickPrint", this, this.onPostClickPrint, _dispatcher.PHASE_STATE);
		_dispatcher.bindEvent("summary.postClickSave", this, this.onPostClickSave, _dispatcher.PHASE_STATE);
		
		_gui.getElement("#chooseShort").on("change", $.proxy(function() { this.refreshSummary(); }, this));
		_gui.getElement("#chooseBBcode").on("change", $.proxy(function() { this.refreshSummary(); }, this));
		_gui.getElement("#chooseSeparateDetachments").on("change", $.proxy(function() { this.refreshSummary(); }, this));
		_gui.getElement("#selectAllButton").on(_guiState.clickEvent, $.proxy(function() { this.selectAllText();	}, this));
		_gui.getElement("#printButton").on(_guiState.clickEvent, $.proxy(function() {this.printSummary(); }, this));
		_gui.getElement("#saveFileButton").on(_guiState.clickEvent, $.proxy(function() { this.saveSummary(); }, this));
		_gui.getElement(".summaryText").on(_guiState.selectEvent, $.proxy(function() { this.selectAllIfSmall();	}, this));
	};

	this.onPostInit = function(event) {
		this.refreshElements();
	};

	this.onPostChangeLanguage = function(event) {
		this.refreshElements();
	};

	this.onPostAddDetachment = function(event, additionalData) {
		this.refreshElements();
	};

	this.onPreCallFragment = function(event, additionalData) {
		if (additionalData.newFragment == "summary") {
			this.refreshSummary();
		}
	};
	
	/**
	 * Refreshes UI elements.
	 */
	this.refreshElements = function() {
		_gui.getElement("#chooseShortText").html(_guiState.text["shortview"]);
		_gui.getElement("#chooseBBcodeText").html(_guiState.text["bbcode"]);
		_gui.getElement("#chooseSeparateDetachmentsText").html(_guiState.text["chooseSeparateDetachmentsText"]);
		_gui.getElement("#selectAllButton").html(_guiState.text["selectall"]);
		_gui.getElement("#copytext").html(_guiState.text["copymessage"]);
		_gui.getElement("#printButton").html(_guiState.text["print"]);
		_gui.getElement("#saveFileButton").html(_guiState.text["savefile"]);
	};
	
	this.selectAllIfSmall = function(event) {
		if(_guiState.isSmallDevice) {
			this.selectAllText();
		}
	};

	this.selectAllText = function() {
		var $element = $(".summaryText");
		var element = $element[0];
		element.focus();

		if (document.body.createTextRange) {
			var range = document.body.createTextRange();
			range.moveToElementText(element);
			range.select();
		} else if (document.selection) {
			var range = document.body.createTextRange();
			range.moveToElementText(element);
			range.select();
		} else if (window.getSelection) {
			var selection = window.getSelection();
			if (selection.setBaseAndExtent) {
				selection.setBaseAndExtent(element, 0, element, 1);
			} else {
				var range = document.createRange();
				range.selectNode(element);
				window.getSelection().removeAllRanges();
				window.getSelection().addRange(range);
			}
		}
		// element.focus();

		// var range = document.createRange();
		// range.setStart(element, 0);
		// range.setEnd(element, element.innerHTML.length - 1);
		// range.select();

		// if (document.selection) {
		// var range = document.body.createTextRange();
		// range.moveToElementText(element);
		// range.select();
		// } else if (window.getSelection) {
		// var range = document.createRange();
		// range.selectNode(element);
		// window.getSelection().addRange(range);
		// // } else if(element.setSelectionRange) {
		// } else {
		// // element.selectionStart = 0;
		// // element.selectionEnd = 9999;
		//    	
		// // setTimeout(function() {
		// // element.setSelectionRange(0, 9999);
		// // }, 1);
		//    	
		// // element.setSelectionRange(0, 99999);
		//    	
		// // $element.select();
		// }
	};

	this.printSummary = function() {
		$("#printContainer").html(
				$(".summaryText").html().replace(/\n/g, "<br />"));
		window.print();
	};
	
	this.saveSummary = function() {
		var content = "";
		content += window.location + "\r\n\r\n\r\n";
		content += $(".summaryText").html().replace(/<br>/g, "\r\n").replace(/<.*?>/g, "");
		var blob = new Blob([content], {type: 'text/plain;charset=utf-8;'});
		
		if(window.navigator && window.navigator.msSaveBlob) {
			window.navigator.msSaveBlob(blob, 'myArmy.txt');
//		} else if(_guiState.device == 'appleMobile') {
//			window.open("data:text/plain;charset=UTF-8;base64," + btoa(unescape(encodeURIComponent(content))));
		} else {
			var a = window.document.createElement('a');
			a.href = window.URL.createObjectURL(blob);
			a.download = 'myArmy.txt';
			$("#saveContainer").append(a);
			a.click();
			$("#saveContainer").children().remove();
		}
	};
	
	this.refreshSummary = function() {

		if (_armyState.getDetachmentCount() == 0) {
			return;
		}

		// initialize options
		var isShort = document.getElementById("chooseShort").checked;
		var isBBcode = document.getElementById("chooseBBcode").checked;
		var isSeparateDetachments = document
				.getElementById("chooseSeparateDetachments").checked;

		var defaultMiscRenderer = new DefaultMiscRenderer();
		var miscRenderer = defaultMiscRenderer;
		var defaultArmyRenderer = new DefaultArmyRenderer();
		var armyRenderer = defaultArmyRenderer;
		if (isShort) {
			miscRenderer = new ShortMiscRendererDecorator(miscRenderer);
			armyRenderer = new ShortArmyRendererDecorator(armyRenderer);
		} else {
			armyRenderer = new LongArmyRendererDecorator(armyRenderer);
		}
		if (isBBcode) {
			miscRenderer = new BBCodeMiscRendererDecorator(miscRenderer);
			armyRenderer = new BBCodeArmyRendererDecorator(armyRenderer);
		}

		// prepare slots
		var sortedSlots = [];
		for ( var i in _systemState.slots) {
			sortedSlots.push(_systemState.slots[i]);
		}

		sortedSlots.sort(function(a, b) {
			return a.order - b.order;
		});

		// generate and output summary
		// generate header
		var s = "";
		s += "<p>";
		s += miscRenderer.renderArmyLabel();
		s += "\n\n";

		// generate army information
		var selectionData = {};
		for ( var i in sortedSlots) {
			var slot = sortedSlots[i];
			for ( var j in _armyState.getDetachments()) {
				var detachmentData = _armyState.getDetachmentData(j);
				if (isUndefined(selectionData[j])) {
					selectionData[j] = {};
				}
				selectionData[j][slot.slotId] = traverseSelections(j,
						detachmentData, slot, armyRenderer);
			}
		}

		var selectionJoinStrategy = null;
		if (isSeparateDetachments) {
			selectionJoinStrategy = new SeparateSelectionJoinStrategy();
		} else {
			selectionJoinStrategy = new MixedSelectionJoinStrategy();
		}

		s += selectionJoinStrategy
				.joinSelections(selectionData, sortedSlots, miscRenderer);

		s += miscRenderer.renderTotalPoints();

		s = s.replace("\"", "\\\"");

		s += '<span class="stateLink">';
		s += miscRenderer.renderStateLink();
		s += "</span>";

		s += "\n\n";
		s += miscRenderer.renderStatistics();

		s += "</p>";
		s = s.replace(/\n/g, "<br />");
		var summaryText = $(".summaryText");
		summaryText.html(s); // will preserve line breaks in IE when doing it
		// that way
	};

	function traverseSelections(detachmentDataIndex, detachmentData, slot, armyRenderer) {
		var data = [];
        for(var i in detachmentData.getArmyUnits()) {
            var armyUnit = detachmentData.getArmyUnit(i);
            if(armyUnit == null) {
                continue;
            }

            for ( var j = 0; j < armyUnit.getSelectionCount(); j++) {
                var slotEntry = armyUnit.getSelection(j);
                if (slotEntry.slotId != slot.slotId) {
                    continue;
                }
                var entity = slotEntry.entity;
                data.push(renderEntity(detachmentData.getPosition(), detachmentData, armyUnit, entity, armyRenderer));
            }
        }
		return data;
	}

	function renderEntity(position, detachmentData, armyUnit, entity, armyRenderer) {
		var s = "";
		s += armyRenderer.renderEntityHeading(position, detachmentData, entity);
		s += armyRenderer.renderEntityCost(entity);
		s += "\n";

		if (entity.hasOptions()) {
			var subSummary = renderOptions(detachmentData, entity.optionLists, 0,
					armyRenderer);
			if (subSummary != '') {
				s += subSummary;
				s += "\n";
			}
		}
		s += "\n";
		return s;
	}

	function renderOptions(detachmentData, optionLists, depth, armyRenderer) {
		var s = "";
		var optionsWithoutSuboptions = [];
		var optionsWithSuboptions = [];

		for ( var i in optionLists) {
			var optionList = optionLists[i];
			for ( var j in optionList.options) {
				var option = optionList.options[j];
				if (!option.selected) {
					continue;
				}
				if (option.hasOptions()) {
					var suboption = armyRenderer.joinSingleSuboption(
							armyRenderer.renderOption(detachmentData, option, depth),
							renderOptions(detachmentData, option.optionLists,
									depth + 1, armyRenderer));
					optionsWithSuboptions.push(suboption);
				} else {
					optionsWithoutSuboptions.push(armyRenderer.renderOption(
						detachmentData, option, depth));
				}
			}
		}

		if (optionsWithoutSuboptions.length > 0) {
			s += armyRenderer.joinOptions(optionsWithoutSuboptions, depth);
		}
		s += armyRenderer.linkOptionsAndSuboptions(
				optionsWithoutSuboptions.length > 0,
				optionsWithSuboptions.length > 0, depth);
		if (optionsWithSuboptions.length > 0) {
			s += armyRenderer.joinSuboptions(optionsWithSuboptions, depth);
		}
		return s;
	}

	function DefaultMiscRenderer() {

		this.renderArmyLabel = function() {

			var string = "";
			var hasMultipleDetachments = _armyState.getDetachmentCount() > 1;
			var isFirst = true;
			for ( var i in _armyState.getDetachments()) {
				var detachmentData = _armyState.getDetachmentData(i);
				if (detachmentData == null) {
					continue;
				}
				var armyUnit = detachmentData.getArmyUnit("a0");
				var army = armyUnit.getArmy();
				if (!isFirst) {
					string += "\n";
				}
				if (hasMultipleDetachments) {
					string += " [" + detachmentData.getPosition() + "] ";
				}
				string += _guiState.text["army." + army.armyPrefix];
				string += " (" + detachmentData.getText(detachmentData.detachmentType.name);
				if(isFirst) {
					string += ", " + _guiState.text["primaryDetachment"];
				}
				string += ")";

				for(var j in detachmentData.getArmyUnits()) {
					if(j == "a0") {
						continue;
					}
					army = detachmentData.getArmy(j);
					string += "\n__- ";
					string += _guiState.getText("army." + army.armyPrefix);
				}


				isFirst = false;
			}

			return string;
		};

		this.renderSlotHeading = function(slot) {
			var s = "";
			s += "---------- ";
			s += getSlotHeadingText(slot);
			s += " (";

			var isFirst = true;

			var countPerDetachmentData = traverseArmyUnit(this, getChooserCountForArmy, {slotId: slot.slotId});
			var count = {};
			for(var i in countPerDetachmentData) {
				var countPerArmyUnit = countPerDetachmentData[i];
				if(countPerArmyUnit == null) {
					continue;
				}
				for(var j in countPerArmyUnit) {
					if(isUndefined(count[i])) {
						count[i] = 0;
					}
					count[i] += countPerArmyUnit[j];
				}
			}


			for(var i in count) {
				var slotCount = count[i];
				if (slotCount == null) {
					continue;
				}
				if (!isFirst) {
					s += " + ";
				}
				s += slotCount;

				isFirst = false;
			}

			s += ")";
			s += " ----------";
			return s;
		};
		
		this.renderSlotHeadingSingle = function(slot, detachmentDataIndex) {
			var s = "";
			s += "---------- ";
			s += getSlotHeadingText(slot);
			s += " (";

			s += getChooserCountForDetachment(_armyState.getDetachmentData(detachmentDataIndex), slot.slotId);

			s += ")";
			s += " ----------";
			return s;
		};

		this.renderTotalPoints = function() {
			var s = "______________________________________________\n";
			s += _armyState.getTotalPoints() + " " + _guiState.text["points"] + "\n\n";

			return s;
		};

		this.renderStateLink = function() {
			return _armyState.getStateLink();
		};

		this.renderStatistics = function() {
			var statistics = "";
			var myTotalPoints = (_armyState.getTotalPoints() > 0) ? _armyState
					.getTotalPoints() : 1;
			for ( var i in _systemState.slots) {
				var slot = _systemState.slots[i];
				var pointCount = _armyState.pointsPerSlot[slot.slotId];
				if (pointCount == 0) {
					continue;
				}
				statistics += getSlotHeadingText(slot) + ": ";

				statistics += pointCount + " " + _guiState.text["points"];
				var percentText = (pointCount / myTotalPoints * 100).toFixed(1)
						.replace(/[.]/, _guiState.text["decimalpoint"])
						+ "%";
				statistics += " (" + percentText + ")\n";
			}
			return statistics;
		};
	}

	function ShortMiscRendererDecorator(miscRenderer) {
		this.miscRenderer = miscRenderer;

		this.renderArmyLabel = function() {
			return this.miscRenderer.renderArmyLabel();
		};

		this.renderSlotHeading = function(slot) {
			return this.miscRenderer.renderSlotHeading(slot);
		};
		
		this.renderSlotHeadingSingle = function(slot, armyIndex) {
			return this.miscRenderer.renderSlotHeadingSingle(slot, armyIndex);
		};

		this.renderTotalPoints = function() {
			return this.miscRenderer.renderTotalPoints();
		};

		this.renderStateLink = function() {
			return this.miscRenderer.renderStateLink();
		};

		this.renderStatistics = function() {
			return "";
		};
	}

	function BBCodeMiscRendererDecorator(miscRenderer) {
		this.miscRenderer = miscRenderer;

		this.renderArmyLabel = function() {
			var s = "";
			s += "[i]";
//			s = "[size=3]";
			s += this.miscRenderer.renderArmyLabel();
//			s += "[/size]";
			s += "[/i]";
			return s;
		};

		this.renderSlotHeading = function(slot) {
			var s = "";
			s += "[size=3][i]";
			s += this.miscRenderer.renderSlotHeading(slot);
			s += "[/i][/size]";
			return s;
		};
		
		this.renderSlotHeadingSingle = function(slot, detachmentDataIndex) {
			var s = "";
			s += "[size=3][i]";
			s += this.miscRenderer.renderSlotHeadingSingle(slot, detachmentDataIndex);
			s += "[/i][/size]";
			return s;
		};

		this.renderTotalPoints = function() {
			return this.miscRenderer.renderTotalPoints();
		};

		this.renderStateLink = function() {
			return "[url=" + _armyState.getStateLink() + "]"
					+ _guiState.text["statelink"] + "[/url]";
		};

		this.renderStatistics = function() {
			return miscRenderer.renderStatistics();
		};
	}

	function DefaultArmyRenderer() {

		this.renderEntityHeading = function(position, detachmentData, entity) {
			var s = "";

			if (_armyState.getDetachmentCount() > 1) {
				s += "[" + position + "] ";
			}

			if (entity.currentCount > 1) {
				s += entity.currentCount + "x ";
			}
			s += detachmentData.getText(entity.entityName);
			return s;
		};

		this.renderEntityCost = function(entity) {
			return " (" + entity.totalCost + " " + _guiState.text["points"]
					+ ")";
		};

		this.renderOption = function(detachmentData, option, depth, isFirst, isLast) {
			var s = "";
			if (option.currentCount > 1) {
				s += option.currentCount + "x ";
			}
			s += detachmentData.getText(armyUnit.getFromEntityPool(option.entityId).entityName);
			return s;
		};

		this.joinOptions = function(options, depth) {
			return "joinOptions";
		};

		this.joinSingleSuboption = function(optionText, suboptions) {
			return "joinSingleSuboption";
		};

		this.joinSuboptions = function(suboptions, depth) {
			return "joinSuboptions";
		};

		this.linkOptionsAndSuboptions = function(hasOptionsWithoutSuboptions,
				hasOptionsWithSuboptions, depth) {
			return "linkOptionsAndSuboptions";
		};
	}

	function ShortArmyRendererDecorator(armyRenderer) {

		this.armyRenderer = armyRenderer;

		this.renderEntityHeading = function(position, detachmentData, entity) {
			return this.armyRenderer.renderEntityHeading(position, detachmentData,
					entity);
		};

		this.renderEntityCost = function(entity) {
			return this.armyRenderer.renderEntityCost(entity);
		};

		this.renderOption = function(detachmentData, option, depth, isFirst, isLast) {
			var s = "";
			s += this.armyRenderer.renderOption(detachmentData, option, depth,
					isFirst, isLast);
			return s;
		};

		this.joinOptions = function(options, depth) {
			var s = "";
			if (depth == 0) {
				s += "- ";
			}
			s += options.join(", ");
			return s;
		};

		this.joinSingleSuboption = function(optionText, suboptions) {
			var s = "";
			s += optionText + " (";
			s += suboptions;
			s += ")";
			return s;
		};

		this.joinSuboptions = function(suboptions, depth) {
			var s = "";
			if (depth == 0) {
				s += "- ";
				s += suboptions.join("\n- ");
			} else {
				s += suboptions.join(", ");
			}
			return s;
		};

		this.linkOptionsAndSuboptions = function(hasOptionsWithoutSuboptions,
				hasOptionsWithSuboptions, depth) {
			var s = "";
			if (!hasOptionsWithSuboptions || !hasOptionsWithoutSuboptions) {
				return s;
			}
			if (depth == 0) {
				s += "\n";
			} else {
				s += ", ";
			}
			return s;
		};
	}

	function LongArmyRendererDecorator(armyRenderer) {

		this.armyRenderer = armyRenderer;

//		this.lineStarter = '----------------------------------------------';
//		this.lineStarter = '............................................................................................';
		this.lineStarter = '______________________________________________';

		this.renderEntityHeading = function(position, detachmentData, entity) {
			return this.armyRenderer.renderEntityHeading(position, detachmentData,
					entity);
		};

		this.renderEntityCost = function(entity) {
			return this.armyRenderer.renderEntityCost(entity);
		};

		this.renderOption = function(detachmentData, option, depth) {
			return this.armyRenderer.renderOption(detachmentData, option, depth);
		};

		this.joinOptions = function(options, depth) {
			var indent = this.lineStarter.substring(0, depth * 2);
			return indent + "- " + options.join("\n" + indent + "- ");
		};

		this.joinSingleSuboption = function(optionText, suboptions) {
			var s = "";
			s += optionText;
			s += "\n";
			s += suboptions;
			return s;
		};

		this.joinSuboptions = function(suboptions, depth) {
			return this.joinOptions(suboptions, depth);
		};

		this.linkOptionsAndSuboptions = function(hasOptionsWithoutSuboptions,
				hasOptionsWithSuboptions, depth) {
			if (!hasOptionsWithSuboptions || !hasOptionsWithoutSuboptions) {
				return "";
			}
			return "\n";
		};
	}

	function BBCodeArmyRendererDecorator(armyRenderer) {
		this.armyRenderer = armyRenderer;

		this.renderEntity = function(armyIndex, armyUnit, entity, armyRenderer) {
			return armyRenderer.renderEntity();
		};

		this.renderEntityHeading = function(position, armyUnit, entity) {
			var s = "";
			s += "[b]";
			s += this.armyRenderer.renderEntityHeading(position, armyUnit,
					entity);
			s += "[/b]";
			return s;
		};

		this.renderEntityCost = function(entity) {
			return this.armyRenderer.renderEntityCost(entity);
		};

		this.renderOption = function(armyUnit, option, depth) {
			return this.armyRenderer.renderOption(armyUnit, option, depth);
		};

		this.joinOptions = function(options, depth) {
			return this.armyRenderer.joinOptions(options, depth);
		};

		this.joinSingleSuboption = function(optionText, suboptions) {
			return this.armyRenderer
					.joinSingleSuboption(optionText, suboptions);
		};

		this.joinSuboptions = function(suboptions, depth) {
			return this.armyRenderer.joinSuboptions(suboptions, depth);
		};

		this.linkOptionsAndSuboptions = function(hasOptionsWithoutSuboptions,
				hasOptionsWithSuboptions, depth) {
			return this.armyRenderer.linkOptionsAndSuboptions(
					hasOptionsWithoutSuboptions, hasOptionsWithSuboptions,
					depth);
		};
	}

	function SeparateSelectionJoinStrategy() {

		this.joinSelections = function(detachmentData, slots, miscRenderer) {
			var s = "";
			
			for ( var j in detachmentData) {
				var detachment = detachmentData[j];
				for ( var i in slots) {
					var slot = slots[i];
					var sub = "";
					if (!isUndefined(detachment[slot.slotId])) {
						var selections = detachment[slot.slotId];
						for ( var k = 0; k < selections.length; k++) {
							sub += selections[k];
						}
					}
					if (sub != "") {
						s += miscRenderer.renderSlotHeadingSingle(slot, j);
						s += "\n\n";
						s += sub;
					}
				}
			}
			return s;
		};

	}

	function MixedSelectionJoinStrategy() {

		this.joinSelections = function(detachmentData, slots, miscRenderer) {
			var s = "";

			for ( var i in slots) {
				var slot = slots[i];
				var sub = "";
				for ( var j in detachmentData) {
					var detachment = detachmentData[j];
					if (!isUndefined(detachment[slot.slotId])) {
						var selections = detachment[slot.slotId];
						for ( var k = 0; k < selections.length; k++) {
							sub += selections[k];
						}
					}
				}
				if (sub != "") {
					s += miscRenderer.renderSlotHeading(slot);
					s += "\n\n";
					s += sub;
				}
			}
			return s;
		};
	}
}