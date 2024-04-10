/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
        "fin/cash/bankmaster/manage/util/Validator"
	], function (Validator) {
	"use strict";

    return {
    	
		_updateData : function(that, sUpdateSuccessText, sUpdateErrorText, config) {
			var dfd = $.Deferred();
			var oData = jQuery.extend(false, {}, that.dataObject);
			if( config != null ) {
				var filterParams = config.filterParams || [];
				for( var i = 0; i < filterParams.length; i++ ) {
					var sKey = filterParams[i];
					if( oData.hasOwnProperty(sKey) ) {
						oData[sKey] = null;
					}
				}
			}
			var oNewData = {};
			for( var key in oData ) {
				if( oData[key] != null || key === "Ruleforintrdaybnkstatimport") {
					oNewData[key] = oData[key];
				}
			}
			that.getView().getModel().update(
				that.getView().getBindingContext().getPath(), oNewData, {
					success : function(oData, oResponse) {
						if (oResponse.headers["sap-message"]) {
							var responseObj = JSON.parse(oResponse.headers["sap-message"]);
							Validator._setValidatedMessages(that, responseObj);
							Validator._setValidatedFields(that);
						}else{
							that.byId("messagesIndicator").setVisible(false);
						}
						
						sap.m.MessageToast.show(sUpdateSuccessText);
						that.saveSuccess = true;
						dfd.resolve(that.saveSuccess);
					},
					error : function(oError) {
						if (oError.responseText) {
							var responseObj = JSON.parse(oError.responseText);
							Validator._setValidatedMessages(that, responseObj.error.innererror.errordetails);
							Validator._setValidatedFields(that);
						}
						that.getView().getModel().resetChanges();
						sap.m.MessageToast.show(sUpdateErrorText);
						dfd.resolve("error");
					},
					merge : false
				}
			);
			
			return dfd.promise();
		}
		
    };

});