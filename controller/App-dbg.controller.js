/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
   			"fin/cash/bankmaster/manage/util/BaseController",
   			"sap/ui/model/json/JSONModel"
   		], function(BaseController, JSONModel) {
		"use strict";
		
		return BaseController.extend("fin.cash.bankmaster.manage.controller.App", {

		onInit : function() {
			var oViewModel, fnSetAppNotBusy, iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				async: true,
				busy : true,
				delay : 0
			});
			this.setModel(oViewModel, "view");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().getModel().metadataLoaded().
					then(fnSetAppNotBusy);
		}
		
	});
});