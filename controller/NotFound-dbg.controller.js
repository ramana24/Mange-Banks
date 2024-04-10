/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
        "fin/cash/bankmaster/manage/util/BaseController",
        "fin/cash/bankmaster/manage/util/Navigator"
    ], function(BaseController, Navigator) {
	"use strict";

	return BaseController.extend("fin.cash.bankmaster.manage.controller.NotFound", {
		
		onBackNav : function(oEvent) {
			Navigator._navigateBack(this);
		},
		
	});
});