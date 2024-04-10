/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
        "sap/ui/core/UIComponent",
        "fin/cash/bankmaster/manage/util/Model",
        "jquery.sap.global",
    ], function (UIComponent, Model, jQuery) {
	"use strict";

	return UIComponent.extend("fin.cash.bankmaster.manage.Component", {

		metadata : {
			manifest : "json"
		},

		/**
		 * The component is initialized by UI5 automatically during
		 * the startup of the app and calls the init method once. In
		 * this function, the resource and application models are
		 * set and the router is initialized.
		 *
		 * @public
		 * @override
		 */
		init : function() {
		

			// set the device model
			this.setModel(Model.createDeviceModel(), "device");
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// get Root control
			var oRootControl = this.getAggregation("rootControl").addStyleClass(this.getCompactCozyClass());
			this._oRootView = oRootControl;
			// create the views based on the url/hash
			var oComponentData = this.getComponentData();
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			var oUrlParameter = {};
			var bNavigateBankDetail = false;
			var bNaviHouseBankDetail = false;
		//	var bNaviSpeciBank = false;
			var sKey1 = "";
			var oBankCountry, oBankInternalId, oMode, oCompanyCode, oHouseBankID;
			var that = this;
			if (oHashChanger.getHash() === "" && oComponentData && oComponentData.startupParameters) {

				jQuery.each(oComponentData.startupParameters, function(sKey, aValue) {
					if (["BankCountry", "BankInternalId", "Mode", "Bank", "CompanyCode", "HouseBankID","version","HouseBank","BankKey","BankInternalID"].indexOf(sKey) >= 0) {

						if (sKey === "BankCountry") {
							oBankCountry = aValue[0];
						} else if (sKey === "BankInternalId" || sKey === "BankKey") {
							oBankInternalId = aValue[0];
						} else if (sKey === "CompanyCode") {
							oCompanyCode = aValue[0];
						} else if (sKey === "HouseBankID" || sKey === "HouseBank") {
							oHouseBankID = aValue[0];
						} else if (sKey === "Mode") {
							oMode = aValue[0];
						} else if (sKey === "Bank" && !oBankInternalId) {
							oBankInternalId = aValue[0];
						} else if(sKey === "version"){
						    that._version = aValue[0];
						} else if (sKey === "BankInternalID"){
							oBankInternalId = aValue[0];
						}
					}
				});
				
				if(!oMode){
				    oMode = "read";
				}

				if (oBankCountry && oBankInternalId && oCompanyCode && oHouseBankID) {
					// Navigate to house bank view
					bNaviHouseBankDetail = true;
					sKey1 = "bankContextPath";
					oUrlParameter[sKey1] = "BankSet(BankCountry='" + oBankCountry + "',BankInternalId='" + oBankInternalId + "')";
					sKey1 = "houseBankContextPath";
					oUrlParameter[sKey1] = "HouseBankSet(CompanyCode='" + oCompanyCode + "',HouseBankKey='" + oHouseBankID + "')";
					sKey1 = "mode";
					oUrlParameter[sKey1] = oMode;
				}else if(oBankCountry && oBankInternalId){
				    bNavigateBankDetail = true;
				    sKey1 = "bankContextPath";
				    oUrlParameter[sKey1] = "BankSet(BankCountry='" + oBankCountry + "',BankInternalId='" + oBankInternalId + "')";
				    sKey1 = "mode";
					oUrlParameter[sKey1] = oMode; 
					sKey1 = "bankInternalId";
					oUrlParameter[sKey1] = oBankInternalId;
				}
			}else if(oHashChanger.getHash() !== "" && oComponentData && oComponentData.startupParameters){
			    jQuery.each(oComponentData.startupParameters, function(sKey, aValue) {
					if (["version"].indexOf(sKey) >= 0) {
					    
						if(sKey === "version"){
						    that._version = aValue[0];
						}
					}
				});
			}

			var oRouter = this.getRouter();
			if (bNaviHouseBankDetail || bNavigateBankDetail ) {
			    if(bNavigateBankDetail){
			        var oRoute = oRouter.getRoute("BankScreen");
			    }else{
			        var oRoute = oRouter.getRoute("HouseBankScreen");
			    }
			    
				var sNewHash = oRoute.getURL(oUrlParameter);
				oHashChanger.replaceHash(sNewHash);
			}
			oRouter.initialize();
		},
	

		/**
		 * This method can be called to determine whether the sapUiSizeCompact
		 * or sapUiSizeCozy design mode class should be set, which influences
		 * the size appearance of some controls.
		 * @public
		 */
		getCompactCozyClass : function() {
			if (!this._sCompactCozyClass) {
				// apply compact mode
				if (sap.ui.Device.system.desktop) {
					this._sCompactCozyClass = "sapUiSizeCompact";
				} else {
					this._sCompactCozyClass = "sapUiSizeCozy";
				}
			}
			return this._sCompactCozyClass;
		},

		destroy : function () {
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},
	
		
		getContentDensityClass:function(){
		    if(this._sContentDensityClass === undefined){
		        //check whether FLP ahs already set the content density class;do nothing in this case
		        if(jQuery(document.body).hasClass("sapUiSizeCozy")||jQuery(document.body).hasClass("sapUiSizeCompact")){
		            this._sContentDensityClass = "";
		        }else if(!sap.ui.Device.support.touch){//apply "compact" mode if touch is not supported
		            this._sContentDensityClass = "sapUiSizeCompact";
		        }else{
		            //"cozy" in case of touch support;default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
		            this._sContentDensityClass = "sapUiSizeCozy";
		        }
		    }
		    return this._sContentDensityClass;
		},
		_oComp : null,
		_version : null
		
	});
});