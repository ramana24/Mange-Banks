/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/routing/History",
	"sap/ui/core/routing/HashChanger"
], function (History, HashChanger) {
	"use strict";

	return {
		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 *
		 * @public
		 * @param {object} oEvent the event object
		 */

		_navigateBack: function (that) {
			var sCurrentHash = HashChanger.getInstance().getHash();
			var sPreviousHash = History.getInstance().getPreviousHash();

			/*if (sPreviousHash && sPreviousHash.indexOf("CreateEntitySet") !== -1) {
				window.history.go(-2);
				that.byId("messagesIndicator").setVisible(false);
			}else */
			if (sPreviousHash !== undefined || sPreviousHash) {
				window.history.go(-1);
				that.byId("messagesIndicator").setVisible(false);
			} else if (sCurrentHash !== "" && sPreviousHash === undefined) {
				//navigate from other fiori app
				window.history.go(-1);
			} else if (sCurrentHash !== "") {
				// The history doesn't contain a previous entry, but the app was called with a not existing deep link
				// call the app in initial state without any parameters
				that.getRouter().navTo("fullScreen", {}, true);
			} else {
				// navigate back to FLP home
				var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				var oComponent = that.getOwnerComponent();
				if (oCrossAppNavigator) {
					if (oCrossAppNavigator.toExternal) {
						oCrossAppNavigator.toExternal({
							target: {
								shellHash: "#"
							}
						}, oComponent);
					}
				}
			}
		}

	};

});