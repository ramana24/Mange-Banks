/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/bankmaster/manage/util/BaseController",
	"fin/cash/bankmaster/manage/util/Creator",
	"fin/cash/bankmaster/manage/util/Updater",
	"fin/cash/bankmaster/manage/util/Deleter",
	"fin/cash/bankmaster/manage/util/Navigator",
	"fin/cash/bankmaster/manage/util/Messager",
	"fin/cash/bankmaster/manage/util/Validator",
	"fin/cash/bankmaster/manage/util/Formatter",
	"fin/cash/bankmaster/manage/util/Layout"
], function (BaseController, Creator, Updater, Deleter, Navigator, Messager, Validator, Formatter, Layout) {
	"use strict";

	return BaseController.extend("fin.cash.bankmaster.manage.controller.Address", {
		formatter: Formatter,

		onInit: function (oEvent) {
			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);

			// Set visibility
			this.byId("_IDEGen_fragment0--nationGroupElement").setVisible(false);

			Validator._initMessagePopover(this);
			this.validatedFields = Validator._initValidatedFields();
			this.byId("messagesIndicator").setVisible(false);
			this.byId("AddressViewObjectPageLayout").setShowFooter(false);
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		},

		onRoutePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "AddressScreen")
				return;

			this.getView().getModel().setDefaultBindingMode("TwoWay");

			//set title
			var sTitle = this.getText("ADVANCED_ADDRESS_SMARTFORM_TITLE");
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "fin.cash.bankmaster.manage.Component");
				}
			);

			this.mode = oEvent.getParameter("arguments").mode.toLowerCase();
			this.addressContextPath = oEvent.getParameter("arguments").addressContextPath;

			this.bankContextPath = oEvent.getParameter("arguments").bankContextPath;
			this.bankContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.bankContextPath);
			this.bankCountry = this.bankContextPath.match(/BankCountry='(\S*)',/)[1];
			this.bankInternalId = this.bankContextPath.match(/BankInternalId='(\S*)'/)[1];

			if (this.mode === "create") {
				/*	this.byId("fin.cash.bankmaster.manage.addressView").setTitle(this.getText("CREATE_ADDRESS_SCREEN_TITLE"));*/

				this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.internationalVersionSmartResponsiveTable").setVisible(false);

				this.byId("fin.cash.bankmaster.manage.editButton").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(true);
				this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(true);

				this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.addressSmartForm").setEditable(true);
				this.byId("AddressViewObjectPageLayout").setShowFooter(true);

				this.addressContext = this.getView().getModel().createEntry("/AddressSet", {});
				// Set auto fill binding attributes in creation mode
				//incase the end user refresh the creation view
				if (this.bankContext.getProperty()) {
					for (var index in this.addressContext.getProperty()) {
						if (index !== "__metadata" && this.bankContext && this.bankContext.getProperty()[index])
							this.addressContext.getProperty()[index] = this.bankContext.getProperty()[index];
					}
				} else {
					this.addressContext.getProperty()["BankCountry"] = this.bankCountry;
					var oBankInternalId = decodeURIComponent(this.bankInternalId);
					this.addressContext.getProperty()["BankInternalId"] = oBankInternalId;
				}

			} else {
				if (this.mode === "edit")
					this._toggleEditAndDisplay(true);
				else
					this._toggleEditAndDisplay(false);

				// Validate International Version Activation
				var that = this;
				this.getView().getModel().read("/F4_MultiKeySet", {
					success: function (oData, oResponse) {
						if (oData.results.length !== 0) {
							that.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.internationalVersionSmartResponsiveTable").setVisible(true);
							that.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.internationalVersionSmartResponsiveTable").setTableBindingPath("/" +
								that.bankContextPath +
								"/BankToAddressSet");
							that.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.internationalVersionSmartResponsiveTable").rebindTable();
						}
					}
				});

				this.getView().getModel().read("/" + this.addressContextPath);
				this.addressContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.addressContextPath);
			}
			// Set Address Context
			this.getView().setBindingContext(this.addressContext);
		},

		_toggleEditAndDisplay: function (bStatus) {
			// toggle screen title
			if (bStatus) {
				this.mode = "edit";
				this.byId("_IDEGen_fragment1--onInternationalVersionTableMode").setMode("MultiSelect");
			} else {
				this.mode = "read";
				this.byId("_IDEGen_fragment1--onInternationalVersionTableMode").setMode();
			}

			this.byId("AddressViewObjectPageLayout").setShowFooter(bStatus);

			this.byId("fin.cash.bankmaster.manage.editButton").setVisible(!bStatus);
			this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(bStatus);
			this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(bStatus);

			this.byId("_IDEGen_fragment1--addInternationalVersionIcon").setEnabled(bStatus);
			this.byId("_IDEGen_fragment1--deleteInternationalVersionIcon").setEnabled(bStatus);

			// toggle edit mode and display mode
			this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.addressSmartForm").setEditable(bStatus);
		},

		// ---------------------------------------------
		// Create and Update Functionality
		// ---------------------------------------------

		onSaveButtonPressed: function (oEvent) {
			this.dataObject = this.getView().getBindingContext().getObject();

			// Set default binding attributes
			for (var index in this.getView().getModel().createEntry("/AddressSet").getProperty()) {
				if (index !== "__metadata" && !this.dataObject[index] && this.bankContext.getProperty() && this.bankContext.getProperty()[index]) {
					this.dataObject[index] = this.bankContext.getProperty()[index];
				} else if (index === "BankCountry" && !this.dataObject[index]) {
					this.dataObject[index] = this.bankCountry;
				} else if (index === "BankInternalId" && !this.dataObject[index]) {
					this.dataObject[index] = decodeURIComponent(this.bankInternalId);
				}

			}

			this.saveSuccess = false;
			this.validatedMessages = [];
			var that = this;
			if (this.mode === "create") {
				// Non-empty validation
				var nonEmpty = true;
				nonEmpty = Validator._setNonEmptyValidation(this, "_IDEGen_fragment0--addressCountryField", this.getText(
						"NON_EMPTY_VALIDATION_BANK_COUNTRY_TITLE")) &&
					nonEmpty;
				nonEmpty = Validator._setLimitLength(this, "_IDEGen_fragment0--MobileNumber", this.getText("PHONE_NUMBER_VALIDATION_ERROR"), 30) &&
					nonEmpty;
				if (this.byId("_IDEGen_fragment0--MobileNumber").getValueState() === "Error") {
					nonEmpty = false;
				}
				if (nonEmpty === false)
					return;

				this.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setText(this.getText("SAVING_BUTTON"));

				$.when(Creator._createData(this, "/AddressSet", this.getText("CREATE_ADVANCED_ADDRESS_SUCCESS_TEXT"), this.getText(
					"CREATE_ADVANCED_ADDRESS_ERROR_TEXT"))).then(function (res) {
					if (res) {
						that.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(true);
						that.byId("fin.cash.bankmaster.manage.saveButton").setText(that.getText("SAVE_BUTTON"));

						if (that.saveSuccess === true) {
							that.getView().getModel().read("/" + that.bankContextPath, {
								success: function (oData, oResponse) {
									if (that.saveSuccess === true) {
										that.getRouter().navTo("AddressScreen", {
											bankContextPath: that.bankContextPath,
											addressContextPath: "AddressSet(AddressId='" + that.bankContext.getProperty("AddressId") + "',Nation='')",
											mode: "read"
										}, true);
									}
								},
								error: function (oData, oResponse) {}
							});
						}
					}
				});

			} else {

				if (this.byId("_IDEGen_fragment0--MobileNumber").getValueState() === "Error") {
					nonEmpty = false;
				}
				if (nonEmpty === false)
					return;
				Updater._updateData(this, this.getText("UPDATE_ADVANCED_ADDRESS_SUCCESS_TEXT"), this.getText("UPDATE_ADVANCED_ADDRESS_ERROR_TEXT"))
					.then(function (res) {
						if (res) {
							if (that.saveSuccess === true) {
								that._toggleEditAndDisplay(false);
							} else {
								that._toggleEditAndDisplay(true);
							}
						}

					});

				// Refresh International Version table after Address updating data
				this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.internationalVersionSmartResponsiveTable").rebindTable();
			}
		},

		// ---------------------------------------------
		// Messages Indicator Button Press Event
		// ---------------------------------------------

		onMessagePopoverPressed: function () {
			this.byId("messagesIndicator").setVisible(true);
			this.byId("messagesIndicator").setText(this.validatedMessages.length);
			this.messagePopover.openBy(this.byId("messagesIndicator"));
		},

		// ---------------------------------------------
		// Cancel Button Press Event
		// ---------------------------------------------

		onCancelButtonPressed: function () {
			Messager._pressCancelButton(this);
		},

		// ---------------------------------------------
		// Edit Button Press Event
		// ---------------------------------------------

		onEditButtonPressed: function (oEvent) {
			// Edit Bank and Display Address Switch
			this._toggleEditAndDisplay(true);
		},

		onBeforeRebindInternationVersionTable: function (oEvent) {
			var bindingParams = oEvent.getParameter("bindingParams");
			if (!bindingParams.filters) {
				bindingParams.filters = [];
			}
			// Filter Nation null
			var filterNation = new sap.ui.model.Filter("Nation", sap.ui.model.FilterOperator.NE, "");
			bindingParams.filters.push(filterNation);

			// Add international version table loading fields
			var object = this.getView().getModel().createEntry("/AddressSet", {}).getProperty();

			for (var i in object) {
				if (i !== "__metadata")
					bindingParams.parameters.select += "," + i;
			}
			bindingParams.parameters["countMode"] = "Inline";

			//add filter for UI Version 1.35 setTableBindingPath
			this._filterTable(oEvent);
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

		// ---------------------------------------------
		// International Version Table
		// ---------------------------------------------

		onAddInternationalVersionPressed: function (oEvent) {
			// Navigate to International Version create mode
			this.getRouter().navTo("InternationalVersionScreen", {
				mode: "create",
				bankContextPath: this.bankContextPath,
				addressContextPath: this.addressContextPath,
				internationalVersionContextPath: "CreateEntitySet"
			}, false);
		},

		onInternationVersionListItemPressed: function (oEvent) {
			// Navigate to International Version display or edit mode
			this.getRouter().navTo("InternationalVersionScreen", {
				mode: this.mode,
				bankContextPath: this.bankContextPath,
				addressContextPath: this.addressContextPath,
				internationalVersionContextPath: oEvent.getSource().getBindingContext().getPath().substr(1)
			}, false);
		},

		onDeleteInternationalVersionIconPressed: function (oEvent) {
			var selectedItems = this.byId("_IDEGen_fragment1--fin.cash.bankmaster.manage.internationalVersionSmartResponsiveTable").getTable().getSelectedItems();

			var sDeleteSuccessText = this.getText("DELETE_INTERNATIONAL_VERSION_SUCCESS_TEXT");
			var sDeleteErrorText = this.getText("DELETE_INTERNATIONAL_VERSION_ERROR_TEXT");

			var that = this;
			if (selectedItems.length === 0) {
				sap.m.MessageBox.warning(this.getText("DELETE_UNSELECTED_INTERNATIONAL_VERSION"));
			} else {
				sap.m.MessageBox.confirm(this.getText("DELETE_SELECTED_INTERNATIONAL_VERSION_TEXT"), {
					actions: [sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === "DELETE") {
							for (var i in selectedItems) {
								Deleter._deleteData(that, selectedItems[i].getBindingContextPath(), sDeleteSuccessText, sDeleteErrorText);
							}
						}
					}
				});
			}
		},

		onMobileNumberChanged: function (oEvent) {
			var oNewValue = oEvent.getParameters().newValue;
			if (oNewValue) {
				var rgx = /^\d+$/;
				if (!rgx.test(oNewValue)) {
					var oMessage = this.getText("PHONE_NUMBER_VALIDATION_ERROR");
					this.byId("_IDEGen_fragment0--MobileNumber").setValueState("Error");
					this.byId("_IDEGen_fragment0--MonileNumber").setValueStateText(oMessage);
				}
			} else {
				this.byId("_IDEGen_fragment0--MobileNumber").setValueState("None");
			}

		},

		// ---------------------------------------------
		// Show All or Show Fewer Press Events
		// ---------------------------------------------

		onToggleElements: function () {
			// Toggle fields
			Layout._toggleElements(this);
		}

	});
});