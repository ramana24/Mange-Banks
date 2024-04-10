/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/bankmaster/manage/util/Navigator"
], function (Navigator) {
	"use strict";

	return {

		_pressBackButton: function (that) {
			if (that.mode === "read") {
				that.pressMode = " ";
				Navigator._navigateBack(that);
			} else {
				sap.m.MessageBox.confirm(that.getText("SAVE_DATA_TEXT"), {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function (oAction) {
						if (oAction === "YES") {

							that.onSaveButtonPressed();
							window.setTimeout(function () {
								if (that.saveSuccess === true) {
									Navigator._navigateBack(that);
								}
							}, 3000);
						} else {
							that.getView().getModel().resetChanges();
							Navigator._navigateBack(that);
						}
					}
				});
			}
		},

		_pressCancelButton: function (that) {
			if (that.mode === "create" || (that.getView().getModel("viewMode") && that.getView().getModel("viewMode").getData().mode === "create")) {
				sap.m.MessageBox.confirm(that.getText("CANCEL_CREATE_OBJECT"), {
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function (oAction) {
						if (oAction === "YES") {
							Navigator._navigateBack(that);
						}
					}
				});
			} else {
				sap.m.MessageBox.confirm(that.getText("DISCARD_CHANGES"), {
					actions: [that.getText("DISCARD_BUTTON"), sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction !== "CANCEL") {
							if (that.getView().getModel("viewMode")) {
								that.getView().getModel("viewMode").setProperty("/mode", "read");
							}
							that.getView().getModel().resetChanges();
							if (that._resetFieldState) {
								that._resetFieldState();
							}
							that._toggleEditAndDisplay(false);
							that.byId("messagesIndicator").setVisible(false);
						}
					}
				});
			}
		}

	};

});