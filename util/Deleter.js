/*
 * Copyright (C) 2009-2022 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["fin/cash/bankmaster/manage/util/Validator"],function(V){"use strict";return{_deleteData:function(t,p,d,D){var a=$.Deferred();t.getView().getModel().remove(p,{success:function(o,r){if(r.headers["sap-message"]){var b=JSON.parse(r.headers["sap-message"]);V._setValidatedMessages(t,b);V._setValidatedFields(t);}sap.m.MessageToast.show(d);a.resolve("success");},error:function(e){if(e.responseText){var r=JSON.parse(e.responseText);V._setValidatedMessages(t,r.error.innererror.errordetails);V._setValidatedFields(t);}sap.m.MessageToast.show(D);a.resolve("error");},});return a.promise();}};});
