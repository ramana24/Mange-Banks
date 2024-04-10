/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
        "fin/cash/bankmaster/manage/util/Uploader",
        "fin/cash/bankmaster/manage/util/Validator"
	], function (Uploader, Validator) {
	"use strict";

    return {
    	
		_updateData : function(that, sUpdateSuccessText, sUpdateErrorText) {
			that.getView().getModel().update(
				that.getView().getBindingContext().getPath(),
				jQuery.extend(false, {}, that.dataObject),
				{
					success : function(oData, oResponse) {
						if (oResponse.headers["sap-message"]) {
							var responseObj = JSON.parse(oResponse.headers["sap-message"]);
							Validator._setValidatedMessages(that, responseObj);
							Validator._setValidatedFields(that);
						}
						
						sap.m.MessageToast.show(sUpdateSuccessText);
						that.saveSuccess = true;
					},
					error : function(oError) {
						if (oError.responseText) {
							var responseObj = JSON.parse(oError.responseText);
							Validator._setValidatedMessages(that, responseObj.error.innererror.errordetails);
							Validator._setValidatedFields(that);
						}
						
						sap.m.MessageToast.show(sUpdateErrorText);
					},
					merge : false
				}
			);
		}
		
    };

});