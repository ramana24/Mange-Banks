/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([], function () {
	"use strict";

	return {

		_initMessagePopover: function (that) {
			if (!that.messagePopover) {
				//				var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
				//				var oMessageManager = new sap.ui.getCore().getMessageManager();
				//	
				//				oMessageManager.removeAllMessages();
				//				oMessageManager.registerMessageProcessor(oMessageProcessor);
				//				oMessageManager.addMessages(new sap.ui.core.message.Message({processor: oMessageProcessor}));

				var messageTemplate = new sap.m.MessagePopoverItem({
					type: '{type}',
					title: '{title}',
					description: '{description}'
				});

				that.messagePopover = new sap.m.MessagePopover({
					items: {
						path: '/',
						template: messageTemplate
					}
				});
			}

			this._setMessagePopover(that);
		},

		_initValidatedFields: function () {
			var validatedFields = {
				"BF00/202": "bankCountryField",
				"BF00/206": "bankKeyField",
				"BF00/215": "bankKeyField",
				"AR/102": "bankKeyField",
				"AR/202": "swiftField",
				"AR/203": "swiftField",
				"AR/204": "swiftField",
				"AR/205": "swiftField",
				"AM/010": "addressCountryField",
				"AM/030": "addressCountryField",
				"AM/053": "addressCountryField",
				"AM/129": "transportZoneField",
				"AM/196": "timezoneField",
				"AM/214": "addressCountryField",
				"AM/216": "addressCountryField",
				"AM/229": "poBoxField",
				"AM/478": "deliveryServiceTypeField",
				"AM/482": "timezoneField",
				"AM/653": "postCodeField",
				"AM/654": "poBoxPostalCodeField",
				"AM/655": "companyPostalCodeField",
				"AM/656": "postCodeField",
				"AM/659": "postCodeField",
				"R5/515": "poBoxPostalCodeField",
				"XS/138": "emailAddressField",
				"00/058": "bankRegionField",
				"FSBP/404": "ratingSelect",
				"AR/148": "bankKeyField"

			};
			return validatedFields;
		},

		_setValidatedMessages: function (that, messageDetails) {
			if (!messageDetails.length) {
				if (messageDetails.code === "")
					return;

				var messageType = "Information";
				if (messageDetails.severity === "error")
					messageType = "Error";
				else if (messageDetails.severity === "warning")
					messageType = "Warning";
				else if (messageDetails.severity === "info")
					messageType = "Information";

				var message = {
					type: messageType,
					title: messageDetails.message,
					description: messageDetails.code
				};
				that.validatedMessages.push(message);
			} else if (messageDetails.length != 0) {
				for (var i in messageDetails) {
					if (messageDetails[i].code === "" || messageDetails[i].code === "/IWBEP/CX_MGW_BUSI_EXCEPTION")
						continue;

					var messageType = "Information";
					if (messageDetails[i].severity === "error")
						messageType = "Error";
					else if (messageDetails[i].severity === "warning")
						messageType = "Warning";
					else if (messageDetails[i].severity === "info")
						messageType = "Information";

					var message = {
						type: messageType,
						title: messageDetails[i].message,
						description: messageDetails[i].code
					};
					that.validatedMessages.push(message);
				}
			}

			this._setMessagePopover(that);
			that.onMessagePopoverPressed();
		},

		_setValidatedFields: function (that) {
			for (var i in that.validatedMessages) {
				var validatedCode = that.validatedMessages[i].description;
				if (that.validatedFields[validatedCode]) {
					var validatedField;
					if (validatedCode === "00/058" && that.getView().getViewName() === "fin.cash.bankmaster.manage.view.HouseBank") {
						validatedField = that.getView().byId("companyCodeField");
					} else {
						validatedField = that.getView().byId(that.validatedFields[validatedCode]);
					}
					if (validatedField) {
						validatedField.setValueState(that.validatedMessages[i].type);
						validatedField.setValueStateText(that.validatedMessages[i].title);
					}
				}
			}

		},

		_setNonEmptyValidation: function (that, id, message) {
			if (!that.byId(id).getValue().replace(/\ +/g, "")) {
				this._setValidationMessage(that, id, "Error", message);
				return false;
			}
			return true;
		},

		_setLimitLength: function (that, id, message, ratingLimit) {
			if (that.byId(id).getValue().length > ratingLimit) {
				this._setValidationMessage(that, id, "Error", message);
				return false;
			}
			return true;
		},

		_setValidationMessage: function (that, id, state, message) {
			if (id) {
				that.byId(id).setValueState(state);
				that.byId(id).setValueStateText(message);
			}

			var validationMessage = {
				type: state,
				title: message,
				description: ""
			};
			that.validatedMessages.push(validationMessage);

			this._setMessagePopover(that);
			that.onMessagePopoverPressed();
		},

		_setMessagePopover: function (that) {
			var messagePopoverModel = new sap.ui.model.json.JSONModel();
			messagePopoverModel.setData(that.validatedMessages);
			that.messagePopover.removeCustomData();
			that.messagePopover.setModel(messagePopoverModel);
		},
	};

});