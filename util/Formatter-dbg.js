/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/m/Label"
], function (Label) {
	"use strict";

	return {

		formatKeyAndDescription: function (sKey, sDescription) {
			if (sKey !== undefined && sKey !== "" && sKey !== null) {
				if (sDescription != undefined) {
					return sKey + " (" + sDescription + ")";
				} else {
					return sKey;
				}
			} else {
				return '';
			}

		},

		/**
		 * Returns a configuration object for the {@link sap.ushell.ui.footerbar.AddBookMarkButton} "appData" property
		 *
		 * @public
		 * @param {string} sTitle the title for the "save as tile" dialog
		 * @returns {object} the configuration object
		 */
		shareAsTile: function (sTitle, sIcon, fnUrl) {
			return {
				title: sTitle,
				icon: sIcon,
				customUrl: fnUrl
			};
		},

		/**
		 * Returns a configuration object for the {@link sap.ushell.ui.footerbar.JamShareButton} "jamData" property
		 *
		 * @public
		 * @param {string} sTitle the title for the "share on SAP Jam" dialog
		 * @returns {object} the configuration object
		 */
		shareJamData: function (sTitle, sText, sUrl) {
			return {
				oDataServiceUrl: sUrl,
				object: {
					id: document.URL,
					display: new Label({
						text: sTitle
					}),
					share: sText
				}
			};
		},

		FormatDeletionMarks: function (sValue) {
			var ResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			if (sValue === 'X') {
				return ResourceBundle.getText("YES");
			} else {
				return ResourceBundle.getText("NO");
			}
		}

	};

});