/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/base/Object","sap/m/MessageBox","sap/ui/Device"],function(O,M,D){"use strict";return O.extend("fin.cash.bankmaster.manage.controller.ErrorHandler",{constructor:function(c){this._oResourceBundle=c.getModel("i18n").getResourceBundle();this._oComponent=c;this._oModel=c.getModel();this._bMessageOpen=false;this._oModel.attachEvent("metadataFailed",function(e){var p=e.getParameters();this._showMetadataError(p.statusCode+" ("+p.statusText+")\r\n"+p.message+"\r\n"+p.responseText+"\r\n");},this);this._oModel.attachEvent("requestFailed",function(e){var p=e.getParameters();if(p.response.statusCode!==404||(p.response.statusCode===404&&p.response.responseText.indexOf("Cannot POST")===0)){var m,r;try{r=jQuery.parseJSON(e.getParameter("responseText"));}catch(a){r=null;}if(r&&r.error&&r.error.innererror&&r.error.innererror.errordetails&&r.error.innererror.errordetails[0]&&r.error.innererror.errordetails[0].message){m=p.response.statusCode+" ("+p.response.statusText+")\r\n"+r.error.innererror.errordetails[0].message;}else{m=p.response.statusCode+" ("+p.response.statusText+")\r\n"+p.response.message+"\r\n"+p.response.responseText+"\r\n";}this._showServiceError(m);}},this);},_showMetadataError:function(d){M.show(this._oResourceBundle.getText("ERR_METADATA_TEXT"),{id:"metadataErrorMessageBox",icon:M.Icon.ERROR,title:this._oResourceBundle.getText("ERR_METADATA_TITLE"),details:d,styleClass:this._oComponent.getCompactCozyClass(),actions:[M.Action.RETRY,sap.m.MessageBox.Action.CLOSE],onClose:function(a){if(a===M.Action.RETRY){this.bMessageOpen=false;this._oModel.refreshMetadata();}}.bind(this)});},_showServiceError:function(d){if(!this._bMessageOpen){this._bMessageOpen=true;M.show(this._oResourceBundle.getText("ERR_SERVICE_TEXT"),{id:"serviceErrorMessageBox",icon:M.Icon.ERROR,title:this._oResourceBundle.getText("ERR_SERVICE_TITLE"),details:d,styleClass:this._oComponent.getCompactCozyClass(),actions:[M.Action.CLOSE],onClose:function(a){this._bMessageOpen=false;}.bind(this)});}}});});
