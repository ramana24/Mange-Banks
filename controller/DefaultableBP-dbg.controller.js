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

	return BaseController.extend("fin.cash.bankmaster.manage.controller.DefaultableBP", {
		formatter: Formatter,
		onInit: function (oEvent) {

			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);
			Validator._initMessagePopover(this);
			this.validatedFields = Validator._initValidatedFields();
			if (this.byId("messageIndicator")) {
				this.byId("messagesIndicator").setVisible(false);
			}
			this.byId("DefaultableBPViewObjectPageLayout").setShowFooter(false);
		},

		onRoutePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "DefaultableBPScreen") {
				return;
			}
			this.getView().getModel().setDefaultBindingMode("TwoWay");
			var sTitle = this.getText("DEFAULTABLE_BP");
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "fin.cash.bankmaster.manage.Component");
				}
			);

			this.mode = oEvent.getParameter("arguments").mode.toLowerCase();
			this.defaultableBPPath = oEvent.getParameter("arguments").defaultableBPPath;

			this.bankContextPath = oEvent.getParameter("arguments").bankContextPath;
			this.bankContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.bankContextPath);

			// Set Bank Group's Context 
			this.byId("defaultableBPBankGroup").getModel().read("/" + this.bankContextPath);
			this.byId("defaultableBPBankGroup").setBindingContext(this.bankContext);

			if (this.mode === "create") {

				this.byId("fin.cash.bankmaster.manage.editButton").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(true);
				this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(true);

				this.byId("fin.cash.bankmaster.manage.defaultableBPSmartForm").setEditable(true);

				this.defaultableBPContext = this.getView().getModel().createEntry("/DefaultableBPSet");
				// Set auto fill binding attributes in creation mode
				for (var index in this.defaultableBPContext.getProperty()) {
					if (index != "__metadata" && this.bankContext.getProperty()[index])
						this.defaultableBPContext.getProperty()[index] = this.bankContext.getProperty()[index];
				}
				this.byId("DefaultableBPViewObjectPageLayout").setShowFooter(true);

			} else {
				if (this.mode === "edit")
					this._toggleEditAndDisplay(true);
				else
					this._toggleEditAndDisplay(false);

				this.getView().getModel().read("/" + this.defaultableBPPath);
				this.defaultableBPContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.defaultableBPPath);

			}
			this.getView().setBindingContext(this.defaultableBPContext);

		},

		_toggleEditAndDisplay: function (bEnabled) {
			this.byId("fin.cash.bankmaster.manage.editButton").setVisible(!bEnabled);
			this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(bEnabled);
			this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(bEnabled);

			this.byId("fin.cash.bankmaster.manage.defaultableBPSmartForm").setEditable(bEnabled);
			this.byId("DefaultableBPViewObjectPageLayout").setShowFooter(bEnabled);
		},

		onSaveButtonPressed: function () {
			this.dataObject = this.getView().getBindingContext().getObject();

			this.dataObject.BankInternalId = this.bankContext.getProperty("BankInternalId");
			this.dataObject.BankCountry = this.bankContext.getProperty("BankCountry");

			this.saveSuccess = false;
			this.validatedMessages = [];
			var inputLimit = 4;
			var nonEmpty = true;
			nonEmpty = Validator._setNonEmptyValidation(this, "BusinessPartnerNo", this.getText("NON_EMPTY_VALIDATION_BUSINESS_PARTNER")) &&
				nonEmpty;

			nonEmpty = Validator._setNonEmptyValidation(this, "ValidFrom", this.getText(
					"NON_EMPTY_VALIDATION_VALID_FROM")) &&
				nonEmpty;

			nonEmpty = Validator._setNonEmptyValidation(this, "ValidTo", this.getText(
					"NON_EMPTY_VALIDATION_VALID_TO")) &&
				nonEmpty;

			if (!nonEmpty) {
				return;
			}

			if (this.byId("ValidFrom").getValueState() === "Error" || this.byId("ValidTo").getValueState() === "Error") {
				return;
			}

			if (this.mode === "create") {

				this.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setText(this.getText("SAVING_BUTTON"));
				var that = this;

				$.when(Creator._createData(this, "/DefaultableBPSet", this.getText("CREATE_DEFAULTABLEBP_SUCCESS_TEXT"), this.getText(
					"CREATE_DEFAULTABLEBP_ERROR_TEXT"))).then(function (res) {
					if (res) {
						that.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(true);
						that.byId("fin.cash.bankmaster.manage.saveButton").setText(that.getText("SAVE_BUTTON"));

						if (that.saveSuccess === true) {
							var dateFormatinstance = sap.ui.core.format.DateFormat.getDateTimeInstance({
								pattern: "yyyy-MM-ddTkk:ss:mm"
							});
							var oFormatedValue = dateFormatinstance.format(that.dataObject.ValidFrom, true).replace("T24", "T00");
							that.getRouter().navTo("DefaultableBPScreen", {
									mode: "read",
									bankContextPath: that.bankContextPath,
									defaultableBPPath: "DefaultableBPSet(BankCountry='" + that.bankContext.getProperty("BankCountry") + "',BankInternalId='" +
										encodeURIComponent(that.bankContext.getProperty("BankInternalId")) + "',ValidFrom=datetime'" + encodeURIComponent(
											oFormatedValue) + "')"
								},
								true);
						}
					}
				});

			} else {
				Updater._updateData(this, this.getText("UPDATE_DEFAULTABLEBP_SUCCESS_TEXT"), this.getText("UPDATE_DEFAULTABLEBP_ERROR_TEXT"));
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
		},

	});
});