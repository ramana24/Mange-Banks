/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
        "fin/cash/bankmaster/manage/util/Validator"
	], function (Validator) {
	"use strict";
	
	return {
		
		_deleteData : function(that, sPath, sDeleteSuccessText, sDeleteErrorText) {
			var dfd = $.Deferred();
			that.getView().getModel().remove(
				sPath,
				{
					success : function(oData, oResponse) {
						if (oResponse.headers["sap-message"]) {
							var responseObj = JSON.parse(oResponse.headers["sap-message"]);
							Validator._setValidatedMessages(that, responseObj);
							Validator._setValidatedFields(that);
						}
						
						sap.m.MessageToast.show(sDeleteSuccessText);
						dfd.resolve("success");
					},
					error : function(oError) {
						if (oError.responseText) {
							var responseObj = JSON.parse(oError.responseText);
							Validator._setValidatedMessages(that, responseObj.error.innererror.errordetails);
							Validator._setValidatedFields(that);
						}
						
						sap.m.MessageToast.show(sDeleteErrorText);
						dfd.resolve("error");
					},
				}
			);
			
			return dfd.promise();
		}
		
	};
	
});