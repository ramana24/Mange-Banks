/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/util/MockServer"
], function(MockServer) {
	"use strict";

	return {

		_sServiceUrl: "/sap/opu/odata/sap/FCLM_BM_SRV/",
		_sMetadataAddress: "fin/cash/bankmaster/manage/localService",
		_sModulePath: "fin/cash/bankmaster/manage/localService/mockdata",
		_sAppModulePath: "fin/cash/bankmaster/manage",

		/**
		 * Initializes the mock server. You can configure the delay with the URL parameter "serverDelay"
		 * The local mock data in this folder is returned instead of the real data for testing.
		 *
		 * @public
		 */

		init: function() {
			var oUriParameters = jQuery.sap.getUriParameters(),
				oMockServer = new MockServer({
					rootUri: this._sServiceUrl
				});

			var sMetadataPath = jQuery.sap.getModulePath(this._sMetadataAddress);
			var sMockdataPath = jQuery.sap.getModulePath(this._sModulePath);
			
			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 1000)
			});

			// load local mock data
			oMockServer.simulate(sMetadataPath + "/metadata.xml", {
				sMockdataBaseUrl: sMockdataPath
			});
			
		/*	var aRequests = oMockServer.getRequests();
			
			oMockServer.setRequests(aRequests);*/

			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");
		}
	};

});