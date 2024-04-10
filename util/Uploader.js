/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/cash/bankmaster/manage/util/Uploader","fin/cash/bankmaster/manage/util/Validator"],function(U,V){"use strict";return{_updateData:function(t,u,s){t.getView().getModel().update(t.getView().getBindingContext().getPath(),jQuery.extend(false,{},t.dataObject),{success:function(d,r){if(r.headers["sap-message"]){var a=JSON.parse(r.headers["sap-message"]);V._setValidatedMessages(t,a);V._setValidatedFields(t);}sap.m.MessageToast.show(u);t.saveSuccess=true;},error:function(e){if(e.responseText){var r=JSON.parse(e.responseText);V._setValidatedMessages(t,r.error.innererror.errordetails);V._setValidatedFields(t);}sap.m.MessageToast.show(s);},merge:false});}};});
