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
	"fin/cash/bankmaster/manage/util/Layout"
], function (BaseController, Creator, Updater, Navigator, Messager, Validator, Layout) {
	"use strict";

	return BaseController.extend("fin.cash.bankmaster.manage.controller.InternationalVersion", {

		onInit: function (oEvent) {
			this.getRouter().attachRoutePatternMatched(this.onRoutePatternMatched, this);

			// Set visibility
			//	this.byId("_IDEGen_fragment0--communicationGroup").setVisible(false);

			// Set messagesIndicator on loading page
			Validator._initMessagePopover(this);
			this.validatedFields = Validator._initValidatedFields();
			this.byId("messagesIndicator").setVisible(false);
			this.byId("InternationalAddressViewObjectPageLayout").setShowFooter(false);
		},

		onRoutePatternMatched: function (oEvent) {
			if (oEvent.getParameter("name") !== "InternationalVersionScreen")
				return;

			this.getView().getModel().setDefaultBindingMode("TwoWay");

			//set title
			var sTitle = this.getText("INTERNATIONAL_VERSION_OBJECT_HEADER_TITLE");
			this.getOwnerComponent().getService("ShellUIService").then( // promise is returned
				function (oService) {
					oService.setTitle(sTitle);
				},
				function (oError) {
					jQuery.sap.log.error("Cannot get ShellUIService", oError, "fin.cash.bankmaster.manage.Component");
				}
			);

			this.mode = oEvent.getParameter("arguments").mode.toLowerCase();
			this.internationalVersionContextPath = oEvent.getParameter("arguments").internationalVersionContextPath;

			this.bankContextPath = oEvent.getParameter("arguments").bankContextPath;
			this.bankContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.bankContextPath);

			this.addressContextPath = oEvent.getParameter("arguments").addressContextPath;
			this.addressContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.addressContextPath);

			if (this.mode === "create") {
				/*this.byId("fin.cash.bankmaster.manage.internationalVisionView").setTitle(this.getText("CREATE_INTERNATIONAL_VERSION_TITLE"));*/

				this.byId("fin.cash.bankmaster.manage.editButton").setVisible(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(true);
				this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(true);

				this.byId("_IDEGen_fragment0--nationField").setEditable(true);
				this.byId("_IDEGen_fragment0--fin.cash.bankmaster.manage.addressSmartForm").setEditable(true);

				this.internationalVersionContext = this.getView().getModel().createEntry("/AddressSet", {
					properties: this._prepareValuesInCreateMode()
				});
				this.byId("InternationalAddressViewObjectPageLayout").setShowFooter(true);

			} else {
				if (this.mode === "edit")
					this._toggleEditAndDisplay(true);
				else
					this._toggleEditAndDisplay(false);

				this.getView().getModel().read("/" + this.internationalVersionContextPath);
				this.internationalVersionContext = new sap.ui.model.Context(this.getView().getModel(), "/" + this.internationalVersionContextPath);
			}
			// Set International Version Context
			this.getView().setBindingContext(this.internationalVersionContext);
		},

		_prepareValuesInCreateMode: function () {
			var addressObject = this.getView().getModel().getObject(this.addressContext.getPath());
			var excludedFields = [
				"AddressCity",
				"AddressGroup",
				"AddressId",
				"AddressLine1",
				"AddressLine2",
				"AddressLine3",
				"AddressLine4",
				"Building",
				"CareOfName",
				"Comments",
				"County",
				"District",
				"Floor",
				"HouseNumber",
				"HouseNumberSupplement",
				"Name",
				"Name2",
				"Name3",
				"Name4",
				"RoomNumber",
				"SearchTerm1",
				"SearchTerm2",
				"Street",
				"Title",
				"TitleText",
				"TownShip",
				"Village"
			];
			excludedFields.forEach(function (item) {
				addressObject[item] = "";
			});

			return addressObject;
		},

		_toggleEditAndDisplay: function (bStatus) {
			// toggle screen title
			if (bStatus) {
				this.mode = "edit";
				/*	this.byId("fin.cash.bankmaster.manage.internationalVisionView").setTitle(this.getText("EDIT_INTERNATIONAL_VERSION_TITLE"));*/

				// Important: Only set editable key fields in the "edit" mode.
				this.byId("_IDEGen_fragment0--addressCountryField").setEditable(false);
				this.byId("_IDEGen_fragment0--nationField").setEditable(false);
			} else {
				this.mode = "read";
				/*	this.byId("fin.cash.bankmaster.manage.internationalVisionView").setTitle(this.getText("DISPLAY_INTERNATIONAL_VERSION_TITLE"));*/
			}

			this.byId("fin.cash.bankmaster.manage.editButton").setVisible(!bStatus);
			this.byId("fin.cash.bankmaster.manage.saveButton").setVisible(bStatus);
			this.byId("fin.cash.bankmaster.manage.cancelButton").setVisible(bStatus);
			this.byId("InternationalAddressViewObjectPageLayout").setShowFooter(bStatus);

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
				if (index != "__metadata" && !this.dataObject[index] && this.addressContext.getProperty()[index])
					this.dataObject[index] = this.addressContext.getProperty()[index];
			}

			this.saveSuccess = false;
			this.validatedMessages = [];

			if (this.mode === "create") {
				// Non-empty validation
				var nonEmpty = true;
				nonEmpty = Validator._setNonEmptyValidation(this, "_IDEGen_fragment0--addressCountryField", this.getText(
						"NON_EMPTY_VALIDATION_BANK_COUNTRY_TITLE")) &&
					nonEmpty;
				nonEmpty = Validator._setNonEmptyValidation(this, "_IDEGen_fragment0--nationField", this.getText(
						"NON_EMPTY_VALIDATION_INTERNATIONAL_VERSION_TITLE")) &&
					nonEmpty;

				if (nonEmpty === false)
					return;

				this.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(false);
				this.byId("fin.cash.bankmaster.manage.saveButton").setText(this.getText("SAVING_BUTTON"));

				var that = this;

				$.when(Creator._createData(this, "/AddressSet", this.getText("CREATE_INTERNATIONAL_SUCCESS_TEXT"), this.getText(
					"CREATE_INTERNATIONAL_VERSION_ERROR_TEXT"))).then(function (res) {
					if (res) {
						that.byId("fin.cash.bankmaster.manage.saveButton").setEnabled(true);
						that.byId("fin.cash.bankmaster.manage.saveButton").setText(that.getText("SAVE_BUTTON"));

						if (that.saveSuccess === true) {
							that.getRouter().navTo("InternationalVersionScreen", {
								mode: "read",
								bankContextPath: that.bankContextPath,
								addressContextPath: that.addressContextPath,
								internationalVersionContextPath: "AddressSet(AddressId='" + that.bankContext.getProperty("AddressId") + "',Nation='" +
									that.getView().getBindingContext().getProperty("Nation") + "')"
							}, true);
						}
					}
				});

			} else {
				Updater._updateData(this, this.getText("UPDATE_INTERNATIONAL_SUCCESS_TEXT"), this.getText("UPDATE_INTERNATIONAL_ERROR_TEXT"));
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
			// Edit Bank and Display International Version Switch
			this._toggleEditAndDisplay(true);
		},

		// ---------------------------------------------
		// Show All or Show Fewer Press Events
		// ---------------------------------------------

		onToggleElements: function () {
			// Toggle fields
			Layout._toggleElements(this);
		},

	});
});