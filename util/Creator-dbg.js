/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"fin/cash/bankmaster/manage/util/Validator",
	"sap/m/MessageBox"
], function (Validator, MessageBox) {
	"use strict";

	return {

		_createData: function (that, sPath, sCreateSuccessText, sCreateErrorText) {
			var dfd = $.Deferred();
			that.getView().getModel().create(
				sPath,
				jQuery.extend(false, {}, that.dataObject), {
					success: function (oData, oResponse) {
						if (oResponse.headers["sap-message"]) {
							var responseObj = JSON.parse(oResponse.headers["sap-message"]);
							Validator._setValidatedMessages(that, responseObj);
							Validator._setValidatedFields(that);
						} else {
							that.byId("messagesIndicator").setVisible(false);
						}

						if (oData.BpNumber && oData.ContactPersonNumber) {
							that.bpNumber = oData.BpNumber;
							that.contactPersonNumber = oData.ContactPersonNumber;
						}

						if (that.getView().getViewName() === "fin.cash.bankmaster.manage.view.Bank") {
							that.bankInternalId = oData.BankInternalId;
						}

						sap.m.MessageToast.show(sCreateSuccessText);
						that.saveSuccess = true;
						dfd.resolve(that.saveSuccess);
					},
					error: function (oError) {
						if (oError.responseText) {
							var responseObj = JSON.parse(oError.responseText);
							Validator._setValidatedMessages(that, responseObj.error.innererror.errordetails);
							Validator._setValidatedFields(that);
						}

						sap.m.MessageToast.show(sCreateErrorText);
						dfd.resolve("error");
					},
				}
			);
			return dfd.promise();
		}

	};

});