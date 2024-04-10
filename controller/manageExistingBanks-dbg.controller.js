/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/bankmaster/manage/util/BaseController",
	"fin/cash/bankmaster/manage/util/Navigator",
	"fin/cash/bankmaster/manage/util/Formatter"
], function (BaseController, Navigator, Formatter) {
	"use strict";

	return BaseController.extend("fin.cash.bankmaster.manage.controller.manageExistingBanks", {

		formatter: Formatter,
		onInit: function (oEvent) {
			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
		},

		onRoutePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "selectExistingBanksScreen") {
				return;
			}

			//set title
			var sTitle = this.getText("SELECT_EXISTING_BANKS_SCREEN_TITLE");
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "fin.cash.bankmaster.manage.Component");
				}
			);
			//var bindingParams = oEvent.getParameter("bindingParams");

			this.bpNumber = oEvent.getParameter("arguments").bpNumber;
			this.bankCountry = oEvent.getParameter("arguments").bankCountry;
			this.bankInternalId = oEvent.getParameter("arguments").bankInternalId;

			this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.bankSmartResponsiveTable").setTableBindingPath("/BankSet");
			this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.bankSmartResponsiveTable").rebindTable();

			var model = this.getView().getModel();
			model.setDefaultBindingMode("TwoWay");
		},

		onSearchButtonPressed: function (oEvent) {
			var sSearchQuery = oEvent.getSource().getValue();
			var object = this.bankSelect.split(",");
			var aFilters = [];

			/*for (var i in object)
				aFilters.push(new sap.ui.model.Filter(object[i], sap.ui.model.FilterOperator.Contains, sSearchQuery));
				
    		this.byId("fin.cash.bankmaster.manage.bankSmartResponsiveTable").getTable().getBinding("items").filter([new sap.ui.model.Filter(aFilters, false)]);*/

			var oBankSmartTable = this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.bankSmartResponsiveTable");
			if (sSearchQuery != null && sSearchQuery.length > 0) {
				var aFilters = [];
				for (var i in object) {
					aFilters.push(new sap.ui.model.Filter(object[i], sap.ui.model.FilterOperator.Contains, sSearchQuery));
				}
				oBankSmartTable.getTable().getBinding("items").filter([new sap.ui.model.Filter(aFilters, false)]);
			} else {
				oBankSmartTable.getTable().getBinding("items").filter();
			}
		},

		onBeforeRebindExistingBanksTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			var bankObject = this.getView().getModel().createEntry("/BankSet", {}).getProperty();
			this.bankSelect = bindingParams.parameters.select;

			var oSelectParameters = "";

			for (var i in bankObject) {
				if (i !== "__metadata") {
					if (oSelectParameters) {
						oSelectParameters += "," + i;
					} else {
						oSelectParameters = i;
					}
				}
			}

			if (oSelectParameters) {
				bindingParams.parameters.select = oSelectParameters;
			}

			if (!bindingParams.filters) {
				bindingParams.filters = [];
			}

			bindingParams.filters.push(new sap.ui.model.Filter("BpNumber", sap.ui.model.FilterOperator.NE, this.bpNumber));
			bindingParams.parameters["countMode"] = "Inline";

		},

		onCancelButtonPressed: function (oEvent) {
			Navigator._navigateBack(this);
		},

		onSaveButtonPressed: function (oEvent) {
			var sContextPaths = this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.bankSmartResponsiveTable").getTable().getSelectedContextPaths();
			var sContexts = this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.bankSmartResponsiveTable").getTable().getSelectedContexts();

			for (var i in sContextPaths) {
				this.relatedBranches = false;

				var model = this.getView().getModel();
				model.setDefaultBindingMode("TwoWay");
				var brancheContext = model.createEntry("/RelatedBranchesSet", {});
				this.getView().setBindingContext(brancheContext);

				var dataObject = this.getView().getBindingContext().getObject();
				dataObject.RelatedBankCountry = sContexts[i].getProperty().BankCountry;
				dataObject.RelatedBankInternalId = sContexts[i].getProperty().BankInternalId;
				dataObject.BankCountry = this.bankCountry;
				var oBankInternalId = decodeURIComponent(this.bankInternalId);
				dataObject.BankInternalId = oBankInternalId;
				dataObject.BpNumber = this.bpNumber;

				var that = this;
				that.getView().getModel().create(
					"/RelatedBranchesSet",
					jQuery.extend(false, {}, dataObject), {
						success: function (oData, oResponse) {
							sap.m.MessageToast.show(that.getText("CREATE_RELATED_BRANCHES_SUCCESS_TEXT"));
						},
						error: function (oData, oResponse) {
							sap.m.MessageToast.show(that.getText("CREATE_RELATED_BRANCHES_ERROR_TEXT"));
						}
					}
				);

			}
			window.setTimeout(function () {
				Navigator._navigateBack(this);
			}, 5000);

		},

	});
});