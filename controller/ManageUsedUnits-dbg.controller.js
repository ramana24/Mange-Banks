/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/bankmaster/manage/util/BaseController",
	"fin/cash/bankmaster/manage/util/Navigator",
	"fin/cash/bankmaster/manage/util/Formatter"
], function (BaseController, Navigator, Formatter) {
	"use strict";

	return BaseController.extend("fin.cash.bankmaster.manage.controller.ManageUsedUnits", {
		formatter: Formatter,

		onInit: function (oEvent) {
			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
			this.oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");

		},

		onRoutePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "ManageUsedUnitsScreen")
				return;

			this.bankContextPath = oEvent.getParameter("arguments").bankContextPath;

			//set title
			var sTitle = this.getText("MANAGE_USED_UNITS_SCREEN_TITLE");
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "fin.cash.bankmaster.manage.Component");
				}
			);

			this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.usedUnitSmartResponsiveTable").setTableBindingPath("/" + this.bankContextPath +
				"/BankToUsedBpSet");
			this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.usedCompanySmartResponsiveTable").setTableBindingPath("/" + this.bankContextPath +
				"/BankToUsedCompanySet");

			this.bankCountry = this.bankContextPath.match(/BankCountry='(\S*)',/)[1];
			this.bankInternalId = this.bankContextPath.match(/BankInternalId='(\S*)'/)[1];

			if (this.usedUnitIsInitialized) {
				this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.usedUnitSmartResponsiveTable").rebindTable();
			}
			if (this.usedUnitIsInitialized) {
				this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.usedCompanySmartResponsiveTable").rebindTable();
			}

		},

		onUsedUnitSmartTableInitialized: function () {
			this.usedUnitIsInitialized = true;
			this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.usedUnitSmartResponsiveTable").rebindTable();
		},
		onUsedCompanySmartTableInitialized: function () {
			this.usedUnitIsInitialized = true;
			this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.usedCompanySmartResponsiveTable").rebindTable();
		},

		onBeforeRebindUsedBusinessPartnerTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			var object = this.getView().getModel().createEntry("/UsedBpSet").getProperty();

			for (var i in object) {
				if (i !== "__metadata") {
					if (bindingParams.parameters.select) {
						bindingParams.parameters.select += "," + i;
					} else {
						bindingParams.parameters.select = i;
					}
				}
			}
			bindingParams.parameters["countMode"] = "Inline";

			//add filter for UI Version 1.35 setTableBindingPath
			this._filterTable(oEvent);
		},

		onBeforeRebindUsedCompanyTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			var object = this.getView().getModel().createEntry("/UsedCompanySet").getProperty();

			for (var i in object) {
				if (i !== "__metadata") {
					if (bindingParams.parameters.select) {
						bindingParams.parameters.select += "," + i;
					} else {
						bindingParams.parameters.select = i;
					}
				}

			}
			bindingParams.parameters["countMode"] = "Inline";
			//add filter for UI Version 1.35 setTableBindingPath
			this._filterTable(oEvent);
		},

		onUsedBusinessPartnerListItemPressed: function (oEvent) {

			var bpNumber = oEvent.getSource().getBindingContext().getObject().BpNumber;

			if (bpNumber) {
				if (this.oCrossAppNavigator) {
					this.oCrossAppNavigator.toExternal({
						target: {
							semanticObject: "BusinessPartner",
							action: "manage"
						},
						params: {
							"BusinessPartnerForEdit": bpNumber
						}
					});
				}
			}

		},

		_filterTable: function (oEvent) {
			if (this.bankCountry && this.bankInternalId) {
				var oFilterBankCountry = new sap.ui.model.Filter("BankCountry", "EQ", this.bankCountry);
				var oBankInternalId = decodeURIComponent(this.bankInternalId);
				var oFilterBankInternalId = new sap.ui.model.Filter("BankInternalId", "EQ", oBankInternalId);
				var filters = [oFilterBankCountry, oFilterBankInternalId];
				oEvent.getParameter("bindingParams").filters.push(new sap.ui.model.Filter(filters, true));
			}
		},

	});
});