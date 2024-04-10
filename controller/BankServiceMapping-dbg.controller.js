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

	return BaseController.extend("fin.cash.bankmaster.manage.controller.BankServiceMapping", {
		formatter: Formatter,
		onInit: function (oEvent) {

			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
			Validator._initMessagePopover(this);
			this.validatedFields = Validator._initValidatedFields();
			if (this.byId("messagesIndicator")) {
				this.byId("messagesIndicator").setVisible(false);
			}
			this.byId("BankServiceMappingViewObjectPageLayout").setShowFooter(false);
		},

		onRoutePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "ServiceMappingScreen") {
				return;
			}
			this.getView().getModel().setDefaultBindingMode("TwoWay");

			//set title
			var sTitle = this.getText("SERVICE_OBJECTPAGESECTION_TEXT");
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "fin.cash.bankmaster.manage.Component");
				}
			);

			this.mode = oEvent.getParameter("arguments").mode.toLowerCase();
			this.serviceCodePath = oEvent.getParameter("arguments").serviceCodePath;

			this.bankContextPath = oEvent.getParameter("arguments").bankContextPath;
			this.bankContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.bankContextPath);

			// Set Bank Group's Context 
			this.byId("serviceCodeViewBankGroup").getModel().read("/" + this.bankContextPath);
			this.byId("serviceCodeViewBankGroup").setBindingContext(this.bankContext);

			if (this.mode === "create") {

				this.byId("fin.cash.bankmaster.manage.editButton").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(true);
				this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(true);

				this.byId("fin.cash.bankmaster.manage.bankfeeServiceSmartForm").setEditable(true);

				this.serviceCodeContext = this.getView().getModel().createEntry("/BankServiceSet");
				// Set auto fill binding attributes in creation mode
				for (var index in this.serviceCodeContext.getProperty()) {
					if (index != "__metadata" && this.bankContext.getProperty()[index])
						this.serviceCodeContext.getProperty()[index] = this.bankContext.getProperty()[index];
				}
				this.byId("BankServiceMappingViewObjectPageLayout").setShowFooter(true);

			} else {
				if (this.mode === "edit")
					this._toggleEditAndDisplay(true);
				else
					this._toggleEditAndDisplay(false);

				this.getView().getModel().read("/" + this.serviceCodePath);
				this.serviceCodeContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.serviceCodePath);

			}
			this.getView().setBindingContext(this.serviceCodeContext);

		},

		_toggleEditAndDisplay: function (bEnabled) {
			this.byId("fin.cash.bankmaster.manage.editButton").setVisible(!bEnabled);
			this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(bEnabled);
			this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(bEnabled);

			this.byId("fin.cash.bankmaster.manage.bankfeeServiceSmartForm").setEditable(bEnabled);
			this.byId("BankServiceMappingViewObjectPageLayout").setShowFooter(bEnabled);
		},

		onSaveButtonPressed: function () {
			this.dataObject = this.getView().getBindingContext().getObject();

			this.dataObject.BankInternalId = this.bankContext.getProperty("BankInternalId");
			this.dataObject.BankCountry = this.bankContext.getProperty("BankCountry");

			this.saveSuccess = false;
			this.validatedMessages = [];
			var inputLimit = 4;

			if (this.mode === "create") {

				var nonEmpty = true;
				nonEmpty = Validator._setNonEmptyValidation(this, "BankFeeService", this.getText("NON_EMPTY_VALIDATION_BANK_FEE")) &&
					nonEmpty;

				nonEmpty = Validator._setNonEmptyValidation(this, "PaymentTransactionTypeGroup", this.getText(
						"NON_EMPTY_VALIDATION_TRANSACTION_TYPE")) &&
					nonEmpty;

				nonEmpty = Validator._setNonEmptyValidation(this, "PaymentExternalTransacType", this.getText(
						"NON_EMPTY_VALIDATION_EXTERNAL_TRANSACTION")) &&
					nonEmpty;

				if (!nonEmpty) {
					return;
				}

				this.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setText(this.getText("SAVING_BUTTON"));
				var that = this;

				$.when(Creator._createData(this, "/BankServiceSet", this.getText("CREATE_SERVICE_SUCCESS_TEXT"), this.getText(
					"CREATE_SERVICE_ERROR_TEXT"))).then(function (res) {
					if (res) {
						that.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(true);
						that.byId("fin.cash.bankmaster.manage.saveButton").setText(that.getText("SAVE_BUTTON"));

						if (that.saveSuccess === true) {
							that.getRouter().navTo("ServiceMappingScreen", {
								mode: "read",
								bankContextPath: that.bankContextPath,
								serviceCodePath: "BankServiceSet(BankCountry='" + that.bankContext.getProperty("BankCountry") + "',BankInternalId='" +
									encodeURIComponent(that.bankContext.getProperty("BankInternalId")) + "',BankFeeService='" + that.dataObject.BankFeeService +
									"',PaymentTransactionTypeGroup='" + that.dataObject.PaymentTransactionTypeGroup + "')"
							}, true);
						}
					}
				});

			} else {
				Updater._updateData(this, this.getText("UPDATE_SERVICE_SUCCESS_TEXT"), this.getText("UPDATE_SERVICE_ERROR_TEXT"));
				this._toggleEditAndDisplay(false);
			}
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

		onMessagePopoverPressed: function () {
			this.byId("messagesIndicator").setVisible(true);
			this.byId("messagesIndicator").setText(this.validatedMessages.length);
			this.messagePopover.openBy(this.byId("messagesIndicator"));
		}

	});
});