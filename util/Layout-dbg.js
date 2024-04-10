/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function () {
	"use strict";

	return {

		_toggleElements: function (that) {
			if (that.byId("_IDEGen_fragment0--toggleElementsLink").getText() === that.getText("SHOW_ALL_FIELDS")) {
				that.byId("_IDEGen_fragment0--toggleElementsLink").setText(that.getText("SHOW_FEWER_FIELDS"));
				that.byId("_IDEGen_fragment0--toggleElementsLink").setTooltip(that.getText("SHOW_FEWER_FIELDS_TOOLTIP"));
				var bStatus = true;
			} else {
				that.byId("_IDEGen_fragment0--toggleElementsLink").setText(that.getText("SHOW_ALL_FIELDS"));
				that.byId("_IDEGen_fragment0--toggleElementsLink").setTooltip(that.getText("SHOW_ALL_FIELDS_TOOLTIP"));
				var bStatus = false;
			}

			for (var i = 1; i <= 17; i++) {
				that.byId("_IDEGen_fragment0--element_" + i.toString()).setVisible(bStatus);
			}
		}

	};

});