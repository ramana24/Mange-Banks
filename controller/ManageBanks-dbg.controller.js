/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/bankmaster/manage/util/BaseController",
	"fin/cash/bankmaster/manage/util/Formatter",
	"fin/cash/bankmaster/manage/util/Navigator",
	"sap/ui/generic/app/navigation/service/SelectionVariant",
	"sap/ui/generic/app/navigation/service/NavigationHandler",
	"sap/ui/comp/state/UIState"
], function (BaseController, Formatter, Navigator, SelectionVariant, NavigationHandler, UIState) {
	"use strict";

	return BaseController.extend("fin.cash.bankmaster.manage.controller.ManageBanks", {
		formatter: Formatter,

		onInit: function () {
			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			this.externalNavigation = false;
			this.bankInternalId = null;

			// Secure navigation
			this.version = this.getOwnerComponent()._version;

			// Set basic version
			if (this.version && this.version === "basic") {
				this.byId("fin.cash.bankmaster.manage.bpNumberColumn").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.accountCountColumn").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.houseBankCountColumn").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.hasHouseBanksFilter.FilterBar").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.hasBankAccountsFilter.FilterBar").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.isMarkedAsDeletedFilter.FilterBar").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.myBankColumn").setVisible(false);

				// Ignored fields in basic version
				var oData = ["HasBankAccounts", "HasHouseBanks", "BpNumber", "BpGroup", "Rating", "RatingText", "AccountCount", "HouseBankCount"];
				this.byId("fin.cash.bankmaster.manage.bankSmartTable").setIgnoredFields(oData);
			}

			var oDataFull = ["AddressId", "MyBank", "GeneratedId", "DeletionMark"];
			this.byId("fin.cash.bankmaster.manage.bankSmartTable").setIgnoredFields(oDataFull);

			var oPageModel = new sap.ui.model.json.JSONModel({
				headerExpanded: true
			});

			this.getView().setModel(oPageModel, "page");

			if (sap.ui.Device.system.desktop) {
				this.getView().addStyleClass("sapUiSizeCompact");
				this.byId("fin.cash.bankmaster.manage.bankSmartTable").addStyleClass("sapUiSizeCondensed");
			} else {
				this.getView().addStyleClass("sapUiSizeCozy");
				this.byId("fin.cash.bankmaster.manage.bankSmartTable").addStyleClass("sapUiSizeCozy");
			}

			this.oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
			this.oNavigationHandler = new NavigationHandler(this);
			this.bOnInitFinished = true;
			this.oSmartFilterBar = this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar");
			this.oSmartTable = this.byId("fin.cash.bankmaster.manage.bankSmartTable");
			var that = this;
			if (this.oCrossAppNavigator) {
				var bNavigateToAcctSupported = this.oCrossAppNavigator.isNavigationSupported([{
					target: {
						semanticObject: "BankAccount",
						action: "maintainHierarchy"
					}
				}]).done(function (aResponse) {
					if (aResponse[0].supported === false) {

						that.byId("fin.cash.bankmaster.manage.managebankhierarchy").setVisible(false);
					} else {

						that.byId("fin.cash.bankmaster.manage.managebankhierarchy").setVisible(true);

					}

				});
			}
		},

		onManageBankHierarchyPressed: function (oEvent) {

			this.oCrossAppNavigator.toExternal({
				target: {
					semanticObject: "BankAccount",
					action: "maintainHierarchy"
				}
			});

		},

		onBeforeRendering: function () {

			var sCozyClass = "sapUiSizeCozy",
				sCompactClass = 'sapUiSizeCompact',
				sCondensedClass = 'sapUiSizeCondensed';
			if (jQuery(document.body).hasClass(sCompactClass) || this.getOwnerComponent().getContentDensityClass() === sCompactClass) {
				this.byId("fin.cash.bankmaster.manage.bankSmartTable").addStyleClass(sCondensedClass);
			} else if (jQuery(document.body).hasClass(sCozyClass) || this.getOwnerComponent().getContentDensityClass() === sCozyClass) {
				this.byId("fin.cash.bankmaster.manage.bankSmartTable").addStyleClass(sCozyClass);
			}
		},

		onSmartFilterInitialise: function (oEvent) {
			this.bOnInitSmartFilterBarFinished = true;
			this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar").getControlByKey("MyBank").setSelectedKey(" ");
			this.initAppState();
		},

		initAppState: function () {
			if (!this.bOnInitFinished || !this.bOnInitSmartFilterBarFinished) {
				return;
			}
			var oParseNavigation = this.oNavigationHandler.parseNavigation();
			var oSmartFilterBar = this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar");
			var that = this;
			var oBankInternalId = null;
			oParseNavigation.done(function (oAppData, oURLParameters, sNavType) {

				if (sNavType !== sap.ui.generic.app.navigation.service.NavType.initial) {
					var bHasOnlyDefaults = oAppData && oAppData.bNavSelVarHasDefaultsOnly;
					var oSelectionVariant = new SelectionVariant(oAppData.selectionVariant);
					var aSelectionVariantProperties = oSelectionVariant.getParameterNames().concat(oSelectionVariant.getSelectOptionsPropertyNames());
					var mUIStateProperties = {
						replace: true,
						strictMode: false
					};

					var aSelectionVariant = oAppData.selectionVariant;
					if (aSelectionVariant && (aSelectionVariant.indexOf("\"Bank\"") !== -1 || aSelectionVariant.indexOf("\"BankInternalID\"") !== -
							1)) {
						if (aSelectionVariant.indexOf("\"Bank\"") !== -1) {
							aSelectionVariant = aSelectionVariant.replace(/"Bank"/, "\"BankInternalId\"");
						} else {
							aSelectionVariant = aSelectionVariant.replace(/"BankInternalID"/, "\"BankInternalId\"");
						}
					}
					var oUiState = new UIState({
						selectionVariant: JSON.parse(aSelectionVariant),
						valueTexts: oAppData.valueTexts
					});
					for (var i = 0; i < aSelectionVariantProperties.length; i++) {
						that.oSmartFilterBar.addFieldToAdvancedArea(aSelectionVariantProperties[i]);
					}
					if (!bHasOnlyDefaults || that.oSmartFilterBar.getCurrentVariantId() === "") {
						that.oSmartFilterBar.clearVariantSelection();
						that.oSmartFilterBar.clear();
						that.oSmartFilterBar.setUiState(oUiState, mUIStateProperties);
					}
					if (oAppData.tableVariantId) {
						that.oSmartTable.setCurrentVariantId(oAppData.tableVariantId);
					}

					that.restoreCustomAppStateData(oAppData.customData);
					if (!bHasOnlyDefaults) {
						that.oSmartFilterBar.search();
					}
				}

			});
		},

		storeCurrentAppState: function () {
			var oAppStatePromise = this.oNavigationHandler.storeInnerAppState(this.getCurrentAppState());
			oAppStatePromise.done(function (sAppStateKey) {
				//your inner app state is saved now; sAppStateKey was added to URL
				//perform actions that must run after save
			}.bind(this));
			oAppStatePromise.fail(function (oError) {
				this._handleError(oError);
			}.bind(this));
			return oAppStatePromise;
		},

		getCurrentAppState: function () {
			var oSmartFilterBar = this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar");
			var oSelectionVariant = new SelectionVariant(JSON.stringify(oSmartFilterBar.getUiState().getSelectionVariant()));
			return {
				selectionVariant: oSelectionVariant.toJSONString(),
				tableVariantId: this.oSmartTable.getCurrentVariantId(),
				customData: this.getCustomAppStateData(),
				valueTexts: oSmartFilterBar.getUiState().getValueTexts()
			};
		},

		getCustomAppStateData: function () {

			return {
				"myBank": this.byId("MyBankComboBox").getSelectedKey()

			};

		},

		_handleError: function (oError) {

		},

		restoreCustomAppStateData: function (oCustomData) {
			if (oCustomData.myBank) {
				this.byId("MyBankComboBox").setSelectedKey(oCustomData.myBank);
			}

		},

		onAfterApplyTableVariant: function (oEvent) {
			// write inner app state
			this.storeCurrentAppState();
		},

		setVisibleFilters: function (aParameters) {
			var sAllFilterItems = this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar").getAllFilterItems();
			var sPassedParameters = JSON.parse(aParameters);
			var sPassedFilters = sPassedParameters.SelectOptions;
			for (var i = 0; i < sPassedFilters.length; i++) {
				for (var j = 0; j < sAllFilterItems.length; j++) {
					var sFilterName = sAllFilterItems[j].getName();
					if (sPassedFilters[i].PropertyName === sFilterName) {
						sAllFilterItems[j].setVisibleInFilterBar(true);
					}
				}
			}
		},

		onAssignedFiltersChanged: function (oEvent) {
			this.byId("FilterText").setText(this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar").retrieveFiltersWithValuesAsText());
		},

		onToggleHeaderPressed: function (oEvent) {
			var oPageModel = this.getView().getModel("page");
			oPageModel.setProperty("/headerExpanded", (oPageModel.getProperty("/headerExpanded") === true) ? false : true);
		},

		formatToggleButtonText: function (bValue) {
			return bValue ? this.getResourceBundle().getText("HIDE_FILTERS") : this.getResourceBundle().getText("SHOW_FILTERS");
		},

		onRoutePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "fullScreen") {
				return;
			}
			if (this.refresh.bankTable) {
				this.byId("fin.cash.bankmaster.manage.bankSmartTable").rebindTable();
				this.refresh.bankTable = false;
			}
		},

		onBeforeVariantSave: function (oEvent) {
			this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar").setFilterData({
				_CUSTOM: {
					CustomBankType: this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar").getControlByKey("MyBank").getSelectedKey()
				}
			});
		},

		onAfterVariantLoad: function (oEvent) {
			var oCutomFieldData = this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar").getFilterData();
			var oCustomData = oCutomFieldData._CUSTOM;
			if (oCustomData) {
				this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar").getControlByKey("MyBank").setSelectedKey(oCustomData.CustomBankType);
			} else {
				this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar").getControlByKey("MyBank").setSelectedKey(" ");
			}

		},

		onBeforeRebindBankTable: function (oEvent) {

			var oBindingParams = oEvent.getParameter("bindingParams");

			// Set full version
			if (!this.version || this.version !== "basic") {

				//Group sort
				var bindingParams = oEvent.getParameter("bindingParams");
				bindingParams.sorter.push(new sap.ui.model.Sorter("MyBank", true, false));

				if (this.bankInternalId !== null) {
					var oStatusFilter = new sap.ui.model.Filter("BankInternalId", "EQ", this.bankInternalId);
					oBindingParams.filters.push(oStatusFilter);
				}

				//add Bank Type Filter
				var oSmartFilterBar = this.byId("fin.cash.bankmaster.manage.bankSmartFilterBar");
				var oSelectedKey = oSmartFilterBar.getControlByKey("MyBank").getSelectedKey();
				if (oSelectedKey != " ") {
					var oBankTypeFilter = new sap.ui.model.Filter("MyBank", "EQ", oSelectedKey);
					oBindingParams.filters.push(oBankTypeFilter);
				}

				//ensure mybank is in selected list?
				if (oBindingParams.parameters.select.indexOf("MyBank") === -1) {
					oBindingParams.parameters.select += ",MyBank";
				}
			}
			if (this.byId("bankTableSearchField").getValue()) {
				var aSearchFilters = this.buildSearchQueryWithSearchField(this.byId("bankTableSearchField").getValue());
				oBindingParams.filters.push(aSearchFilters);
			}

			oBindingParams.parameters["countMode"] = "Inline";
		},

		onBankDataReceived: function (oEvent) {

			// When the language is "HE", set align to left
			var oSmartTable = oEvent.getSource();
			var columns = oSmartTable.getTable().getColumns();
			var oCore = sap.ui.getCore();
			var oConfig = oCore.getConfiguration();
			var sLang = oConfig.getLanguage();

			if (sLang == "HE") {
				for (var i = 0; i < columns.length; i++) {
					var c = columns[i].getCustomData()[0].getValue().columnKey;
					if (c == "UsedUnitCount" || c == "AccountCount" || c == "HouseBankCount") {
						columns[i].setHAlign("Left");
					}
				}
			}
		},

		// ---------------------------------------------
		// Navigation
		// ---------------------------------------------

		onCreateButtonPressed: function () {
			// Navigate to create bank view
			this.getRouter().navTo("BankScreen", {
				bankContextPath: "CreateEntitySet",
				mode: "create",
				bankInternalId: "undefined"
			}, false);
		},

		onNavigateToDetailPressed: function (oEvent) {
			// Get the selected row path
			var bankContextPath = oEvent.getSource().getBindingContext().getPath().substr(1);

			var bankCountry = this.getView().getModel().oData[bankContextPath].BankCountry;
			var bankInternalId = this.getView().getModel().oData[bankContextPath].BankInternalId;

			if (!bankCountry || !bankInternalId)
				return;

			// Navigate to display bank view
			this.getRouter().navTo("BankScreen", {
				bankContextPath: "BankSet(BankCountry='" + bankCountry + "',BankInternalId='" + encodeURIComponent(bankInternalId) + "')",
				mode: "read",
				bankInternalId: encodeURIComponent(bankInternalId)
			}, false);
		},

		onNavTargetsObtained: function (oEvent) {
			var aParameters = oEvent.getParameters();
			var aActions = aParameters.actions;
			var aMyActions = [];
			for (var i = 0; i < aActions.length; i++) {
				if (aActions[i].getKey() === "BankAccount-manageMasterData") {

					var bankContextPath = oEvent.getSource().getBindingContext().getPath().substr(1);
					var bankCountry = this.getView().getModel().oData[bankContextPath].BankCountry;
					var bankInternalId = this.getView().getModel().oData[bankContextPath].BankInternalId;
					if (bankCountry && bankInternalId) {
						if (this.oCrossAppNavigator) {
							var sHref = this.oCrossAppNavigator.hrefForExternal({
								target: {
									semanticObject: "BankAccount",
									action: "manageMasterData"
								},
								params: {
									BankCountry: [bankCountry],
									Bank: [bankInternalId],
									BankAccountStatus: ["02", "09", "10"]
								}
							});
						}
					}
					aActions[i].setHref(sHref);
					aMyActions.push(aActions[i]);

				}
			}

			aParameters.show(null, aMyActions);
		},

		buildSearchQueryWithSearchField: function (oSearchQuery) {

			var aColumns = ["BankInternalId", "BankCountry", "BankNumber", "BankName", "BankBranch", "CountryName", "BankCity", "RegionName",
				"BankStreet", "Swift"
			];
			var aFilters = [];
			var rFilters = null;

			var oBankSmartTable = this.byId("fin.cash.bankmaster.manage.bankSmartTable");
			if (oSearchQuery != null && oSearchQuery.length > 0) {
				var aFilters = [];
				for (var i in aColumns) {
					aFilters.push(new sap.ui.model.Filter(aColumns[i], sap.ui.model.FilterOperator.Contains, oSearchQuery));
				}
				rFilters = new sap.ui.model.Filter(aFilters, false);
			}
			return rFilters;
		},

		onSearchButtonPressed: function (oEvent) {

			this.byId("fin.cash.bankmaster.manage.bankSmartTable").rebindTable();
			this.storeCurrentAppState();

		}

	});
});