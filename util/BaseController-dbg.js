/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/fin/central/lib/nav/NavigationHandler"
], function (Controller, NavigationHandler) {
	"use strict";

	return Controller.extend("fin.cash.bankmaster.manage.util.BaseController", {

		onInit: function () {
			this.oNavigationHandler = new NavigationHandler(this);

		},

		refresh: {
			bankTable: false
		},

		/**
		 * Convenience method for accessing the event bus.
		 * @public
		 * @returns {sap.ui.core.EventBus} the event bus for this component
		 */
		getEventBus: function () {
			return this.getOwnerComponent().getEventBus();
		},

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		getText: function (id, params) {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(id, params);
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {

			//		var oResource = sap.ui.getCore().getLibraryResourceBundle("sap.m");
			//		var oShareEmail = oResource.getText("SEMANTIC_CONTROL_SEND_EMAIL");
			var oShareModel = new sap.ui.model.json.JSONModel({
				emailSubject: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SEND_EMAIL_SUBJECT")
			});
			// 	this.setModel(oShareModel, "share");

			sap.m.URLHelper.triggerEmail(
				null,
				oShareModel.getProperty("/emailSubject"),
				document.URL
			);
		},
		onShareButtonPressed: function (oEvent) {
			if (!this.oShareActionSheet) {
				this.oShareActionSheet = sap.ui.xmlfragment(this.getView().getId(), "fin.cash.bankmaster.manage.fragment.shareActionSheet", this);
				this.getView().addDependent(this.oShareActionSheet);
			}
			this.oShareActionSheet.setModel(this.getView().getModel("i18n"), "i18n");
			this.oShareActionSheet.openBy(oEvent.getSource());
		},

		storeCurrentAppState: function () {

		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {

			//    var oResource = sap.ui.getCore().getLibraryResourceBundle("sap.m");
			//    var oShareEmail = oResource.getText("SEMANTIC_CONTROL_SHARE_IN_JAM");
			var oViewModel = new sap.ui.model.json.JSONModel({
				jamTitle: this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("SHARE_IN_JAM_TITLE")
			});
			var oShareDialog = sap.ui.getCore().createComponent({
				name: "sap.collaboration.components.fiori.sharing.dialog",
				settings: {
					object: {
						id: document.URL,
						share: oViewModel.getProperty("/jamTitle")
					}
				}
			});
			oShareDialog.open();
		},
		refreshBinding: function (oController) {
			//empty function is a must, otherwise no request sent to backend
			var fnCallBack = function (oData) {
				if ((!oController.version || oController.version !== "basic") && oController.byId("fin.cash.bankmaster.manage.bpNumberLink")) {
					if (oData.getObject().BpNumber) {
						oController.byId("fin.cash.bankmaster.manage.bpNumberLink").setVisible(true);
					} else {
						oController.byId("fin.cash.bankmaster.manage.bpNumberLink").setVisible(false);
					}
				}
			};
			var oBindingContext = oController.getView().getBindingContext();
			if (oBindingContext) {
				oController.getModel().createBindingContext(oBindingContext.getPath(), oBindingContext, null, fnCallBack, true);
			}
		},

		getService: function () {
			var oShellService = sap.ushell && sap.ushell.ui5service && sap.ushell.ui5service.getService("ShellUIService");
		},

		onBeforePopoverOpens: function (oEvent) {

			var oParameters = oEvent.getParameters();
			var semanticObject = oParameters.semanticObject;
			var oSemanticAttributes = oParameters.semanticAttributesOfSemanticObjects;
			var newSemanticAttributes = {};
			switch (semanticObject) {
			case 'CompanyCode':
				newSemanticAttributes.CompanyCode = oSemanticAttributes.CompanyCode.CompanyCode;
				break;
			case "HouseBank":
				newSemanticAttributes.CompanyCode = oSemanticAttributes.HouseBank.CompanyCode;
				newSemanticAttributes.HouseBank = oSemanticAttributes.HouseBank.HouseBank;
				break;
			case "Bank":
				newSemanticAttributes.BankCountry = oSemanticAttributes.Bank.BankCountry;
				newSemanticAttributes.Bank = oSemanticAttributes.Bank.Bank;
				break;
			case "BusinessPartner":
				newSemanticAttributes.BusinessPartner = oSemanticAttributes.BusinessPartner.BusinessPartner;
				break;
			}
			oEvent.getParameters().setSemanticAttributes(newSemanticAttributes, semanticObject);
			oEvent.getParameters().open();

		}

	});

});