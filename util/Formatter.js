/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/m/Label"],function(L){"use strict";return{formatKeyAndDescription:function(k,d){if(k!==undefined&&k!==""&&k!==null){if(d!=undefined){return k+" ("+d+")";}else{return k;}}else{return'';}},shareAsTile:function(t,i,u){return{title:t,icon:i,customUrl:u};},shareJamData:function(t,T,u){return{oDataServiceUrl:u,object:{id:document.URL,display:new L({text:t}),share:T}};},FormatDeletionMarks:function(v){var R=this.getView().getModel("i18n").getResourceBundle();if(v==='X'){return R.getText("YES");}else{return R.getText("NO");}}};});
