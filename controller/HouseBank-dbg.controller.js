/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/bankmaster/manage/util/BaseController",
	"fin/cash/bankmaster/manage/util/Creator",
	"fin/cash/bankmaster/manage/util/Updater",
	"fin/cash/bankmaster/manage/util/Navigator",
	"fin/cash/bankmaster/manage/util/Messager",
	"fin/cash/bankmaster/manage/util/Validator",
	"fin/cash/bankmaster/manage/util/Formatter"
], function (BaseController, Creator, Updater, Navigator, Messager, Validator, Formatter) {
	"use strict";

	return BaseController.extend("fin.cash.bankmaster.manage.controller.HouseBank", {
		formatter: Formatter,
		onInit: function (oEvent) {
			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
			Validator._initMessagePopover(this);
			this.validatedFields = Validator._initValidatedFields();
			this.byId("messagesIndicator").setVisible(false);
			this.byId("HouseBankViewObjectPageLayout").setShowFooter(false);
		},

		onRoutePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "HouseBankScreen")
				return;

			this.getView().getModel().setDefaultBindingMode("TwoWay");
			//set title
			var sTitle = this.getText("HOURSE_BANK_OBJECT_HEADER_TITLE");
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "fin.cash.bankmaster.manage.Component");
				}
			);

			this.mode = oEvent.getParameter("arguments").mode.toLowerCase();
			this.houseBankContextPath = oEvent.getParameter("arguments").houseBankContextPath;

			this.bankContextPath = oEvent.getParameter("arguments").bankContextPath;
			this.bankContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.bankContextPath);

			// Set Bank Group's Context in House Bank View
			this.byId("fin.cash.bankmaster.manage.houseBankSmartForm.bankGroup").getModel().read("/" + this.bankContextPath);
			this.byId("fin.cash.bankmaster.manage.houseBankSmartForm.bankGroup").setBindingContext(this.bankContext);

			// Set Address Group's Context in House Bank View
			this.byId("fin.cash.bankmaster.manage.houseBankSmartForm.addressGroup").getModel().read("/" + this.bankContextPath);
			this.byId("fin.cash.bankmaster.manage.houseBankSmartForm.addressGroup").setBindingContext(this.bankContext);

			if (this.mode === "create") {

				this.byId("fin.cash.bankmaster.manage.editButton").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(true);
				this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(true);

				this.byId("companyCodeField").setEnabled(true);
				this.byId("houseBankKeyField").setEnabled(true);
				this.byId("fin.cash.bankmaster.manage.houseBankSmartForm").setEditable(true);

				this.houseBankContext = this.getView().getModel().createEntry("/HouseBankSet");
				// Set auto fill binding attributes in creation mode
				if (this.bankContext.getProperty()) {
					for (var index in this.houseBankContext.getProperty()) {
						if (index !== "__metadata" && this.bankContext.getProperty()[index])
							this.houseBankContext.getProperty()[index] = this.bankContext.getProperty()[index];
					}
				} else {
					this.bankCountry = this.bankContextPath.match(/BankCountry='(\S*)',/)[1];
					this.bankInternalId = this.bankContextPath.match(/BankInternalId='(\S*)'/)[1];
					this.houseBankContext.getProperty()["BankCountry"] = this.bankCountry;
					var oBankInternalId = decodeURIComponent(this.bankInternalId);
					this.houseBankContext.getProperty()["BankInternalId"] = oBankInternalId;
				}
				this.byId("HouseBankViewObjectPageLayout").setShowFooter(true);

			} else {

				if (this.mode === "edit")
					this._toggleEditAndDisplay(true);
				else
					this._toggleEditAndDisplay(false);

				this.getView().getModel().read("/" + this.houseBankContextPath);
				this.houseBankContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.houseBankContextPath);
			}
			// Set House Bank Context
			this.getView().setBindingContext(this.houseBankContext);
		},

		_toggleEditAndDisplay: function (bStatus) {
			// toggle screen title
			if (bStatus) {
				this.mode = "edit";
			} else {
				this.mode = "read";
			}
			this.byId("HouseBankViewObjectPageLayout").setShowFooter(bStatus);
			this.byId("fin.cash.bankmaster.manage.editButton").setVisible(!bStatus);
			this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(bStatus);
			this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(bStatus);

			// toggle edit mode and display mode
			this.byId("fin.cash.bankmaster.manage.houseBankSmartForm").setEditable(bStatus);
		},

		// ---------------------------------------------
		// Create and Update Functionality
		// ---------------------------------------------

		onSaveButtonPressed: function (oEvent) {
			this.dataObject = this.getView().getBindingContext().getObject();

			// Set default binding attributes
			for (var index in this.getView().getModel().createEntry("/HouseBankSet").getProperty()) {
				if (index !== "__metadata" && !this.dataObject[index] && this.bankContext.getProperty()[index] && index !== "BankNumber")
					this.dataObject[index] = this.bankContext.getProperty()[index];
			}

			this.saveSuccess = false;
			this.validatedMessages = [];

			if (this.mode === "create") {
				// Non-empty validation
				var nonEmpty = true;
				nonEmpty = Validator._setNonEmptyValidation(this, "companyCodeField", this.getText("NON_EMPTY_VALIDATION_COMPANY_CODE_TITLE")) &&
					nonEmpty;
				nonEmpty = Validator._setNonEmptyValidation(this, "houseBankKeyField", this.getText("NON_EMPTY_VALIDATION_HOUSE_BANK_KEY_TITLE")) &&
					nonEmpty;

				if (nonEmpty === false)
					return;

				// CompanyCode non-existence validation
				var nonExist = true;
				for (var i in this.getModel().oData) {
					if (i.indexOf("HouseBankSet(CompanyCode='" + this.getView().getBindingContext().getProperty().CompanyCode + "',HouseBankKey='" +
							this.getView().getBindingContext().getProperty().HouseBankKey) !== -1) {
						var object = this.getModel().oData[i];
						if (object.BankInternalId === this.bankContext.getObject().BankInternalId && object.BankCountry === this.bankContext.getObject()
							.BankCountry) {
							nonExist = false;
							Validator._setValidationMessage(this, "houseBankKeyField", "Error", this.getText("HOUSE_BANK_EXIST_ERROR_TEXT"));
						}
					}
				}

				if (nonExist === false)
					return;

				// mandatory check whether the house bank key length is less than 5
				if (this.byId("houseBankKeyField").getValue().length > 5)
					return;

				this.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setText(this.getText("SAVING_BUTTON"));
				var that = this;

				$.when(Creator._createData(this, "/HouseBankSet", this.getText("CREATE_HOUSE_BANK_SUCCESS_TEXT"), this.getText(
					"CREATE_HOUSE_BANK_ERROR_TEXT"))).then(function (res) {
					if (res) {
						that.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(true);
						that.byId("fin.cash.bankmaster.manage.saveButton").setText(that.getText("SAVE_BUTTON"));

						if (that.saveSuccess === true) {
							that.getRouter().navTo("HouseBankScreen", {
								mode: "read",
								bankContextPath: that.bankContextPath,
								houseBankContextPath: "HouseBankSet(CompanyCode='" + that.getView().getBindingContext().getProperty("CompanyCode") +
									"',HouseBankKey='" + that.getView().getBindingContext().getProperty("HouseBankKey") + "')"
							}, true);
						}
					}
				});

			} else {
				Updater._updateData(this, this.getText("UPDATE_HOUSE_BANK_SUCCESS_TEXT"), this.getText("UPDATE_HOUSE_BANK_ERROR_TEXT"));
				this._toggleEditAndDisplay(false);
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
			this._toggleEditAndDisplay(true);
		},

		onNameOfContactPersonChanged: function (oEvent) {
			var oValue = oEvent.getParameters().newValue;
			var oMessage = this.getText("HOUSE_BANK_CONTACT_VALIDATION");
			if (oValue.charAt(0) === "+" || oValue.charAt(0) === "-" || oValue.charAt(0) === "=" || oValue.charAt(0) === "\@") {
				this.byId("NameOfContactPerson").setValueState(sap.ui.core.ValueState.Error);
				this.byId("NameOfContactPerson").setValueStateText(
					oMessage);
			}
		}
	});
});